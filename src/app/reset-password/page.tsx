"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token de redefinição inválido ou ausente.");
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 8) {
        setError("A senha deve ter pelo menos 8 caracteres.");
        return;
    }

    setLoading(true);
    setError("");

    try {
      await authClient.resetPassword({
        newPassword: password,
        token: token,
      }, {
        onSuccess: () => {
          setSuccess(true);
          setLoading(false);
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Erro ao redefinir senha. O link pode ter expirado.");
          setLoading(false);
        }
      });
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Ocorreu um erro inesperado.");
      setLoading(false);
    }
  };

  if (success) {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundColor: '#f0f4f8',
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '24px 24px'
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
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundColor: '#f0f4f8',
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
      >
      <Card className="w-full max-w-md rounded-md shadow-xl z-10">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Definir Nova Senha</CardTitle>
          <CardDescription>
            Escolha uma senha segura para o seu acesso
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleReset}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                className="rounded-sm"
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!token || loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                className="rounded-sm"
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={!token || loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t-0">
            <Button className="w-full rounded-sm" type="submit" disabled={loading || !token}>
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
