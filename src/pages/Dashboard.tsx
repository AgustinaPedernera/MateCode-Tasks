
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { auth } from "../services/firebase";

import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from "../services/taskService";

import type { Task } from "../types/task";

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Estados de las tareas
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Estados de edición
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Estados de carga y mensajes
  const [loading, setLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // READ: cargar las tareas del usuario
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoadingTasks(false);
      return;
    }

    let active = true;

    async function loadTasks(userId: string) {
      setLoadingTasks(true);
      setError("");

      try {
        const data = await getTasks(userId);

        if (active) {
          setTasks(data);
        }
      } catch {
        if (active) {
          setError("No se pudieron cargar las tareas.");
        }
      } finally {
        if (active) {
          setLoadingTasks(false);
        }
      }
    }

    loadTasks(user.uid);

    return () => {
      active = false;
    };
  }, [user]);

  // CREATE: crear una tarea
  async function handleCreateTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user || loading || !title.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await createTask(
        user.uid,
        title.trim(),
        description.trim()
      );

      const updatedTasks = await getTasks(user.uid);
      setTasks(updatedTasks);

      setTitle("");
      setDescription("");
      setSuccess("¡Tarea creada correctamente!");
    } catch {
      setError("No se pudo crear o actualizar la lista de tareas.");
    } finally {
      setLoading(false);
    }
  }

  // UPDATE: cambiar el estado de una tarea
  async function handleToggleTask(task: Task) {
    if (!user || savingTaskId) return;

    setSavingTaskId(task.id);
    setError("");
    setSuccess("");

    try {
      await updateTask(user.uid, task.id, {
        completed: !task.completed,
      });

      const updatedTasks = await getTasks(user.uid);
      setTasks(updatedTasks);
    } catch {
      setError("No se pudo actualizar el estado de la tarea.");
    } finally {
      setSavingTaskId(null);
    }
  }

  // UPDATE: comenzar a editar
  function handleStartEdit(task: Task) {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setError("");
    setSuccess("");
  }

  // Cancelar la edición
  function handleCancelEdit() {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDescription("");
  }

  // UPDATE: guardar los cambios
  async function handleSaveEdit(taskId: string) {
    if (!user || !editTitle.trim() || savingTaskId) return;

    setSavingTaskId(taskId);
    setError("");
    setSuccess("");

    try {
      await updateTask(user.uid, taskId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });

      const updatedTasks = await getTasks(user.uid);
      setTasks(updatedTasks);

      handleCancelEdit();
      setSuccess("¡Tarea actualizada correctamente!");
    } catch {
      setError("No se pudo guardar la edición.");
    } finally {
      setSavingTaskId(null);
    }
  }

  // DELETE: eliminar una tarea
  async function handleDeleteTask(taskId: string) {
    if (!user || savingTaskId) return;

    const confirmed = window.confirm(
      "¿Estás segura de que querés eliminar esta tarea?"
    );

    if (!confirmed) return;

    setSavingTaskId(taskId);
    setError("");
    setSuccess("");

    try {
      await deleteTask(user.uid, taskId);

      const updatedTasks = await getTasks(user.uid);
      setTasks(updatedTasks);

      if (editingTaskId === taskId) {
        handleCancelEdit();
      }

      setSuccess("Tarea eliminada correctamente.");
    } catch {
      setError("No se pudo eliminar la tarea.");
    } finally {
      setSavingTaskId(null);
    }
  }

  // Cerrar sesión
  async function handleLogout() {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch {
      setError("No se pudo cerrar sesión.");
    }
  }

  // Enviar resumen de tareas por correo vía AWS SES
  async function handleSendEmailSummary() {
    if (!user || sendingEmail) return;

    setSendingEmail(true);
    setError("");
    setSuccess("");

    try {
      const token = await user.getIdToken();

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "No se pudo enviar el correo con el resumen de tareas."
        );
      }

      setSuccess(
        data?.message ||
          `¡Resumen de tareas enviado con éxito a ${user.email}!`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error inesperado al solicitar el envío del resumen."
      );
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <main className="dashboard">
      {/* ENCABEZADO */}
      <header className="dashboard-header">
        <div>
          <p className="dashboard-brand">MateCode Tasks</p>

          <h1>Mi panel de tareas</h1>

          <p className="dashboard-subtitle">
            Organizá tus pendientes y seguí avanzando.
          </p>

          <p className="dashboard-subtitle">
            Sesión iniciada como:{" "}
            <strong>{user?.email}</strong>
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSendEmailSummary}
            disabled={sendingEmail || loadingTasks}
            title="Enviar un correo con el resumen de todas tus tareas actuales"
          >
            {sendingEmail
              ? "Enviando resumen..."
              : "📧 Enviar resumen por correo"}
          </button>

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
            {theme === "dark"
              ? "☀️ Modo claro"
              : "🌙 Modo oscuro"}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* MENSAJES */}
      {error && (
        <p className="feedback error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="feedback success" role="status">
          {success}
        </p>
      )}

      <div className="dashboard-grid">
        {/* FORMULARIO PARA CREAR TAREAS */}
        <section
          className="dashboard-card"
          aria-labelledby="create-task-title"
        >
          <h2 id="create-task-title">Nueva tarea</h2>

          <form
            className="task-form"
            onSubmit={handleCreateTask}
          >
            <div className="form-field">
              <label htmlFor="task-title">
                Título
              </label>

              <input
                id="task-title"
                type="text"
                placeholder="Ej. Estudiar React"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="task-description">
                Descripción
              </label>

              <textarea
                id="task-description"
                placeholder="Agregá los detalles de tu tarea..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading
                ? "Guardando..."
                : "+ Agregar tarea"}
            </button>
          </form>
        </section>

        {/* LISTADO DE TAREAS */}
        <section
          className="dashboard-card"
          aria-labelledby="tasks-title"
        >
          <h2 id="tasks-title">Mis tareas</h2>

          {loadingTasks ? (
            <p>Cargando tareas...</p>
          ) : tasks.length === 0 ? (
            <p className="empty-state">
              Todavía no tenés tareas.
              ¡Creá la primera!
            </p>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <li
                  className="task-item"
                  key={task.id}
                >
                  {editingTaskId === task.id ? (
                    // MODO EDICIÓN
                    <div className="task-form">
                      <div className="form-field">
                        <label
                          htmlFor={`edit-title-${task.id}`}
                        >
                          Editar título
                        </label>

                        <input
                          id={`edit-title-${task.id}`}
                          type="text"
                          maxLength={120}
                          value={editTitle}
                          onChange={(e) =>
                            setEditTitle(e.target.value)
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label
                          htmlFor={`edit-description-${task.id}`}
                        >
                          Editar descripción
                        </label>

                        <textarea
                          id={`edit-description-${task.id}`}
                          value={editDescription}
                          onChange={(e) =>
                            setEditDescription(e.target.value)
                          }
                        />
                      </div>

                      <div className="task-buttons">
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={
                            !editTitle.trim() ||
                            savingTaskId !== null
                          }
                          onClick={() =>
                            handleSaveEdit(task.id)
                          }
                        >
                          {savingTaskId === task.id
                            ? "Guardando..."
                            : "Guardar cambios"}
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={savingTaskId !== null}
                          onClick={handleCancelEdit}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // MODO VISUALIZACIÓN
                    <>
                      <h3>{task.title}</h3>

                      {task.description && (
                        <p className="task-description">
                          {task.description}
                        </p>
                      )}

                      <span
                        className={`task-status ${
                          task.completed
                            ? "completed"
                            : ""
                        }`}
                      >
                        {task.completed
                          ? "✓ Completada"
                          : "○ Pendiente"}
                      </span>

                      <div className="task-buttons">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={savingTaskId !== null}
                          onClick={() =>
                            handleToggleTask(task)
                          }
                        >
                          {task.completed
                            ? "Marcar pendiente"
                            : "✓ Completar"}
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={savingTaskId !== null}
                          onClick={() =>
                            handleStartEdit(task)
                          }
                        >
                          ✏️ Editar
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger"
                          disabled={savingTaskId !== null}
                          onClick={() =>
                            handleDeleteTask(task.id)
                          }
                        >
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default Dashboard;
