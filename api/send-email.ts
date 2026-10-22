import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Normalizar la clave privada tal como suele pegarse en Vercel:
// con las comillas del JSON, una coma final, "\n" escapados
// o saltos de línea de Windows
function normalizePrivateKey(rawKey: string | undefined) {
  if (!rawKey) {
    return undefined;
  }

  let key = rawKey.trim();

  if (key.endsWith(",")) {
    key = key.slice(0, -1).trim();
  }

  const firstChar = key[0];
  const lastChar = key[key.length - 1];

  if (
    key.length >= 2 &&
    (firstChar === '"' || firstChar === "'") &&
    lastChar === firstChar
  ) {
    key = key.slice(1, -1);
  }

  return key.replace(/\\n/g, "\n").replace(/\r/g, "");
}

// Describir la forma de la clave sin mostrar su contenido
function describePrivateKey(key: string) {
  return {
    length: key.length,
    lineCount: key.split("\n").length,
    hasBeginMarker: /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(key),
    hasEndMarker: /-----END [A-Z ]*PRIVATE KEY-----/.test(key),
  };
}

// Extraer los datos útiles de un error para los logs de Vercel
function describeError(error: unknown) {
  if (!(error instanceof Error)) {
    return { value: String(error) };
  }

  const { code, details, cause } = error as Error & {
    code?: unknown;
    details?: unknown;
    cause?: unknown;
  };

  return {
    name: error.name,
    message: error.message,
    code,
    details,
    cause:
      cause instanceof Error
        ? { name: cause.name, message: cause.message }
        : cause,
    stack: error.stack,
  };
}

// Inicializar Firebase Admin
function initializeFirebaseAdmin() {
  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    // Indicar qué variables faltan, sin mostrar sus valores
    const missing = [
      !projectId && "FIREBASE_PROJECT_ID",
      !clientEmail && "FIREBASE_CLIENT_EMAIL",
      !privateKey && "FIREBASE_PRIVATE_KEY",
    ].filter(Boolean);

    throw new Error(
      `Faltan credenciales de Firebase Admin: ${missing.join(", ")}`
    );
  }

  let credential;

  try {
    credential = cert({
      projectId,
      clientEmail,
      privateKey,
    });
  } catch (error) {
    console.error(
      "No se pudo leer FIREBASE_PRIVATE_KEY:",
      describePrivateKey(privateKey)
    );

    throw error;
  }

  return initializeApp({
    credential,
  });
}

// Configurar Amazon SES
const ses = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
});

// Función backend de Vercel (Serverless Function)
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Método no permitido. Utilice POST.",
    });
  }

  // Verificar encabezado de autenticación
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "No autorizado. Token Bearer requerido.",
    });
  }

  let stage = "firebase-init";

  try {
    const app = initializeFirebaseAdmin();
    const token = authorization.substring(7);

    // Verificar el token de Firebase del usuario
    let decodedToken;
    try {
      decodedToken = await getAuth(app).verifyIdToken(token);
    } catch (error) {
      console.error(
        "Error al verificar token de Firebase:",
        describeError(error)
      );

      return res.status(401).json({
        error: "Sesión inválida o expirada. Por favor vuelva a iniciar sesión.",
      });
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    if (!userEmail) {
      return res.status(400).json({
        error: "No se encontró una dirección de correo electrónico asociada a tu cuenta.",
      });
    }

    // Verificar configuración del remitente en SES
    stage = "ses-config";
    const fromEmail = process.env.SES_FROM_EMAIL?.trim();

    if (!fromEmail) {
      throw new Error("Falta configurar la variable de entorno SES_FROM_EMAIL en Vercel.");
    }

    // Obtener las tareas del usuario desde Firestore
    stage = "firestore-fetch-tasks";
    const database = getFirestore(app);

    const tasksSnapshot = await database
      .collection("users")
      .doc(userId)
      .collection("tasks")
      .get();

    interface TaskSummaryItem {
      id: string;
      title: string;
      description: string;
      completed: boolean;
    }

    const tasks: TaskSummaryItem[] = tasksSnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: typeof data.title === "string" ? data.title : "Sin título",
        description: typeof data.description === "string" ? data.description : "",
        completed: Boolean(data.completed),
      };
    });

    const pendingTasks = tasks.filter((t) => !t.completed);
    const completedTasks = tasks.filter((t) => t.completed);

    // Armar versión en texto plano
    const pendingText =
      pendingTasks.length > 0
        ? pendingTasks
            .map(
              (t, i) =>
                `  ${i + 1}. [ ] ${t.title}${
                  t.description ? `\n     Detalles: ${t.description}` : ""
                }`
            )
            .join("\n\n")
        : "  ¡Excelente! No tenés tareas pendientes.";

    const completedText =
      completedTasks.length > 0
        ? completedTasks
            .map(
              (t, i) =>
                `  ${i + 1}. [✓] ${t.title}${
                  t.description ? `\n     Detalles: ${t.description}` : ""
                }`
            )
            .join("\n\n")
        : "  Aún no completaste tareas.";

    const plainTextBody =
      `¡Hola!\n\n` +
      `Te enviamos el resumen actualizado de tus tareas en MateCode Tasks:\n\n` +
      `📊 ESTADÍSTICAS:\n` +
      `• Total de tareas registradas: ${tasks.length}\n` +
      `• Tareas pendientes: ${pendingTasks.length}\n` +
      `• Tareas completadas: ${completedTasks.length}\n\n` +
      `⏳ TAREAS PENDIENTES (${pendingTasks.length}):\n` +
      `${pendingText}\n\n` +
      `✅ TAREAS COMPLETADAS (${completedTasks.length}):\n` +
      `${completedText}\n\n` +
      `Podés ingresar en cualquier momento a MateCode Tasks para continuar organizando tus actividades.\n\n` +
      `¡Muchos éxitos!\n` +
      `El equipo de MateCode Tasks`;

    // Armar versión en HTML estilizado
    const pendingHtmlItems =
      pendingTasks.length > 0
        ? pendingTasks
            .map(
              (t) => `
            <div style="background-color: #ffffff; border: 1px solid #dbe2ed; border-left: 4px solid #c43f50; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px;">
              <div style="font-weight: 600; font-size: 15px; color: #202b40;">${escapeHtml(t.title)}</div>
              ${
                t.description
                  ? `<div style="font-size: 13px; color: #64748b; margin-top: 4px; line-height: 1.4;">${escapeHtml(t.description)}</div>`
                  : ""
              }
            </div>`
            )
            .join("")
        : `<p style="color: #64748b; font-size: 14px; font-style: italic; margin: 8px 0;">¡Excelente! No tenés ninguna tarea pendiente.</p>`;

    const completedHtmlItems =
      completedTasks.length > 0
        ? completedTasks
            .map(
              (t) => `
            <div style="background-color: #ffffff; border: 1px solid #dbe2ed; border-left: 4px solid #147d69; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px;">
              <div style="font-weight: 600; font-size: 15px; color: #64748b; text-decoration: line-through;">${escapeHtml(t.title)}</div>
              ${
                t.description
                  ? `<div style="font-size: 13px; color: #94a3b8; margin-top: 4px; line-height: 1.4;">${escapeHtml(t.description)}</div>`
                  : ""
              }
            </div>`
            )
            .join("")
        : `<p style="color: #64748b; font-size: 14px; font-style: italic; margin: 8px 0;">Aún no tenés tareas marcadas como completadas.</p>`;

    const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Resumen de Tareas</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f4f6fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #202b40;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; border: 1px solid #dbe2ed; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); max-width: 600px;">
          
          <!-- ENCABEZADO -->
          <tr>
            <td style="padding: 32px 32px 20px; background-color: #ffffff; border-bottom: 1px solid #edf1f8;">
              <div style="color: #526da6; font-size: 12px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;">MateCode Tasks</div>
              <h1 style="margin: 8px 0 4px; font-size: 24px; color: #202b40;">Resumen de tus tareas</h1>
              <p style="margin: 0; font-size: 14px; color: #64748b;">Hola, acá tenés el estado actualizado de tu lista de pendientes.</p>
            </td>
          </tr>

          <!-- TARJETAS DE CONTADORES -->
          <tr>
            <td style="padding: 24px 32px 12px;">
              <table width="100%" border="0" cellspacing="8" cellpadding="0">
                <tr>
                  <td width="33%" align="center" style="background-color: #edf1f8; border-radius: 12px; padding: 16px 8px;">
                    <div style="font-size: 26px; font-weight: bold; color: #526da6;">${tasks.length}</div>
                    <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Total</div>
                  </td>
                  <td width="33%" align="center" style="background-color: #fff1f2; border-radius: 12px; padding: 16px 8px;">
                    <div style="font-size: 26px; font-weight: bold; color: #c43f50;">${pendingTasks.length}</div>
                    <div style="font-size: 12px; font-weight: 600; color: #c43f50; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Pendientes</div>
                  </td>
                  <td width="33%" align="center" style="background-color: #ecfdf5; border-radius: 12px; padding: 16px 8px;">
                    <div style="font-size: 26px; font-weight: bold; color: #147d69;">${completedTasks.length}</div>
                    <div style="font-size: 12px; font-weight: 600; color: #147d69; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Completadas</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TAREAS PENDIENTES -->
          <tr>
            <td style="padding: 16px 32px 12px;">
              <h2 style="margin: 0 0 14px; font-size: 16px; color: #202b40; border-bottom: 2px solid #edf1f8; padding-bottom: 8px;">
                ⏳ Tareas Pendientes (${pendingTasks.length})
              </h2>
              ${pendingHtmlItems}
            </td>
          </tr>

          <!-- TAREAS COMPLETADAS -->
          <tr>
            <td style="padding: 12px 32px 24px;">
              <h2 style="margin: 0 0 14px; font-size: 16px; color: #202b40; border-bottom: 2px solid #edf1f8; padding-bottom: 8px;">
                ✅ Tareas Completadas (${completedTasks.length})
              </h2>
              ${completedHtmlItems}
            </td>
          </tr>

          <!-- PIE DE CORREO -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #dbe2ed; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Este correo fue solicitado desde tu cuenta en <strong>MateCode Tasks</strong>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Enviar correo mediante AWS SES
    stage = "ses-send";
    let messageId: string | undefined;

    try {
      const result = await ses.send(
        new SendEmailCommand({
          Source: fromEmail,
          Destination: {
            ToAddresses: [userEmail],
          },
          Message: {
            Subject: {
              Data: `Resumen de tus tareas (${pendingTasks.length} pendientes) - MateCode Tasks`,
              Charset: "UTF-8",
            },
            Body: {
              Text: {
                Data: plainTextBody,
                Charset: "UTF-8",
              },
              Html: {
                Data: htmlBody,
                Charset: "UTF-8",
              },
            },
          },
        })
      );

      messageId = result.MessageId;
    } catch (sesError) {
      console.error("Error de Amazon SES:", describeError(sesError));

      return res.status(502).json({
        error:
          "Error al enviar el correo a través de Amazon SES. Si tu cuenta de AWS SES está en modo Sandbox, asegurate de que tanto el remitente como el correo destinatario estén verificados en AWS SES.",
        details: sesError instanceof Error ? sesError.message : String(sesError),
      });
    }

    // Registrar auditoría del envío en Firestore (sin bloquear futuros envíos)
    stage = "firestore-audit";
    try {
      const summaryAuditRef = database
        .collection("users")
        .doc(userId)
        .collection("system")
        .doc("task-summary-email");

      await summaryAuditRef.set(
        {
          status: "sent",
          email: userEmail,
          totalTasks: tasks.length,
          pendingTasks: pendingTasks.length,
          completedTasks: completedTasks.length,
          sesMessageId: messageId ?? null,
          sentAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (auditError) {
      console.warn("No se pudo registrar la auditoría en Firestore:", auditError);
    }

    return res.status(200).json({
      message: `¡Resumen de tareas enviado con éxito a ${userEmail}!`,
      totalTasks: tasks.length,
      pendingTasks: pendingTasks.length,
      completedTasks: completedTasks.length,
      sesMessageId: messageId,
    });
  } catch (error) {
    console.error("Error del backend en etapa:", stage, describeError(error));

    return res.status(500).json({
      error: "Ocurrió un error en el servidor al procesar el resumen de tareas.",
      stage,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

// Función auxiliar para sanitizar cadenas en HTML
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
