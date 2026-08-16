import { redirect } from "next/navigation";

export default async function TeacherDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") q.set(key, value);
  }
  const queryString = q.toString();
  redirect(`/teacher/classes${queryString ? `?${queryString}` : ""}`);
}
