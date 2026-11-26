import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { LoginClient } from "./login-client";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth.api.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return <LoginClient />;
}
