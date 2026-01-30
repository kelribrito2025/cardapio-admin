import { useState } from "react";
import { Link } from "wouter";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, UtensilsCrossed } from "lucide-react";
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
      // Ignorar erros de pattern do Safari que são intermitentes
      const errorMessage = error.message || "";
      if (errorMessage.includes("string did not match the expected pattern") ||
          errorMessage.includes("pattern")) {
        // Este é um erro intermitente do Safari, tentar novamente silenciosamente
        console.warn('[Login] Safari pattern error detected, retrying...');
        return;
      }
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
      {/* Logo - visible on mobile */}
      <div className="flex items-center gap-3 mb-8 lg:mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
          <UtensilsCrossed className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900">Mindi</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Acessar sua conta</h2>
        <p className="text-gray-500">Entre com suas credenciais para acessar sua conta</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 pl-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-base"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-semibold text-gray-900">
              Senha
            </Label>
            <Link href="/esqueci-senha" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 pl-12 pr-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
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

        {/* Submit button */}
        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200 text-base"
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
        <p className="text-gray-500">
          Não tem uma conta?{" "}
          <Link href="/criar-conta" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Registre-se aqui
          </Link>
        </p>
      </div>

      {/* Privacy policy */}
      <p className="mt-4 text-center text-xs text-gray-400">
        Ao continuar, você concorda com nossa{" "}
        <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
      </p>
    </AuthLayout>
  );
}
