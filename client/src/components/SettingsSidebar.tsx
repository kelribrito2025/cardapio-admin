import { cn } from "@/lib/utils";
import {
  Store,
  Clock,
  MessageCircle,
  Printer,
  Puzzle,
} from "lucide-react";

export type SettingsSection = 
  | "estabelecimento" 
  | "atendimento" 
  | "whatsapp" 
  | "impressora" 
  | "integracoes";

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const menuItems: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: "estabelecimento", label: "Estabelecimento", icon: Store },
  { id: "atendimento", label: "Atendimento", icon: Clock },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "impressora", label: "Impressora e Teste", icon: Printer },
  { id: "integracoes", label: "Integrações", icon: Puzzle },
];

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <div className="w-64 h-[calc(100vh-64px)] sticky top-0 bg-white border-r border-border/50 py-4 px-3 overflow-y-auto">
      <div className="mb-4 px-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Configurações
        </h3>
      </div>
      
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
