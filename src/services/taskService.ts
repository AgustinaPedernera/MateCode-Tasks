
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";
import type { Task } from "../types/task";

// Obtener la colección de tareas de un usuario
function getTasksCollection(userId: string) {
  return collection(db, "users", userId, "tasks");
}

// CREATE: crear una tarea
export async function createTask(
  userId: string,
  title: string,
  description: string
): Promise<string> {
  const tasksRef = getTasksCollection(userId);

  const newTask = await addDoc(tasksRef, {
    title,
    description,
    completed: false,
    createdAt: serverTimestamp(),
  });

  return newTask.id;
}

// READ: obtener las tareas del usuario
export async function getTasks(
  userId: string
): Promise<Task[]> {
  const tasksRef = getTasksCollection(userId);
  const snapshot = await getDocs(tasksRef);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  })) as Task[];
}

// UPDATE: modificar una tarea
export async function updateTask(
  userId: string,
  taskId: string,
  changes: Partial<Pick<Task, "title" | "description" | "completed">>
): Promise<void> {
  const taskRef = doc(db, "users", userId, "tasks", taskId);

  await updateDoc(taskRef, changes);
}

// DELETE: eliminar una tarea
export async function deleteTask(
  userId: string,
  taskId: string
): Promise<void> {
  const taskRef = doc(db, "users", userId, "tasks", taskId);

  await deleteDoc(taskRef);
}
