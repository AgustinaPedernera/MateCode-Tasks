
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Timestamp } from "firebase/firestore";

import Dashboard from "../pages/Dashboard";

import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from "../services/taskService";

// Usuario ficticio: no usamos una cuenta real.
vi.mock("../context/AuthContext", () => {
  const mockUser = {
    uid: "usuario-prueba",
    email: "prueba@example.com",
  };

  return {
    useAuth: () => ({
      user: mockUser,
    }),
  };
});

// Tema visual simulado.
vi.mock("../hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme: vi.fn(),
  }),
}));

// Navegación simulada.
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// Firebase Auth simulado.
vi.mock("firebase/auth", () => ({
  signOut: vi.fn(),
}));

vi.mock("../services/firebase", () => ({
  auth: {},
}));

// Servicios de tareas simulados.
// No se accede a Firestore durante estos tests.
vi.mock("../services/taskService", () => ({
  createTask: vi.fn().mockResolvedValue("tarea-creada-1"),
  getTasks: vi.fn().mockResolvedValue([]),
  updateTask: vi.fn().mockResolvedValue(undefined),
  deleteTask: vi.fn().mockResolvedValue(undefined),
}));

// Tarea ficticia para reutilizar en los tests.
const tareaPendiente = {
  id: "tarea-1",
  title: "Estudiar TypeScript",
  description: "Repasar interfaces",
  completed: false,
  createdAt: Timestamp.fromDate(new Date("2026-10-22")),
};

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Cada test comienza con valores conocidos.
    vi.mocked(getTasks).mockResolvedValue([]);
    vi.mocked(createTask).mockResolvedValue("tarea-creada-1");
    vi.mocked(updateTask).mockResolvedValue(undefined);
    vi.mocked(deleteTask).mockResolvedValue(undefined);
  });

  // TEST 1: formulario.
  it("muestra el formulario para crear una tarea", async () => {
    render(<Dashboard />);

    expect(
      screen.getByRole("heading", { name: "Nueva tarea" })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Título")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Descripción")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /agregar tarea/i })
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/todavía no tenés tareas/i)
    ).toBeInTheDocument();
  });

  // TEST 2: crear una tarea.
  it("permite crear una tarea con título y descripción", async () => {
    render(<Dashboard />);

    await screen.findByText(/todavía no tenés tareas/i);

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Estudiar React" },
    });

    fireEvent.change(screen.getByLabelText("Descripción"), {
      target: { value: "Repasar componentes y hooks" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /agregar tarea/i })
    );

    expect(createTask).toHaveBeenCalledWith(
      "usuario-prueba",
      "Estudiar React",
      "Repasar componentes y hooks"
    );

    expect(
      await screen.findByText("¡Tarea creada correctamente!")
    ).toBeInTheDocument();

    expect(getTasks).toHaveBeenCalledTimes(2);
  });

  // TEST 3: completar una tarea.
  it("permite marcar una tarea como completada", async () => {
    vi.mocked(getTasks).mockResolvedValue([tareaPendiente]);

    render(<Dashboard />);

    expect(
      await screen.findByText("Estudiar TypeScript")
    ).toBeInTheDocument();

    expect(
      screen.getByText("○ Pendiente")
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /completar/i })
    );

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith(
        "usuario-prueba",
        "tarea-1",
        { completed: true }
      );
    });
  });

  // TEST 4: editar una tarea.
  it("permite editar el título y la descripción", async () => {
    vi.mocked(getTasks).mockResolvedValue([tareaPendiente]);

    render(<Dashboard />);

    await screen.findByText("Estudiar TypeScript");

    // Entramos en modo edición.
    fireEvent.click(
      screen.getByRole("button", { name: /editar/i })
    );

    // Modificamos los datos.
    fireEvent.change(screen.getByLabelText("Editar título"), {
      target: { value: "Estudiar React avanzado" },
    });

    fireEvent.change(
      screen.getByLabelText("Editar descripción"),
      {
        target: { value: "Repasar hooks y componentes" },
      }
    );

    // Guardamos los cambios.
    fireEvent.click(
      screen.getByRole("button", { name: /guardar cambios/i })
    );

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith(
        "usuario-prueba",
        "tarea-1",
        {
          title: "Estudiar React avanzado",
          description: "Repasar hooks y componentes",
        }
      );
    });

    expect(
      await screen.findByText(
        "¡Tarea actualizada correctamente!"
      )
    ).toBeInTheDocument();
  });

  // TEST 5: eliminar una tarea.
  it("permite eliminar una tarea después de confirmar", async () => {
    vi.mocked(getTasks).mockResolvedValue([tareaPendiente]);

    // Simulamos que el usuario acepta la confirmación.
    const confirmMock = vi
      .spyOn(window, "confirm")
      .mockReturnValue(true);

    try {
      render(<Dashboard />);

      await screen.findByText("Estudiar TypeScript");

      fireEvent.click(
        screen.getByRole("button", { name: "Eliminar" })
      );

      expect(confirmMock).toHaveBeenCalled();

      await waitFor(() => {
        expect(deleteTask).toHaveBeenCalledWith(
          "usuario-prueba",
          "tarea-1"
        );
      });

      expect(
        await screen.findByText(
          "Tarea eliminada correctamente."
        )
      ).toBeInTheDocument();
    } finally {
      confirmMock.mockRestore();
    }
  });

  // TEST 6: impedir títulos vacíos.
  it("no permite crear una tarea con el título vacío", async () => {
    render(<Dashboard />);

    await screen.findByText(/todavía no tenés tareas/i);

    const titulo = screen.getByLabelText("Título");

    expect(titulo).toBeRequired();

    // Un título con espacios tampoco debe guardarse.
    fireEvent.change(titulo, {
      target: { value: "   " },
    });

    fireEvent.submit(titulo.closest("form")!);

    expect(createTask).not.toHaveBeenCalled();
  });
});
