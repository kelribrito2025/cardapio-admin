import { cn } from "@/lib/utils";
import {
  Store,
  Clock,
  MessageCircle,
  Printer,
  Puzzle,
  ChevronDown,
  Menu,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { useState } from "react";

export type SettingsSection = 
  | "estabelecimento" 
  | "atendimento" 
  | "whatsapp" 
  | "impressora" 
  | "pagamento-online"
  | "integracoes"
  | "conta-seguranca";

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const menuItems: { id: SettingsSection; label: string; icon: React.ElementType; disabled?: boolean }[] = [
  { id: "estabelecimento", label: "Estabelecimento", icon: Store },
  { id: "atendimento", label: "Atendimento", icon: Clock },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "impressora", label: "Impressora e Teste", icon: Printer },
  { id: "pagamento-online", label: "Pagamento Online", icon: CreditCard },
  { id: "integracoes", label: "Integrações", icon: Puzzle, disabled: true },
  { id: "conta-seguranca", label: "Conta e Segurança", icon: ShieldCheck },
];

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Encontrar o item ativo para mostrar no botão do accordion
  const activeItem = menuItems.find(item => item.id === activeSection);
  const ActiveIcon = activeItem?.icon || Store;

  const handleSectionClick = (section: SettingsSection) => {
    onSectionChange(section);
    setIsExpanded(false); // Fechar accordion ao selecionar
  };

  return (
    <>
      {/* Versão Desktop - Barra lateral normal */}
      <div className="hidden md:block">
        <div className="mb-4 px-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Configurações
          </h3>
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const isDisabled = item.disabled;
            
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && onSectionChange(item.id)}
                disabled={isDisabled}
                className={cn(
                  "w-full flex items-center gap-3 py-2.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative",
                  isDisabled
                    ? "text-muted-foreground/50 cursor-not-allowed px-3"
                    : isActive
                      ? "bg-red-200/60 text-red-800 rounded-r-xl -ml-3 pl-6 border-r-4 border-red-500"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground px-3 rounded-lg"
                )}
                style={isActive && !isDisabled ? { borderRadius: '12px', marginRight: '-12px', paddingLeft: '14px', marginLeft: '-3px' } : { paddingLeft: '14px', marginLeft: '-3px' }}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isDisabled ? "text-muted-foreground/50" : isActive ? "text-red-800" : "text-muted-foreground"
                )} />
                <span>{item.label}</span>
                {isDisabled && (
                  <span className="ml-auto text-[9px] font-semibold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                    Breve
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Versão Mobile - Menu Sanfona (Accordion) */}
      <div className="md:hidden">
        {/* Botão do Accordion */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full flex items-center justify-between gap-3 p-3 rounded-xl transition-all duration-300",
            isExpanded 
              ? "bg-red-100 text-red-800" 
              : "bg-white border border-border/50 text-foreground shadow-sm"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isExpanded ? "bg-red-200/60" : "bg-muted"
            )}>
              <ActiveIcon className={cn(
                "h-5 w-5",
                isExpanded ? "text-red-800" : "text-muted-foreground"
              )} />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Configurações</p>
              <p className="font-medium">{activeItem?.label || "Selecione"}</p>
            </div>
          </div>
          <ChevronDown className={cn(
            "h-5 w-5 transition-transform duration-300",
            isExpanded ? "rotate-180 text-red-800" : "text-muted-foreground"
          )} />
        </button>

        {/* Lista de Opções do Accordion */}
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isExpanded ? "max-h-[400px] opacity-100 mt-2" : "max-h-0 opacity-0"
        )}>
          <nav className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const isDisabled = item.disabled;
              
              return (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && handleSectionClick(item.id)}
                  disabled={isDisabled}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 text-sm font-medium transition-all duration-200",
                    isDisabled
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : isActive
                        ? "bg-red-100 text-red-800 border-l-4 border-red-500"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    index !== menuItems.length - 1 && "border-b border-border/30"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isDisabled ? "text-muted-foreground/50" : isActive ? "text-red-800" : "text-muted-foreground"
                  )} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isDisabled ? (
                    <span className="text-[9px] font-semibold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                      Breve
                    </span>
                  ) : isActive && (
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
