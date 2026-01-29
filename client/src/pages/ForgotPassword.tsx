import { useState } from "react";
import { Link } from "wouter";
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle, UtensilsCrossed } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setEmailSent(true);
      toast.success("Email de recuperação enviado!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao enviar email. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Por favor, informe seu email.");
      return;
    }

    forgotPasswordMutation.mutate({ email });
  };

  if (emailSent) {
    return (
      <AuthLayout>
        {/* Success state */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email enviado!</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Enviamos um link de recuperação para <strong className="text-gray-700">{email}</strong>. 
            Verifique sua caixa de entrada e siga as instruções.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => setEmailSent(false)}
              variant="outline"
              className="w-full h-12 rounded-xl border-gray-200"
            >
              Tentar outro email
            </Button>
            <Link href="/login">
              <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao login
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Logo - visible on mobile */}
      <div className="flex items-center gap-3 mb-8 lg:mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
          <UtensilsCrossed className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900">Mindi</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Esqueceu a senha?</h2>
        <p className="text-gray-500">Informe seu email para recuperar o acesso à sua conta</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={forgotPasswordMutation.isPending}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200"
        >
          {forgotPasswordMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Enviar link de recuperação
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Back to login */}
      <div className="mt-6 text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
      </div>

      {/* Privacy policy */}
      <p className="mt-4 text-center text-xs text-gray-400">
        Ao continuar, você concorda com nossa{" "}
        <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
      </p>
    </AuthLayout>
  );
}
