import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, ShoppingCart, CheckCircle2, Sparkles, Heart, Star, Zap, Package, Bell, ThumbsUp, Award, Gift, Coffee, Utensils, ChefHat } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

// Modelo 1: Minimalista com barra lateral colorida
const Toast1 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="flex items-center gap-3 bg-white rounded-lg shadow-xl border-l-4 border-red-600 p-4 min-w-[300px]">
      <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
        <Check className="w-5 h-5 text-white" />
      </div>
      <span className="text-gray-800 font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 2: Compacto com fundo vermelho sólido
const Toast2 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
    <div className="flex items-center gap-3 bg-red-600 rounded-xl shadow-xl p-4 min-w-[280px]">
      <CheckCircle2 className="w-6 h-6 text-white flex-shrink-0" />
      <span className="text-white font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 3: Card elegante com ícone grande
const Toast3 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in fade-in zoom-in-95 duration-300">
    <div className="bg-white rounded-2xl shadow-2xl p-5 min-w-[320px] border border-gray-100">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
          <ShoppingCart className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-gray-900 font-semibold">{message}</p>
          <p className="text-gray-500 text-sm mt-1">Adicionado com sucesso</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 -mt-1"><X className="w-5 h-5" /></button>
      </div>
    </div>
  </div>
);

// Modelo 4: Snackbar inferior com ação
const Toast4 = ({ message, onClose }: ToastProps) => (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
    <div className="flex items-center gap-4 bg-gray-900 rounded-full shadow-xl px-5 py-3 min-w-[320px]">
      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
        <Check className="w-5 h-5 text-white" />
      </div>
      <span className="text-white font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-red-400 hover:text-red-300 font-semibold text-sm uppercase">OK</button>
    </div>
  </div>
);

// Modelo 5: Notificação flutuante com progresso
const Toast5 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden min-w-[300px] border border-gray-100">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
          <Check className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1"><p className="text-gray-900 font-medium">{message}</p></div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
      </div>
      <div className="h-1 bg-red-600 animate-[shrink_3s_linear_forwards]" />
    </div>
  </div>
);

// Modelo 6: Badge flutuante compacto
const Toast6 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
    <div className="flex items-center gap-2 bg-red-600 text-white rounded-full shadow-xl px-4 py-2.5">
      <Check className="w-4 h-4" />
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-1 hover:bg-white/20 rounded-full p-0.5"><X className="w-4 h-4" /></button>
    </div>
  </div>
);

// Modelo 7: Glassmorphism
const Toast7 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 p-4 min-w-[300px]">
      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <span className="text-gray-800 font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 8: Neumorphism
const Toast8 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="flex items-center gap-3 bg-gray-100 rounded-2xl p-4 min-w-[300px]" style={{boxShadow: '8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff'}}>
      <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
        <Check className="w-5 h-5 text-white" />
      </div>
      <span className="text-gray-700 font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 9: Gradient Border
const Toast9 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="p-[2px] rounded-xl bg-gradient-to-r from-red-500 via-pink-500 to-red-500 min-w-[300px]">
      <div className="flex items-center gap-3 bg-white rounded-xl p-4">
        <CheckCircle2 className="w-6 h-6 text-red-500 flex-shrink-0" />
        <span className="text-gray-800 font-medium flex-1">{message}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
      </div>
    </div>
  </div>
);

// Modelo 10: Floating Card com sombra colorida
const Toast10 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="flex items-center gap-3 bg-white rounded-2xl p-4 min-w-[300px] shadow-[0_10px_40px_-10px_rgba(220,38,38,0.5)]">
      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
        <Heart className="w-5 h-5 text-white" />
      </div>
      <span className="text-gray-800 font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 11: Minimal Line
const Toast11 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-lg p-3 min-w-[280px]">
      <div className="w-2 h-8 bg-red-500 rounded-full" />
      <span className="text-gray-700 font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 12: Retro/Vintage
const Toast12 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-none p-4 min-w-[300px] shadow-[4px_4px_0px_0px_rgba(180,83,9,0.3)]">
      <Star className="w-6 h-6 text-amber-600 flex-shrink-0" />
      <span className="text-amber-900 font-bold flex-1">{message}</span>
      <button onClick={onClose} className="text-amber-600 hover:text-amber-800"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 13: Dark Mode Elegante
const Toast13 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="flex items-center gap-3 bg-gray-900 rounded-xl p-4 min-w-[300px] border border-gray-800">
      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
        <Zap className="w-5 h-5 text-red-400" />
      </div>
      <span className="text-gray-100 font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 14: Pill com ícone animado
const Toast14 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
    <div className="flex items-center gap-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full px-5 py-3 min-w-[280px] shadow-lg">
      <div className="animate-bounce"><Package className="w-5 h-5 text-white" /></div>
      <span className="text-white font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 15: Card com Avatar
const Toast15 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="flex items-center gap-3 bg-white rounded-2xl shadow-xl p-4 min-w-[320px] border border-gray-100">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">🍣</div>
      <div className="flex-1">
        <p className="text-gray-900 font-semibold">{message}</p>
        <p className="text-gray-500 text-sm">Seu pedido foi atualizado</p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 16: Slide lateral esquerdo
const Toast16 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 left-4 z-50 animate-in slide-in-from-left-5 duration-300">
    <div className="flex items-center gap-3 bg-red-600 rounded-r-xl rounded-l-none p-4 min-w-[280px] shadow-xl">
      <Bell className="w-5 h-5 text-white flex-shrink-0" />
      <span className="text-white font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 17: Notificação com contador
const Toast17 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="flex items-center gap-3 bg-white rounded-xl shadow-xl p-4 min-w-[300px] border border-gray-200">
      <div className="relative">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-red-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
      </div>
      <span className="text-gray-800 font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 18: Estilo iOS
const Toast18 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 duration-300">
    <div className="flex items-center gap-3 bg-gray-800/90 backdrop-blur-xl rounded-2xl px-5 py-3 min-w-[300px]">
      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
        <Check className="w-4 h-4 text-white" />
      </div>
      <span className="text-white font-medium flex-1">{message}</span>
    </div>
  </div>
);

// Modelo 19: Bordered com ícone outline
const Toast19 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="flex items-center gap-3 bg-white border-2 border-red-200 rounded-xl p-4 min-w-[300px]">
      <div className="w-10 h-10 border-2 border-red-500 rounded-full flex items-center justify-center">
        <ThumbsUp className="w-5 h-5 text-red-500" />
      </div>
      <span className="text-gray-800 font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 20: Estilo Notion
const Toast20 = ({ message, onClose }: ToastProps) => (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
    <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-4 py-2.5 min-w-[250px] shadow-xl">
      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
      <span className="text-gray-200 text-sm flex-1">{message}</span>
    </div>
  </div>
);

// Modelo 21: Card com imagem de fundo
const Toast21 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="relative overflow-hidden rounded-2xl shadow-xl min-w-[320px]">
      <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500" />
      <div className="relative flex items-center gap-3 p-4">
        <Award className="w-8 h-8 text-white/90 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-white font-bold">{message}</p>
          <p className="text-white/80 text-sm">Excelente escolha!</p>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
    </div>
  </div>
);

// Modelo 22: Minimalista com linha inferior
const Toast22 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="bg-white rounded-lg shadow-lg min-w-[280px] overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Check className="w-5 h-5 text-red-500 flex-shrink-0" />
        <span className="text-gray-700 font-medium flex-1">{message}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
      </div>
      <div className="h-1 bg-gradient-to-r from-red-500 to-pink-500" />
    </div>
  </div>
);

// Modelo 23: Floating bubble
const Toast23 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in zoom-in-95 duration-300">
    <div className="flex items-center gap-3 bg-red-500 rounded-[28px] px-5 py-4 min-w-[280px] shadow-2xl shadow-red-500/30">
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
        <Check className="w-4 h-4 text-red-500" />
      </div>
      <span className="text-white font-semibold flex-1">{message}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 24: Estilo WhatsApp
const Toast24 = ({ message, onClose }: ToastProps) => (
  <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in duration-300">
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2 shadow-lg">
      <span className="text-gray-200 text-sm">{message}</span>
    </div>
  </div>
);

// Modelo 25: Card com borda lateral grossa
const Toast25 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="flex items-center gap-3 bg-white rounded-lg shadow-xl p-4 min-w-[300px] border-l-[6px] border-red-500">
      <Gift className="w-6 h-6 text-red-500 flex-shrink-0" />
      <span className="text-gray-800 font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 26: Estilo Slack
const Toast26 = ({ message, onClose }: ToastProps) => (
  <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
    <div className="flex items-center gap-3 bg-white rounded-lg shadow-2xl p-4 min-w-[320px] border border-gray-200">
      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
        <Check className="w-5 h-5 text-green-600" />
      </div>
      <div className="flex-1">
        <p className="text-gray-900 font-semibold text-sm">Sucesso</p>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 27: Neon glow
const Toast27 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="flex items-center gap-3 bg-gray-950 rounded-xl p-4 min-w-[300px] border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
        <Zap className="w-5 h-5 text-red-400" />
      </div>
      <span className="text-gray-100 font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 28: Estilo restaurante
const Toast28 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 min-w-[300px] border border-amber-200 shadow-lg">
      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
        <Utensils className="w-5 h-5 text-white" />
      </div>
      <span className="text-amber-900 font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-amber-600 hover:text-amber-800"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 29: Estilo premium
const Toast29 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="flex items-center gap-3 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 min-w-[320px] border border-amber-500/30 shadow-xl">
      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
        <ChefHat className="w-5 h-5 text-white" />
      </div>
      <span className="text-amber-100 font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-amber-500/70 hover:text-amber-400"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 30: Estilo café
const Toast30 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
    <div className="flex items-center gap-3 bg-amber-900 rounded-2xl p-4 min-w-[300px] shadow-xl">
      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
        <Coffee className="w-5 h-5 text-amber-900" />
      </div>
      <span className="text-amber-50 font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-amber-300/70 hover:text-amber-100"><X className="w-5 h-5" /></button>
    </div>
  </div>
);

// Modelo 31: Ultra minimalista
const Toast31 = ({ message, onClose }: ToastProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in fade-in duration-300">
    <div className="flex items-center gap-2 bg-gray-900 rounded px-3 py-2 min-w-[200px]">
      <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
      <span className="text-gray-200 text-sm">{message}</span>
    </div>
  </div>
);

// Array de modelos para facilitar a renderização
const toastModels = [
  { id: 1, name: "Minimalista com Barra", desc: "Fundo branco com barra lateral vermelha", Component: Toast1 },
  { id: 2, name: "Compacto Vermelho", desc: "Fundo vermelho sólido com bordas arredondadas", Component: Toast2 },
  { id: 3, name: "Card Elegante", desc: "Card branco com ícone grande e subtítulo", Component: Toast3 },
  { id: 4, name: "Snackbar Inferior", desc: "Barra escura na parte inferior com botão", Component: Toast4 },
  { id: 5, name: "Com Barra de Progresso", desc: "Card branco com barra de progresso animada", Component: Toast5 },
  { id: 6, name: "Badge Compacto", desc: "Notificação em formato de badge/pill", Component: Toast6 },
  { id: 7, name: "Glassmorphism", desc: "Efeito de vidro fosco translúcido", Component: Toast7 },
  { id: 8, name: "Neumorphism", desc: "Estilo com sombras suaves 3D", Component: Toast8 },
  { id: 9, name: "Gradient Border", desc: "Borda com gradiente colorido", Component: Toast9 },
  { id: 10, name: "Sombra Colorida", desc: "Card com sombra vermelha", Component: Toast10 },
  { id: 11, name: "Minimal Line", desc: "Linha vertical colorida lateral", Component: Toast11 },
  { id: 12, name: "Retro/Vintage", desc: "Estilo retrô com sombra sólida", Component: Toast12 },
  { id: 13, name: "Dark Elegante", desc: "Fundo escuro com ícone suave", Component: Toast13 },
  { id: 14, name: "Pill Animado", desc: "Formato pill com ícone animado", Component: Toast14 },
  { id: 15, name: "Card com Emoji", desc: "Card com emoji de avatar", Component: Toast15 },
  { id: 16, name: "Slide Esquerdo", desc: "Aparece do lado esquerdo", Component: Toast16 },
  { id: 17, name: "Com Contador", desc: "Badge com número de itens", Component: Toast17 },
  { id: 18, name: "Estilo iOS", desc: "Inspirado no design da Apple", Component: Toast18 },
  { id: 19, name: "Bordered Outline", desc: "Borda e ícone outline", Component: Toast19 },
  { id: 20, name: "Estilo Notion", desc: "Minimalista como o Notion", Component: Toast20 },
  { id: 21, name: "Gradiente Full", desc: "Fundo gradiente completo", Component: Toast21 },
  { id: 22, name: "Linha Inferior", desc: "Linha gradiente na base", Component: Toast22 },
  { id: 23, name: "Floating Bubble", desc: "Bolha flutuante arredondada", Component: Toast23 },
  { id: 24, name: "Estilo WhatsApp", desc: "Simples como o WhatsApp", Component: Toast24 },
  { id: 25, name: "Borda Lateral Grossa", desc: "Borda esquerda destacada", Component: Toast25 },
  { id: 26, name: "Estilo Slack", desc: "Card com título e descrição", Component: Toast26 },
  { id: 27, name: "Neon Glow", desc: "Efeito neon brilhante", Component: Toast27 },
  { id: 28, name: "Estilo Restaurante", desc: "Cores quentes de restaurante", Component: Toast28 },
  { id: 29, name: "Premium/Luxo", desc: "Dourado com fundo escuro", Component: Toast29 },
  { id: 30, name: "Estilo Café", desc: "Tons de café e marrom", Component: Toast30 },
  { id: 31, name: "Ultra Minimalista", desc: "Apenas texto e indicador", Component: Toast31 },
];

export default function NotificationDemo() {
  const [activeToast, setActiveToast] = useState<number | null>(null);

  const showToast = (num: number) => {
    setActiveToast(num);
    setTimeout(() => setActiveToast(null), 4000);
  };

  const closeToast = () => setActiveToast(null);

  const ActiveToastComponent = activeToast ? toastModels.find(m => m.id === activeToast)?.Component : null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Modelos de Notificação</h1>
          <p className="text-gray-600">Clique em cada opção para ver como a notificação aparece ({toastModels.length} modelos)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toastModels.map((model) => (
            <Card 
              key={model.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer hover:border-red-200" 
              onClick={() => showToast(model.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
                    {model.id}
                  </span>
                  {model.name}
                </CardTitle>
                <CardDescription className="text-sm">{model.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Clique em qualquer card acima para ver a notificação em ação
          </p>
        </div>
      </div>

      {/* Renderizar o toast ativo */}
      {ActiveToastComponent && <ActiveToastComponent message="Item adicionado ao pedido" onClose={closeToast} />}

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
