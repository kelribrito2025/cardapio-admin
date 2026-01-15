import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Register() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Conta criada com sucesso! Faça login para continuar.");
      setLocation("/login");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao criar conta. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (!acceptTerms) {
      toast.error("Você deve aceitar os termos de uso.");
      return;
    }

    registerMutation.mutate({ name, email, password });
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Criar Conta</h2>
          <p className="text-gray-600">Preencha os dados para começar</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4 text-gray-500" />
              Nome completo
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
            />
          </div>

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
                placeholder="Mínimo 6 caracteres"
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

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Lock className="h-4 w-4 text-gray-500" />
              Confirmar senha
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2 pt-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              className="mt-0.5 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
              Eu aceito os{" "}
              <a href="#" className="text-primary hover:underline">Termos de Uso</a>
              {" "}e a{" "}
              <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
            </Label>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200 mt-2"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Criando conta...
              </>
            ) : (
              <>
                Criar conta
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Login link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Fazer login
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
