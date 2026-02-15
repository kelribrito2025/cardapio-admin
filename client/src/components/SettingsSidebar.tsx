import { cn } from "@/lib/utils";
import {
  Store,
  Clock,
  MessageCircle,
  Printer,
  Puzzle,
  ChevronDown,
  ChevronRight,
  Menu,
  ShieldCheck,
  CreditCard,
  Bell,
  FileText,
  CalendarClock,
} from "lucide-react";
import { useState, useEffect } from "react";

export type SettingsSection = 
  | "estabelecimento" 
  | "atendimento" 
  | "agendamento"
  | "whatsapp" 
  | "whatsapp-notificacoes"
  | "whatsapp-templates"
  | "impressora" 
  | "pagamento-online"
  | "integracoes"
  | "conta-seguranca";

interface SubMenuItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
}

interface MenuItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { id: "estabelecimento", label: "Estabelecimento", icon: Store },
  { id: "atendimento", label: "Atendimento", icon: Clock },
  { id: "agendamento", label: "Agendamento", icon: CalendarClock },
  { 
    id: "whatsapp", 
    label: "WhatsApp", 
    icon: MessageCircle,
    subItems: [
      { id: "whatsapp-notificacoes", label: "Notificações", icon: Bell },
      { id: "whatsapp-templates", label: "Templates", icon: FileText },
    ],
  },
  { id: "impressora", label: "Impressora e Teste", icon: Printer },
  { id: "pagamento-online", label: "Pagamento Online", icon: CreditCard },
  { id: "integracoes", label: "Integrações", icon: Puzzle, disabled: true },
  { id: "conta-seguranca", label: "Conta e Segurança", icon: ShieldCheck },
];

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

// Helper para verificar se uma seção é sub-item do WhatsApp
function isWhatsAppSection(section: SettingsSection): boolean {
  return section === "whatsapp" || section === "whatsapp-notificacoes" || section === "whatsapp-templates";
}

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(() => isWhatsAppSection(activeSection));
  
  // Abrir submenu do WhatsApp automaticamente quando uma seção WhatsApp é ativa
  useEffect(() => {
    if (isWhatsAppSection(activeSection)) {
      setWhatsappOpen(true);
    }
  }, [activeSection]);
  
  // Encontrar o item ativo para mostrar no botão do accordion (mobile)
  const getActiveLabel = (): string => {
    for (const item of menuItems) {
      if (item.id === activeSection) return item.label;
      if (item.subItems) {
        const sub = item.subItems.find(s => s.id === activeSection);
        if (sub) return `${item.label} › ${sub.label}`;
      }
    }
    return "Selecione";
  };
  
  const getActiveIcon = (): React.ElementType => {
    for (const item of menuItems) {
      if (item.id === activeSection) return item.icon;
      if (item.subItems) {
        const sub = item.subItems.find(s => s.id === activeSection);
        if (sub) return sub.icon;
      }
    }
    return Store;
  };

  const ActiveIcon = getActiveIcon();

  const handleSectionClick = (section: SettingsSection) => {
    onSectionChange(section);
    setIsExpanded(false);
  };

  const handleWhatsAppClick = () => {
    if (whatsappOpen) {
      setWhatsappOpen(false);
    } else {
      setWhatsappOpen(true);
      // Ao abrir, navegar para Notificações por padrão se não estiver em sub-item
      if (!isWhatsAppSection(activeSection)) {
        onSectionChange("whatsapp-notificacoes");
      }
    }
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
            const hasSubItems = !!item.subItems;
            const isActive = hasSubItems 
              ? isWhatsAppSection(activeSection) 
              : activeSection === item.id;
            const isDisabled = item.disabled;
            
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (isDisabled) return;
                    if (hasSubItems) {
                      handleWhatsAppClick();
                    } else {
                      onSectionChange(item.id);
                    }
                  }}
                  disabled={isDisabled}
                  className={cn(
                    "w-full flex items-center gap-3 py-2.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative",
                    isDisabled
                      ? "text-muted-foreground/50 cursor-not-allowed px-3"
                      : hasSubItems && isActive
                        ? "text-primary"
                        : !hasSubItems && isActive
                          ? "bg-primary/15 text-primary rounded-r-xl -ml-3 pl-6 border-r-4 border-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground px-3 rounded-lg"
                  )}
                  style={
                    !hasSubItems && isActive && !isDisabled 
                      ? { borderRadius: '12px', marginRight: '-12px', paddingLeft: '14px', marginLeft: '-3px' } 
                      : { paddingLeft: '14px', marginLeft: '-3px' }
                  }
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isDisabled ? "text-muted-foreground/50" : isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isDisabled && (
                    <span className="ml-auto text-[9px] font-semibold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                      Breve
                    </span>
                  )}
                  {hasSubItems && !isDisabled && (
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      whatsappOpen ? "rotate-180" : ""
                    )} />
                  )}
                </button>
                
                {/* Sub-items */}
                {hasSubItems && item.subItems && (
                  <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    whatsappOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-border/50 pl-3">
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeSection === sub.id;
                        
                        return (
                          <button
                            key={sub.id}
                            onClick={() => onSectionChange(sub.id)}
                            className={cn(
                              "w-full flex items-center gap-2.5 py-2 px-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                              isSubActive
                                ? "bg-primary/15 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <SubIcon className={cn(
                              "h-4 w-4 flex-shrink-0",
                              isSubActive ? "text-primary" : "text-muted-foreground"
                            )} />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
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
              ? "bg-primary/15 text-primary" 
              : "bg-card border border-border/50 text-foreground shadow-sm"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isExpanded ? "bg-primary/15" : "bg-muted"
            )}>
              <ActiveIcon className={cn(
                "h-5 w-5",
                isExpanded ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Configurações</p>
              <p className="font-medium">{getActiveLabel()}</p>
            </div>
          </div>
          <ChevronDown className={cn(
            "h-5 w-5 transition-transform duration-300",
            isExpanded ? "rotate-180 text-primary" : "text-muted-foreground"
          )} />
        </button>

        {/* Lista de Opções do Accordion */}
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isExpanded ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"
        )}>
          <nav className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const hasSubItems = !!item.subItems;
              const isParentActive = hasSubItems && isWhatsAppSection(activeSection);
              const isActive = !hasSubItems && activeSection === item.id;
              const isDisabled = item.disabled;
              
              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (isDisabled) return;
                      if (hasSubItems) {
                        handleWhatsAppClick();
                      } else {
                        handleSectionClick(item.id);
                      }
                    }}
                    disabled={isDisabled}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 text-sm font-medium transition-all duration-200",
                      isDisabled
                        ? "text-muted-foreground/50 cursor-not-allowed"
                        : isActive
                          ? "bg-primary/15 text-primary border-l-4 border-primary"
                          : isParentActive
                            ? "text-primary"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      !hasSubItems && index !== menuItems.length - 1 && "border-b border-border/30"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isDisabled ? "text-muted-foreground/50" : (isActive || isParentActive) ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isDisabled ? (
                      <span className="text-[9px] font-semibold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                        Breve
                      </span>
                    ) : hasSubItems ? (
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        whatsappOpen ? "rotate-180" : ""
                      )} />
                    ) : isActive && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                  
                  {/* Sub-items mobile */}
                  {hasSubItems && item.subItems && (
                    <div className={cn(
                      "overflow-hidden transition-all duration-300",
                      whatsappOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
                    )}>
                      {item.subItems.map((sub, subIndex) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeSection === sub.id;
                        
                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleSectionClick(sub.id)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 pl-10 text-sm font-medium transition-all duration-200",
                              isSubActive
                                ? "bg-primary/10 text-primary border-l-4 border-primary"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                              "border-b border-border/30"
                            )}
                          >
                            <SubIcon className={cn(
                              "h-4 w-4 flex-shrink-0",
                              isSubActive ? "text-primary" : "text-muted-foreground"
                            )} />
                            <span className="flex-1 text-left">{sub.label}</span>
                            {isSubActive && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
