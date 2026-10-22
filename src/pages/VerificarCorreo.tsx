
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  reload,
  sendEmailVerification,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";

function VerificarCorreo() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState(false);

  async function comprobarVerificacion() {
    if (!user) return;

    setProcesando(true);
    setMensaje("");

    try {
      await reload(user);

      if (user.emailVerified) {
        window.location.assign("/dashboard");
      } else {
        setMensaje(
          "Tu correo todavía no está verificado. Revisá tu bandeja de entrada y la carpeta de spam."
        );
      }
    } catch (error) {
      console.error("Error al comprobar el correo:", error);
      setMensaje(
        "No pudimos comprobar la verificación. Intentá nuevamente."
      );
    } finally {
      setProcesando(false);
    }
  }

  async function reenviarCorreo() {
    if (!user) return;

    setProcesando(true);
    setMensaje("");

    try {
      await sendEmailVerification(user);
      setMensaje(
        "Te enviamos un nuevo correo de verificación. Revisá tu bandeja de entrada."
      );
    } catch (error) {
      console.error("Error al reenviar el correo:", error);
      setMensaje(
        "No pudimos reenviar el correo. Esperá unos minutos e intentá nuevamente."
      );
    } finally {
      setProcesando(false);
    }
  }

  if (loading) {
    return <p>Comprobando sesión...</p>;
  }

  if (!user) {
    return (
      <main>
        <p>Necesitás iniciar sesión para verificar tu correo.</p>
        <button onClick={() => navigate("/login")}>
          Ir a iniciar sesión
        </button>
      </main>
    );
  }

  return (
    <main>
      <h1>Verificá tu correo electrónico</h1>

      <p>
        Te enviamos un correo de verificación a{" "}
        <strong>{user.email}</strong>.
      </p>

      <p>
        Revisá tu bandeja de entrada y la carpeta de spam.
        Abrí el enlace del correo para verificar tu cuenta.
      </p>

      <button
        type="button"
        onClick={comprobarVerificacion}
        disabled={procesando}
      >
        Ya lo verifiqué
      </button>

      <button
        type="button"
        onClick={reenviarCorreo}
        disabled={procesando}
      >
        Reenviar correo
      </button>

      {mensaje && <p role="status">{mensaje}</p>}
    </main>
  );
}

export default VerificarCorreo;
