
import { describe, expect, it, vi } from "vitest";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { createTask } from "../services/taskService";

// Simulamos la conexión a Firebase.
vi.mock("../services/firebase", () => ({
  db: {},
}));

// Simulamos las funciones de Firestore.
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "coleccion-simulada"),
  addDoc: vi.fn(async () => ({ id: "tarea-123" })),
  serverTimestamp: vi.fn(() => "fecha-simulada"),
}));

describe("Servicio de tareas", () => {
  it("crea una tarea pendiente y devuelve su identificador", async () => {
    const taskId = await createTask(
      "usuario-prueba",
      "Estudiar React",
      "Repasar componentes"
    );

    // Comprueba que se utiliza la colección del usuario.
    expect(collection).toHaveBeenCalledWith(
      {},
      "users",
      "usuario-prueba",
      "tasks"
    );

    // Comprueba los datos enviados a Firestore.
    expect(addDoc).toHaveBeenCalledWith(
      "coleccion-simulada",
      {
        title: "Estudiar React",
        description: "Repasar componentes",
        completed: false,
        createdAt: "fecha-simulada",
      }
    );

    // Comprueba que devuelve el ID generado.
    expect(taskId).toBe("tarea-123");

    expect(serverTimestamp).toHaveBeenCalled();
  });
});
