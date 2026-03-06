import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle, UtensilsCrossed, Lock, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Step = "email" | "newPassword" | "success";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const verifyEmailMutation = trpc.auth.verifyResetEmail.useMutation({
    onSuccess: () => {
      setStep("newPassword");
      toast.success("Email verificado! Defina sua nova senha.");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Email não encontrado. Verifique e tente novamente.");
    },
  });

  const resetPasswordMutation = trpc.auth.directResetPassword.useMutation({
    onSuccess: () => {
      setStep("success");
      toast.success("Senha alterada com sucesso!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao alterar senha. Tente novamente.");
    },
  });

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor, informe seu email.");
      return;
    }
    verifyEmailMutation.mutate({ email });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("Por favor, informe a nova senha.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    resetPasswordMutation.mutate({ email, newPassword });
  };

  // Success state
  if (step === "success") {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Senha alterada!</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Sua senha foi alterada com sucesso. Agora você pode fazer login com a nova senha.
          </p>
          <Link href="/login">
            <Button className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 text-base">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Ir para o login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // New password step
  if (step === "newPassword") {
    return (
      <AuthLayout>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 lg:mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-foreground">Mindi</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Nova senha</h2>
          <p className="text-muted-foreground">
            Defina uma nova senha para <strong className="text-foreground">{email}</strong>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-5">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-semibold text-foreground">
              Nova senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-14 pl-12 pr-12 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
              Confirmar senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-14 pl-12 pr-12 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
            )}
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={resetPasswordMutation.isPending || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200 text-base"
          >
            {resetPasswordMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Alterando...
              </>
            ) : (
              <>
                Alterar senha
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Back */}
        <div className="mt-6 text-center">
          <button
            onClick={() => { setStep("email"); setNewPassword(""); setConfirmPassword(""); }}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Usar outro email
          </button>
        </div>
      </AuthLayout>
    );
  }

  // Email step (default)
  return (
    <AuthLayout>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 lg:mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
          <UtensilsCrossed className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-foreground">Mindi</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Esqueceu a senha?</h2>
        <p className="text-muted-foreground">Informe seu email para recuperar o acesso à sua conta</p>
      </div>

      {/* Form */}
      <form onSubmit={handleVerifyEmail} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 pl-12 rounded-xl border-border bg-muted/50 focus:bg-card focus:border-primary focus:ring-primary/20 text-base"
            />
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={verifyEmailMutation.isPending}
          className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200 text-base"
        >
          {verifyEmailMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Back to login */}
      <div className="mt-6 text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
      </div>

      {/* Privacy policy */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Ao continuar, você concorda com nossa{" "}
        <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
      </p>
    </AuthLayout>
  );
}
