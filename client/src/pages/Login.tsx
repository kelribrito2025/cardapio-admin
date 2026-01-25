import { useState } from "react";
import { Link } from "wouter";
import { LogIn, Check, Eye, EyeOff, Loader2 } from "lucide-react";
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
      await utils.auth.me.invalidate();
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Lado Esquerdo - Card com Features */}
        <div className="hidden lg:block">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl transform rotate-6"></div>
            <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-12 text-white">
              <LogIn className="w-16 h-16 mb-6" />
              <h2 className="text-5xl font-black mb-4">Sistema de Gestão</h2>
              <p className="text-xl mb-8 text-white/90">
                Controle total do seu cardápio digital em uma plataforma moderna e intuitiva.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Dashboard Completo</h3>
                    <p className="text-white/80">Visualize todos os dados importantes em tempo real</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Gestão Inteligente</h3>
                    <p className="text-white/80">IA integrada para otimizar suas vendas</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Suporte Premium</h3>
                    <p className="text-white/80">Equipe sempre disponível para ajudar</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div>
          {/* Mobile - Card com gradiente simplificado */}
          <div className="lg:hidden mb-8 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6 text-white text-center">
            <LogIn className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold">Sistema de Gestão</h2>
            <p className="text-white/80 text-sm mt-1">Cardápio Digital</p>
          </div>

          <div className="mb-8">
            <h1 className="text-5xl font-black text-gray-900 mb-3">Login</h1>
            <p className="text-xl text-gray-600">Acesse sua conta para continuar</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-gray-900 font-bold mb-3 block text-lg">Email</label>
              <input
                type="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-900 font-bold text-lg">Senha</label>
                <Link href="/esqueci-senha" className="text-blue-600 hover:text-blue-700 font-medium">
                  Esqueceu?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-all pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                </button>
              </div>
            </div>
            <label className="flex items-center text-gray-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-3 w-5 h-5 rounded accent-blue-600" 
              />
              <span className="text-lg">Manter-me conectado</span>
            </label>
            <button 
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl text-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar no Sistema"
              )}
            </button>
            <div className="text-center pt-4">
              <p className="text-gray-600">
                Não tem uma conta?{" "}
                <Link href="/criar-conta" className="text-blue-600 hover:text-blue-700 font-bold">
                  Cadastre-se gratuitamente
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
