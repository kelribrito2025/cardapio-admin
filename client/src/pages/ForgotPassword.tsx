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
        <div className="p-6 md:p-8">
          {/* Success state */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email enviado!</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Enviamos um link de recuperação para <strong>{email}</strong>. 
              Verifique sua caixa de entrada e siga as instruções.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setEmailSent(false)}
                variant="outline"
                className="w-full h-11 rounded-xl border-gray-200"
              >
                Tentar outro email
              </Button>
              <Link href="/login">
                <Button className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="p-6 md:p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-[70px] h-[70px] bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
            <UtensilsCrossed className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Esqueceu a senha?</h2>
          <p className="text-gray-600">Informe seu email para recuperar o acesso</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Mail className="h-4 w-4 text-gray-500" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
            />
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
          <Link href="/login" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Link>
        </div>
      </div>

      {/* Mobile logo */}
      <div className="lg:hidden mt-8 text-center">
        <p className="text-sm text-gray-500">© 2025 Cardápio Admin</p>
      </div>
    </AuthLayout>
  );
}
