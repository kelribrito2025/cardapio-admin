import { useState } from "react";
import { Link } from "wouter";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.loginWithEmail.useMutation({
    onSuccess: async () => {
      toast.success("Login realizado com sucesso!");
      // Invalidar o cache de autenticação para forçar nova verificação
      await utils.auth.me.invalidate();
      // Usar window.location para garantir reload completo do estado
      window.location.href = "/";
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao fazer login. Verifique suas credenciais.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    loginMutation.mutate({ email, password, rememberMe });
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acessar Conta</h2>
          <p className="text-gray-600">Digite suas credenciais para acessar</p>
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

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Lock className="h-4 w-4 text-gray-500" />
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                Lembrar-me
              </Label>
            </div>
            <Link href="/esqueci-senha" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Esqueceu a senha?
            </Link>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200"
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                Entrar
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Sign up link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Ainda não tem uma conta?{" "}
            <Link href="/criar-conta" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </div>

      {/* Mobile logo */}
      <div className="lg:hidden mt-8 text-center">
        <p className="text-sm text-gray-500">© 2025 Cardápio Admin</p>
      </div>
    </AuthLayout>
  );
}
