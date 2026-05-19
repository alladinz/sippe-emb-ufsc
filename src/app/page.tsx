import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

export default async function HomePage() {
  const session = await auth.api.getSession();

  if (session) {
    redirect("/dashboard");
  }

  redirect("/login");
}
