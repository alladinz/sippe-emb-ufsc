"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api, { setAccessToken, extractApiErrorMessage } from "@/lib/api";
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
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, KeyRound, Eye, EyeOff, AlertCircle } from "lucide-react";
import { requestPasswordResetAction } from "./actions";

export function LoginClient() {
  const [activeSemester, setActiveSemester] = useState<string | null | undefined>(
    undefined
  );

  useEffect(() => {
    fetch("/api/semestres/ativo")
      .then((r) => r.json())
      .then((data) => setActiveSemester(data?.semestre ?? null))
      .catch(() => setActiveSemester(null));
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  const router = useRouter();

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    if (newClicks >= 5) {
      setShowEasterEgg(true);
      setLogoClicks(0);
    } else {
      setLogoClicks(newClicks);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/login", {
        email: email.trim(),
        senha: password,
      });

      setAccessToken(data.accessToken);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const errorMessage = extractApiErrorMessage(
        err,
        "Ocorreu um erro ao fazer login. Tente novamente."
      );
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setResetError("");
      setResetSuccess(false);
    } else if (email.trim() && !resetEmail.trim()) {
      setResetEmail(email.trim());
    }
  };

  const handleResetRequest = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!resetEmail.trim() || resetLoading) return;

    setResetLoading(true);
    setResetError("");

    try {
      const result = await requestPasswordResetAction(resetEmail);
      if (!result.success) {
        setResetError(result.error || "Erro ao solicitar redefinição.");
        return;
      }

      setResetSuccess(true);
      setTimeout(() => {
        setIsDialogOpen(false);
        setResetSuccess(false);
        setResetEmail("");
      }, 5000);
    } catch (err) {
      setResetError(
        err instanceof Error ? err.message : "Erro ao solicitar redefinição."
      );
    } finally {
      setResetLoading(false);
    }
  };

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
        <CardHeader className="space-y-4">
          <div className="flex justify-center mb-2">
            <Image
              src="/brasao_CTJ-horizontal-color-fundo claro.png"
              alt="CTJ UFSC Logo"
              width={280}
              height={80}
              className="object-contain cursor-default select-none"
              priority
              onClick={handleLogoClick}
            />
          </div>

          <div className="flex justify-center">
            {activeSemester === undefined ? (
              <div className="h-6 w-40 bg-gray-100 rounded-full animate-pulse mb-4" />
            ) : activeSemester ? (
              <div className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1 mb-4 font-medium">
                <svg
                  className="w-3 h-3 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"
                  />
                </svg>
                Semestre ativo: {activeSemester}
              </div>
            ) : null}
          </div>

          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Sistema para Programas e Planos de Ensino
            </CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleLogin}>
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
              <Label htmlFor="email">E-mail</Label>
              <Input
                className="rounded-sm"
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Insira seu e-mail"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  className="rounded-sm pr-10"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Insira sua senha"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  required
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
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t-0">
            <Button
              className={`w-full rounded-sm flex items-center justify-center gap-2 ${
                loading ? "pointer-events-none opacity-80" : ""
              }`}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </CardFooter>
        </form>

        <div className="px-6 pb-6 flex justify-center">
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-slate-500 font-normal"
              >
                Primeiro acesso ou esqueceu a senha?
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] p-6 rounded-xl border border-slate-200/80 shadow-xl">
              {resetSuccess ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto border border-emerald-100">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[#102E52]">
                      Solicitação recebida!
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed px-2">
                      Se este e-mail estiver cadastrado, você receberá em instantes um
                      link seguro para cadastrar ou redefinir sua senha.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResetRequest}>
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-[#102E52] flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-[#023E8A]" />
                      Redefinir Senha
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Informe o e-mail institucional cadastrado no SIPPE. Enviaremos
                      um link seguro para que você possa definir sua senha inicial de
                      primeiro acesso ou redefinir sua senha atual.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-3 space-y-3">
                    {resetError && (
                      <div
                        role="alert"
                        className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                        <span>{resetError}</span>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="resetEmail"
                        className="text-xs font-semibold text-slate-700"
                      >
                        E-mail Institucional
                      </Label>
                      <Input
                        id="resetEmail"
                        type="email"
                        placeholder="seu@email.com"
                        value={resetEmail}
                        onChange={(e) => {
                          setResetEmail(e.target.value);
                          if (resetError) setResetError("");
                        }}
                        className="h-9 rounded-lg border-slate-200 text-xs focus-visible:ring-[#023E8A]"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogOpenChange(false)}
                      className="h-9 px-4 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={resetLoading || !resetEmail.trim()}
                      className="h-9 bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold px-4 text-xs rounded-lg"
                    >
                      {resetLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : null}
                      Enviar Link
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {showEasterEgg && (
        <div
          className="absolute bottom-9 left-0 right-0 text-center animate-in fade-in slide-in-from-bottom-2 duration-700 cursor-pointer z-0"
          onClick={() => setShowEasterEgg(false)}
        >
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
            Desenvolvido com ❤️ para a UFSC Joinville por Abdeel da Cruz
          </p>
        </div>
      )}

      <div className="fixed bottom-0 left-0 w-full h-1 z-50 bg-brand-blue" />
      <p className="fixed bottom-2 left-0 right-0 text-center text-xs text-gray-400 z-50 pointer-events-none">
        Sistema SIPPE · UFSC - CTJ
      </p>
    </div>
  );
}
