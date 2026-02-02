import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Info, Clock } from "lucide-react";

interface TemplatesEditorProps {
  templateNewOrder: string;
  setTemplateNewOrder: (value: string) => void;
  templatePreparing: string;
  setTemplatePreparing: (value: string) => void;
  templateReady: string;
  setTemplateReady: (value: string) => void;
  templateCompleted: string;
  setTemplateCompleted: (value: string) => void;
  templateCancelled: string;
  setTemplateCancelled: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

// Variáveis disponíveis para os templates
const AVAILABLE_VARIABLES = [
  { key: "{{customerName}}", label: "Nome do Cliente" },
  { key: "{{orderNumber}}", label: "Número do Pedido" },
  { key: "{{establishmentName}}", label: "Nome do Estabelecimento" },
  { key: "{{greeting}}", label: "Saudação (Bom dia/tarde/noite)" },
  { key: "{{deliveryMessage}}", label: "Mensagem de Entrega/Retirada" },
  { key: "{{cancellationReason}}", label: "Motivo do Cancelamento" },
  { key: "{{itensPedido}}", label: "Lista de Itens do Pedido" },
];

// Tabs de templates
const TEMPLATE_TABS = [
  { id: "newOrder", label: "Novo Pedido", icon: "📦" },
  { id: "preparing", label: "Preparando", icon: "👨‍🍳" },
  { id: "ready", label: "Pronto", icon: "✅" },
  { id: "completed", label: "Finalizado", icon: "🎉" },
  { id: "cancelled", label: "Cancelado", icon: "❌" },
];

// Função para formatar o texto do WhatsApp (negrito, itálico, etc.)
function formatWhatsAppText(text: string): React.ReactNode {
  if (!text) return null;
  
  // Substituir variáveis por valores de exemplo
  let formattedText = text
    .replace(/\{\{customerName\}\}/g, "João Silva")
    .replace(/\{\{orderNumber\}\}/g, "#1234")
    .replace(/\{\{establishmentName\}\}/g, "Restaurante Exemplo")
    .replace(/\{\{greeting\}\}/g, "Boa tarde")
    .replace(/\{\{deliveryMessage\}\}/g, "🛵 Nosso entregador já está a caminho.")
    .replace(/\{\{cancellationReason\}\}/g, "Cliente solicitou cancelamento")
    .replace(/\{\{itensPedido\}\}/g, "📋 *Itens do Pedido:*\n• 1x Pizza Margherita - R$ 45,00\n• 1x Refrigerante 2L - R$ 12,00\n\n💰 *Total: R$ 57,00*");
  
  // Processar formatação do WhatsApp
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  
  // Regex para encontrar formatações
  const boldRegex = /\*([^*]+)\*/g;
  const italicRegex = /_([^_]+)_/g;
  const strikeRegex = /~([^~]+)~/g;
  
  // Primeiro, substituir negrito
  formattedText = formattedText.replace(boldRegex, '<b>$1</b>');
  // Depois, substituir itálico
  formattedText = formattedText.replace(italicRegex, '<i>$1</i>');
  // Por fim, substituir tachado
  formattedText = formattedText.replace(strikeRegex, '<s>$1</s>');
  
  // Converter quebras de linha
  const lines = formattedText.split('\n');
  
  return (
    <span>
      {lines.map((line, index) => (
        <span key={index}>
          <span dangerouslySetInnerHTML={{ __html: line }} />
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </span>
  );
}

// Componente de preview estilo WhatsApp
function WhatsAppPreview({ message }: { message: string }) {
  const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className="bg-[#e5ddd5] rounded-lg p-4 min-h-[300px] relative overflow-hidden">
      {/* Padrão de fundo do WhatsApp */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Bolha de mensagem */}
      <div className="relative">
        <div className="bg-[#dcf8c6] rounded-lg p-3 max-w-[85%] ml-auto shadow-sm relative">
          {/* Triângulo da bolha */}
          <div 
            className="absolute -right-2 top-0 w-0 h-0"
            style={{
              borderLeft: '8px solid #dcf8c6',
              borderTop: '8px solid transparent',
            }}
          />
          
          {/* Conteúdo da mensagem */}
          <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
            {formatWhatsAppText(message)}
          </div>
          
          {/* Horário */}
          <div className="flex justify-end items-center gap-1 mt-1">
            <span className="text-[10px] text-gray-500">{currentTime}</span>
            {/* Checkmarks */}
            <svg className="w-4 h-3 text-blue-500" viewBox="0 0 16 11" fill="currentColor">
              <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.146.47.47 0 0 0-.343.146l-.311.31a.445.445 0 0 0-.14.337c0 .136.047.25.14.343l2.996 2.996a.724.724 0 0 0 .501.203.697.697 0 0 0 .546-.266l6.646-8.417a.497.497 0 0 0 .108-.299.441.441 0 0 0-.19-.374l-.337-.273zm3.785 0a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.152-1.09a.342.342 0 0 0-.14.337c0 .136.047.25.14.343l.76.76a.724.724 0 0 0 .501.203.697.697 0 0 0 .546-.266l6.646-8.417a.497.497 0 0 0 .108-.299.441.441 0 0 0-.19-.374l-.344-.273v-.036z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TemplatesEditor({
  templateNewOrder,
  setTemplateNewOrder,
  templatePreparing,
  setTemplatePreparing,
  templateReady,
  setTemplateReady,
  templateCompleted,
  setTemplateCompleted,
  templateCancelled,
  setTemplateCancelled,
  onSave,
  isSaving,
}: TemplatesEditorProps) {
  const [activeTab, setActiveTab] = useState("newOrder");
  
  // Mapear templates para getters e setters
  const templateMap: Record<string, { value: string; setter: (v: string) => void }> = {
    newOrder: { value: templateNewOrder, setter: setTemplateNewOrder },
    preparing: { value: templatePreparing, setter: setTemplatePreparing },
    ready: { value: templateReady, setter: setTemplateReady },
    completed: { value: templateCompleted, setter: setTemplateCompleted },
    cancelled: { value: templateCancelled, setter: setTemplateCancelled },
  };
  
  const currentTemplate = templateMap[activeTab];
  const activeTabInfo = TEMPLATE_TABS.find(t => t.id === activeTab);
  
  // Inserir variável no cursor
  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = currentTemplate.value;
      const newText = text.substring(0, start) + variable + text.substring(end);
      currentTemplate.setter(newText);
      
      // Reposicionar cursor após a variável inserida
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      // Fallback: adicionar no final
      currentTemplate.setter(currentTemplate.value + variable);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Header com gradiente vermelho e tabs */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{activeTabInfo?.icon}</span>
            <h2 className="text-xl font-semibold text-white">{activeTabInfo?.label}</h2>
          </div>
          
          {/* Tabs de templates */}
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-gray-800 shadow-md"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <CardContent className="p-6">
          {/* Variáveis disponíveis */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Variáveis disponíveis:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_VARIABLES.map((variable) => (
                <button
                  key={variable.key}
                  onClick={() => insertVariable(variable.key)}
                  className="px-3 py-1.5 bg-white border border-blue-200 rounded-full text-sm text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors font-mono"
                  title={variable.label}
                >
                  {variable.key}
                </button>
              ))}
            </div>
          </div>
          
          {/* Layout lado a lado: Editor e Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Editor</Label>
              <div className="relative">
                <Textarea
                  value={currentTemplate.value}
                  onChange={(e) => currentTemplate.setter(e.target.value)}
                  rows={12}
                  className="font-mono text-sm bg-green-50 border-green-200 focus:border-green-400 focus:ring-green-400 resize-none"
                  placeholder="Digite sua mensagem aqui..."
                />
                <div className="absolute bottom-2 left-3 text-xs text-muted-foreground">
                  {currentTemplate.value.length} caracteres
                </div>
              </div>
              
              {/* Dicas específicas por template */}
              {activeTab === "ready" && (
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Use <code className="px-1 bg-muted rounded">{"{{deliveryMessage}}"}</code> para mensagem automática:
                  <br />• <strong>Retirada:</strong> "Você já pode vir retirar. 😄"
                  <br />• <strong>Entrega:</strong> "🛵 Nosso entregador já está a caminho."
                </p>
              )}
              {activeTab === "cancelled" && (
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Use <code className="px-1 bg-muted rounded">{"{{cancellationReason}}"}</code> para incluir o motivo do cancelamento.
                </p>
              )}
            </div>
            
            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Preview</Label>
              <WhatsAppPreview message={currentTemplate.value} />
            </div>
          </div>
          
          {/* Botão Salvar */}
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={onSave}
              disabled={isSaving}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Salvar Templates
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
