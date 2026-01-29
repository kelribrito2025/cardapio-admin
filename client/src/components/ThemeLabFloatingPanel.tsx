import { useState, useEffect, useCallback } from "react";
import { Palette, X, Minus, RotateCcw, Save, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Função para converter hex para rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Configuração padrão do tema
const defaultConfig = {
  // Background da página
  background: {
    color1: "#fef2f2",
    color2: "#ede9fe",
    opacity: 100,
    useGradient: true,
    gradientDirection: "135deg",
  },
  // Sidebar
  sidebar: {
    color: "#ffffff",
    opacity: 95,
    useBlur: false,
    blurIntensity: 20,
  },
  // Cards
  cards: {
    shadowEnabled: true,
    shadowIntensity: 20,
    borderRadius: 12,
    borderEnabled: false,
    borderColor: "#e5e7eb",
    borderOpacity: 100,
  },
  // Texto
  text: {
    autoContrast: true,
    saturationReduction: 0,
  },
};

type ThemeConfig = typeof defaultConfig;

const STORAGE_KEY = "themeLabConfig";

export function ThemeLabFloatingPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [persist, setPersist] = useState(false);
  const [config, setConfig] = useState<ThemeConfig>(defaultConfig);
  
  // Seções colapsáveis
  const [openSections, setOpenSections] = useState({
    background: true,
    sidebar: false,
    cards: false,
    text: false,
  });

  // Carregar configuração do localStorage ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(parsed.config || defaultConfig);
        setPersist(parsed.persist || false);
      } catch {
        // Ignorar erro de parse
      }
    }
  }, []);

  // Aplicar CSS variables em tempo real
  const applyTheme = useCallback((cfg: ThemeConfig) => {
    const root = document.documentElement;
    
    // Background da página
    if (cfg.background.useGradient) {
      root.style.setProperty(
        "--theme-lab-bg",
        `linear-gradient(${cfg.background.gradientDirection}, ${cfg.background.color1} 0%, ${cfg.background.color2} 100%)`
      );
    } else {
      root.style.setProperty("--theme-lab-bg", cfg.background.color1);
    }
    root.style.setProperty("--theme-lab-bg-opacity", `${cfg.background.opacity}%`);
    
    // Sidebar
    const sidebarOpacity = cfg.sidebar.opacity / 100;
    const sidebarColorWithOpacity = hexToRgba(cfg.sidebar.color, sidebarOpacity);
    root.style.setProperty("--theme-lab-sidebar-bg", sidebarColorWithOpacity);
    root.style.setProperty("--theme-lab-sidebar-blur", cfg.sidebar.useBlur ? `blur(${cfg.sidebar.blurIntensity}px)` : "none");
    
    // Cards
    const shadowOpacity = cfg.cards.shadowIntensity / 100 * 0.15;
    root.style.setProperty(
      "--theme-lab-card-shadow",
      cfg.cards.shadowEnabled 
        ? `0 4px 20px rgba(0, 0, 0, ${shadowOpacity}), 0 2px 8px rgba(0, 0, 0, ${shadowOpacity * 0.5})`
        : "none"
    );
    root.style.setProperty("--theme-lab-card-radius", `${cfg.cards.borderRadius}px`);
    const borderOpacity = cfg.cards.borderOpacity / 100;
    root.style.setProperty(
      "--theme-lab-card-border",
      cfg.cards.borderEnabled 
        ? `1px solid ${cfg.cards.borderColor}${Math.round(borderOpacity * 255).toString(16).padStart(2, '0')}`
        : "none"
    );
    
    // Texto
    root.style.setProperty("--theme-lab-saturation", `${100 - cfg.text.saturationReduction}%`);
  }, []);

  // Aplicar tema sempre que config mudar
  useEffect(() => {
    applyTheme(config);
    
    // Salvar no localStorage se persist estiver ativo
    if (persist) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ config, persist }));
    }
  }, [config, persist, applyTheme]);

  // Resetar para o padrão
  const handleReset = () => {
    setConfig(defaultConfig);
    if (!persist) {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Limpar CSS variables ao fechar
  const clearTheme = () => {
    const root = document.documentElement;
    root.style.removeProperty("--theme-lab-bg");
    root.style.removeProperty("--theme-lab-bg-opacity");
    root.style.removeProperty("--theme-lab-sidebar-bg");
    root.style.removeProperty("--theme-lab-sidebar-blur");
    root.style.removeProperty("--theme-lab-card-shadow");
    root.style.removeProperty("--theme-lab-card-radius");
    root.style.removeProperty("--theme-lab-card-border");
    root.style.removeProperty("--theme-lab-saturation");
  };

  // Toggle persist
  const handlePersistToggle = (value: boolean) => {
    setPersist(value);
    if (value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ config, persist: true }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Atualizar config
  const updateConfig = <K extends keyof ThemeConfig>(
    section: K,
    key: keyof ThemeConfig[K],
    value: ThemeConfig[K][keyof ThemeConfig[K]]
  ) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  // Toggle seção
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Botão flutuante quando fechado
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        title="Theme Lab"
      >
        <Palette className="w-6 h-6" />
      </button>
    );
  }

  // Painel minimizado
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2 border border-gray-200">
        <Palette className="w-4 h-4 text-purple-500" />
        <span className="text-sm font-medium text-gray-700">Theme Lab</span>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setIsOpen(false);
            if (!persist) clearTheme();
          }}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Painel completo
  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-80 max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-white" />
          <span className="font-semibold text-white">Theme Lab</span>
          <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">dev</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
            title="Minimizar"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              if (!persist) clearTheme();
            }}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <Switch
            checked={persist}
            onCheckedChange={handlePersistToggle}
            id="persist"
          />
          <Label htmlFor="persist" className="text-xs text-gray-600 cursor-pointer">
            Persistir
          </Label>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-7 text-xs text-gray-600 hover:text-gray-900"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Background Section */}
        <Collapsible open={openSections.background} onOpenChange={() => toggleSection("background")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="text-sm font-medium text-gray-700">🎨 Background</span>
            {openSections.background ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-600">Usar Gradiente</Label>
              <Switch
                checked={config.background.useGradient}
                onCheckedChange={(v) => updateConfig("background", "useGradient", v)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Cor {config.background.useGradient ? "1" : ""}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.background.color1}
                  onChange={(e) => updateConfig("background", "color1", e.target.value)}
                  className="w-12 h-8 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={config.background.color1}
                  onChange={(e) => updateConfig("background", "color1", e.target.value)}
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>

            {config.background.useGradient && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Cor 2</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.background.color2}
                      onChange={(e) => updateConfig("background", "color2", e.target.value)}
                      className="w-12 h-8 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.background.color2}
                      onChange={(e) => updateConfig("background", "color2", e.target.value)}
                      className="flex-1 h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Direção</Label>
                  <select
                    value={config.background.gradientDirection}
                    onChange={(e) => updateConfig("background", "gradientDirection", e.target.value)}
                    className="w-full h-8 text-xs border rounded-md px-2"
                  >
                    <option value="180deg">Vertical ↓</option>
                    <option value="0deg">Vertical ↑</option>
                    <option value="90deg">Horizontal →</option>
                    <option value="270deg">Horizontal ←</option>
                    <option value="135deg">Diagonal ↘</option>
                    <option value="45deg">Diagonal ↗</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-gray-600">Opacidade</Label>
                <span className="text-xs text-gray-500">{config.background.opacity}%</span>
              </div>
              <Slider
                value={[config.background.opacity]}
                onValueChange={([v]) => updateConfig("background", "opacity", v)}
                min={0}
                max={100}
                step={5}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Sidebar Section */}
        <Collapsible open={openSections.sidebar} onOpenChange={() => toggleSection("sidebar")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="text-sm font-medium text-gray-700">📋 Sidebar</span>
            {openSections.sidebar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.sidebar.color}
                  onChange={(e) => updateConfig("sidebar", "color", e.target.value)}
                  className="w-12 h-8 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={config.sidebar.color}
                  onChange={(e) => updateConfig("sidebar", "color", e.target.value)}
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-gray-600">Opacidade</Label>
                <span className="text-xs text-gray-500">{config.sidebar.opacity}%</span>
              </div>
              <Slider
                value={[config.sidebar.opacity]}
                onValueChange={([v]) => updateConfig("sidebar", "opacity", v)}
                min={0}
                max={100}
                step={5}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-600">Efeito Blur (vidro)</Label>
              <Switch
                checked={config.sidebar.useBlur}
                onCheckedChange={(v) => updateConfig("sidebar", "useBlur", v)}
              />
            </div>

            {config.sidebar.useBlur && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-gray-600">Intensidade Blur</Label>
                  <span className="text-xs text-gray-500">{config.sidebar.blurIntensity}px</span>
                </div>
                <Slider
                  value={[config.sidebar.blurIntensity]}
                  onValueChange={([v]) => updateConfig("sidebar", "blurIntensity", v)}
                  min={0}
                  max={50}
                  step={5}
                />
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Cards Section */}
        <Collapsible open={openSections.cards} onOpenChange={() => toggleSection("cards")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="text-sm font-medium text-gray-700">🃏 Cards</span>
            {openSections.cards ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-600">Sombra</Label>
              <Switch
                checked={config.cards.shadowEnabled}
                onCheckedChange={(v) => updateConfig("cards", "shadowEnabled", v)}
              />
            </div>

            {config.cards.shadowEnabled && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-gray-600">Intensidade Sombra</Label>
                  <span className="text-xs text-gray-500">{config.cards.shadowIntensity}%</span>
                </div>
                <Slider
                  value={[config.cards.shadowIntensity]}
                  onValueChange={([v]) => updateConfig("cards", "shadowIntensity", v)}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-gray-600">Border Radius</Label>
                <span className="text-xs text-gray-500">{config.cards.borderRadius}px</span>
              </div>
              <Slider
                value={[config.cards.borderRadius]}
                onValueChange={([v]) => updateConfig("cards", "borderRadius", v)}
                min={0}
                max={32}
                step={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-600">Borda</Label>
              <Switch
                checked={config.cards.borderEnabled}
                onCheckedChange={(v) => updateConfig("cards", "borderEnabled", v)}
              />
            </div>

            {config.cards.borderEnabled && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Cor da Borda</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.cards.borderColor}
                    onChange={(e) => updateConfig("cards", "borderColor", e.target.value)}
                    className="w-12 h-8 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={config.cards.borderColor}
                    onChange={(e) => updateConfig("cards", "borderColor", e.target.value)}
                    className="flex-1 h-8 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs text-gray-600">Opacidade Borda</Label>
                    <span className="text-xs text-gray-500">{config.cards.borderOpacity}%</span>
                  </div>
                  <Slider
                    value={[config.cards.borderOpacity]}
                    onValueChange={([v]) => updateConfig("cards", "borderOpacity", v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Text Section */}
        <Collapsible open={openSections.text} onOpenChange={() => toggleSection("text")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="text-sm font-medium text-gray-700">📝 Texto</span>
            {openSections.text ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-600">Auto-contraste</Label>
              <Switch
                checked={config.text.autoContrast}
                onCheckedChange={(v) => updateConfig("text", "autoContrast", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-gray-600">Redução Saturação</Label>
                <span className="text-xs text-gray-500">{config.text.saturationReduction}%</span>
              </div>
              <Slider
                value={[config.text.saturationReduction]}
                onValueChange={([v]) => updateConfig("text", "saturationReduction", v)}
                min={0}
                max={50}
                step={5}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <p className="text-[10px] text-gray-400 text-center">
          Painel temporário para desenvolvimento
        </p>
      </div>
    </div>
  );
}
