
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Inicializar Firebase Admin
function initializeFirebaseAdmin() {
  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Faltan credenciales de Firebase Admin");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

// Configurar Amazon SES
const ses = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
});

// Función backend de Vercel
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      error: "Método no permitido",
    });
  }

  // Verificar encabezado de autenticación
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "No autorizado",
    });
  }

  try {
    const app = initializeFirebaseAdmin();
    const token = authorization.substring(7);

    // Verificar el token de Firebase
    let decodedToken;

    try {
      decodedToken = await getAuth(app).verifyIdToken(token);
    } catch {
      return res.status(401).json({
        error: "Sesión inválida o expirada",
      });
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    if (!userEmail || !decodedToken.email_verified) {
      return res.status(403).json({
        error: "Se necesita un correo electrónico verificado",
      });
    }

    // Verificar configuración del remitente
    const fromEmail = process.env.SES_FROM_EMAIL;

    if (!fromEmail) {
      throw new Error("Falta configurar SES_FROM_EMAIL");
    }

    const database = getFirestore(app);

    const welcomeRef = database
      .collection("users")
      .doc(userId)
      .collection("system")
      .doc("welcome-email");

    // Reservar el envío de forma atómica
    const reserved = await database.runTransaction(
      async (transaction) => {
        const existing = await transaction.get(welcomeRef);

        if (existing.exists) {
          return false;
        }

        transaction.create(welcomeRef, {
          status: "processing",
          email: userEmail,
          createdAt: FieldValue.serverTimestamp(),
        });

        return true;
      }
    );

    if (!reserved) {
      return res.status(409).json({
        error: "El correo de bienvenida ya fue solicitado",
      });
    }

    // Enviar el correo con Amazon SES
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
              Data: "¡Bienvenida a MateCode Tasks!",
              Charset: "UTF-8",
            },
            Body: {
              Text: {
                Data:
                  "¡Hola!\n\n" +
                  "Gracias por registrarte en MateCode Tasks.\n\n" +
                  "Ya podés organizar tus tareas y seguir avanzando.\n\n" +
                  "¡Que disfrutes la aplicación!\n\n" +
                  "El equipo de MateCode Tasks",
                Charset: "UTF-8",
              },
            },
          },
        })
      );

      messageId = result.MessageId;
    } catch (error) {
      console.error("Error de Amazon SES:", error);

      // No liberar automáticamente la reserva:
      // un error de red no garantiza que SES no haya enviado el correo.
      try {
        await welcomeRef.update({
          status: "delivery_unknown",
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (updateError) {
        console.error(
          "No se pudo actualizar el estado del envío:",
          updateError
        );
      }

      return res.status(502).json({
        error: "No se pudo confirmar el envío del correo",
      });
    }

    // Registrar el envío aceptado por SES
    try {
      await welcomeRef.update({
        status: "sent",
        sesMessageId: messageId ?? null,
        sentAt: FieldValue.serverTimestamp(),
      });
    } catch (updateError) {
      console.error(
        "SES aceptó el mensaje, pero falló el registro:",
        updateError
      );

      return res.status(202).json({
        message:
          "SES aceptó el correo, pero no se pudo actualizar su registro",
      });
    }

    return res.status(200).json({
      message: "Correo de bienvenida aceptado por Amazon SES",
    });
  } catch (error) {
    console.error("Error del backend:", error);

    return res.status(500).json({
      error: "No se pudo procesar la solicitud",
    });
  }
}
