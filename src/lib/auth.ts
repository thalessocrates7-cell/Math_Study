import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "../db/client";
import type { Student } from "../db/schema";
import { getStudent } from "../server/students";
import { readAdmin, readStudentId } from "./session";

/** The signed-in student for this request, or null. */
export const currentStudent = cache(async (): Promise<Student | null> => {
  const id = await readStudentId();
  if (!id) return null;
  const db = await getDb();
  return (await getStudent(db, id)) ?? null;
});

export async function requireStudent(): Promise<Student> {
  const student = await currentStudent();
  if (!student) redirect("/signin");
  return student;
}

export const isAdmin = cache(async (): Promise<boolean> => readAdmin());

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin");
}
