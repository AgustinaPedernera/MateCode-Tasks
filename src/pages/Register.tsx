
import { useState } from "react";
import type { SubmitEvent } from "react";
import { Link } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword } from "firebase/auth";

import { auth } from "../services/firebase";
import { useTheme } from "../hooks/useTheme";

function Register() {
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      setSuccess("¡Cuenta creada correctamente!");
      setPassword("");
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/email-already-in-use":
            setError("Este correo electrónico ya está registrado.");
            break;

          case "auth/weak-password":
            setError(
              "La contraseña es demasiado débil. Probá con una más segura."
            );
            break;

          case "auth/invalid-email":
            setError("Ingresá un correo electrónico válido.");
            break;

          case "auth/too-many-requests":
            setError(
              "Demasiados intentos. Probá nuevamente más tarde."
            );
            break;

          default:
            setError(
              "No se pudo crear la cuenta. Intentá nuevamente."
            );
        }
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-top">
        <p className="auth-brand">MateCode Tasks</p>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={toggleTheme}
          aria-label={
            theme === "dark"
              ? "Activar tema claro"
              : "Activar tema oscuro"
          }
        >
          {theme === "dark" ? "☀️ Claro" : "🌙 Oscuro"}
        </button>
      </header>

      <section
        className="auth-card"
        aria-labelledby="register-title"
      >
        <h1 id="register-title">Crear cuenta</h1>

        <p className="auth-description">
          Registrate para comenzar a organizar tus tareas
          y mantener tus pendientes bajo control.
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="form-field">
            <label htmlFor="register-email">
              Correo electrónico
            </label>

            <input
              type="email"
              id="register-email"
              name="email"
              autoComplete="email"
              placeholder="tu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-password">
              Contraseña
            </label>

            <input
              type="password"
              id="register-password"
              name="password"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading
              ? "Creando cuenta..."
              : "Crear cuenta"}
          </button>
        </form>

        {error && (
          <p
            className="auth-message error"
            role="alert"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            className="auth-message success"
            role="status"
          >
            {success}
          </p>
        )}

        <p className="auth-footer">
          ¿Ya tenés una cuenta?{" "}
          <Link to="/login">
            Iniciá sesión
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Register;
