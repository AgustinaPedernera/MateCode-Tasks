
import { useState } from "react";
import type { SubmitEvent } from "react";
import { Link } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import {
  signInWithEmailAndPassword,
  reload,
} from "firebase/auth";

import { auth } from "../services/firebase";
import { useTheme } from "../hooks/useTheme";

function Login() {
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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      // Actualizamos los datos de Firebase para comprobar
      // si el usuario verificó su correo electrónico.
      await reload(user);

      setSuccess("¡Sesión iniciada correctamente!");
      setPassword("");
    } catch (err) {
      if (
        err instanceof FirebaseError &&
        err.code === "auth/invalid-credential"
      ) {
        setError("Correo electrónico o contraseña incorrectos.");
      } else if (
        err instanceof FirebaseError &&
        err.code === "auth/too-many-requests"
      ) {
        setError("Demasiados intentos. Probá nuevamente más tarde.");
      } else {
        setError("No se pudo completar el inicio de sesión. Intentá nuevamente.");
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

      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title">Bienvenida de nuevo</h1>

        <p className="auth-description">
          Iniciá sesión para organizar tus tareas y seguir avanzando.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="login-email">
              Correo electrónico
            </label>

            <input
              type="email"
              id="login-email"
              name="email"
              autoComplete="email"
              placeholder="tu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="login-password">
              Contraseña
            </label>

            <input
              type="password"
              id="login-password"
              name="password"
              autoComplete="current-password"
              placeholder="Ingresá tu contraseña"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        {error && (
          <p className="auth-message error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="auth-message success" role="status">
            {success}
          </p>
        )}

        <p className="auth-footer">
          ¿Todavía no tenés una cuenta?{" "}
          <Link to="/register">Registrate acá</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
