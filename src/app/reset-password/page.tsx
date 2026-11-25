"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token de redefinição inválido ou ausente.");
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || loading) return;

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError("A senha deve conter letras maiúsculas, minúsculas e números.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authClient.resetPassword(
        {
          newPassword: password,
          token: token,
        },
        {
          onSuccess: () => {
            setSuccess(true);
            setLoading(false);
          },
          onError: (ctx) => {
            setError(
              ctx.error.message ||
                "Erro ao redefinir senha. O link pode ter expirado."
            );
            setLoading(false);
          },
        }
      );
    } catch {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden"
        style={{
          backgroundColor: "#f0f4f8",
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <Card className="w-full max-w-md text-center rounded-md">
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Senha Redefinida!</CardTitle>
            <CardDescription>
              Sua nova senha foi salva com sucesso. Você já pode acessar o sistema.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-4 border-t-0">
            <Button className="w-full rounded-sm" asChild>
              <Link href="/login">Ir para Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundColor: "#f0f4f8",
        backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <Card className="w-full max-w-md rounded-md shadow-xl z-10">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Definir Nova Senha</CardTitle>
          <CardDescription>
            Escolha uma senha segura para o seu acesso (mínimo 8 caracteres, com
            maiúsculas, minúsculas e números)
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleReset}>
          <CardContent className="space-y-4">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium p-3 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  className="rounded-sm pr-10"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error && token) setError("");
                  }}
                  required
                  disabled={!token || loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  className="rounded-sm pr-10"
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error && token) setError("");
                  }}
                  required
                  disabled={!token || loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Ocultar confirmação" : "Mostrar confirmação"
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t-0">
            <Button
              className="w-full rounded-sm"
              type="submit"
              disabled={loading || !token}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Nova Senha
            </Button>
          </CardFooter>
        </form>
      </Card>
      <div className="fixed bottom-0 left-0 w-full h-1 z-50 bg-brand-blue" />
      <p className="fixed bottom-2 left-0 right-0 text-center text-xs text-gray-400 z-50 pointer-events-none">
        Sistema SIPPE · UFSC - CTJ
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8]">
          <Loader2 className="w-10 h-10 animate-spin text-brand-blue" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
