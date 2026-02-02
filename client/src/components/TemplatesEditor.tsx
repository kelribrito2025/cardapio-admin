import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2,
  ShoppingBag,
  ChefHat,
  CheckCircle,
  Package,
  XCircle,
  RotateCcw,
  Info
} from "lucide-react";

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
  defaultTemplates: {
    newOrder: string;
    preparing: string;
    ready: string;
    completed: string;
    cancelled: string;
  };
}

type TemplateType = 'newOrder' | 'preparing' | 'ready' | 'completed' | 'cancelled';

const TEMPLATE_CONFIG: Record<TemplateType, { 
  label: string; 
  icon: React.ReactNode; 
  color: string;
  bgColor: string;
  description: string;
}> = {
  newOrder: { 
    label: 'Novo Pedido', 
    icon: <ShoppingBag className="h-4 w-4" />, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'Enviada quando um novo pedido é recebido'
  },
  preparing: { 
    label: 'Preparando', 
    icon: <ChefHat className="h-4 w-4" />, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    description: 'Enviada quando o pedido começa a ser preparado'
  },
  ready: { 
    label: 'Pronto', 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    description: 'Enviada quando o pedido está pronto'
  },
  completed: { 
    label: 'Finalizado', 
    icon: <Package className="h-4 w-4" />, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    description: 'Enviada quando o pedido é entregue/retirado'
  },
  cancelled: { 
    label: 'Cancelado', 
    icon: <XCircle className="h-4 w-4" />, 
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    description: 'Enviada quando o pedido é cancelado'
  },
};

const VARIABLES = [
  { name: '{{customerName}}', description: 'Nome do cliente' },
  { name: '{{orderNumber}}', description: 'Número do pedido' },
  { name: '{{establishmentName}}', description: 'Nome do estabelecimento' },
  { name: '{{greeting}}', description: 'Saudação (Bom dia/Boa tarde/Boa noite)' },
  { name: '{{deliveryMessage}}', description: 'Mensagem de entrega/retirada' },
  { name: '{{cancellationReason}}', description: 'Motivo do cancelamento' },
  { name: '{{itensPedido}}', description: 'Lista dos itens do pedido' },
];

// Função para formatar texto estilo WhatsApp
function formatWhatsAppText(text: string): React.ReactNode {
  // Substitui variáveis por valores de exemplo
  let formattedText = text
    .replace(/\{\{customerName\}\}/g, 'João Silva')
    .replace(/\{\{orderNumber\}\}/g, '#1234')
    .replace(/\{\{establishmentName\}\}/g, 'Restaurante Exemplo')
    .replace(/\{\{greeting\}\}/g, 'Boa tarde')
    .replace(/\{\{deliveryMessage\}\}/g, '🛵 Nosso entregador já está a caminho.')
    .replace(/\{\{cancellationReason\}\}/g, 'Item indisponível')
    .replace(/\{\{itensPedido\}\}/g, '• 1x Pizza Margherita\n• 1x Refrigerante');

  // Processa formatação WhatsApp
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  
  // Regex para encontrar texto em negrito (*texto*)
  const boldRegex = /\*([^*]+)\*/g;
  let match;
  
  while ((match = boldRegex.exec(formattedText)) !== null) {
    // Adiciona texto antes do match
    if (match.index > currentIndex) {
      parts.push(formattedText.slice(currentIndex, match.index));
    }
    // Adiciona texto em negrito
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    currentIndex = match.index + match[0].length;
  }
  
  // Adiciona texto restante
  if (currentIndex < formattedText.length) {
    parts.push(formattedText.slice(currentIndex));
  }
  
  return parts.length > 0 ? parts : formattedText;
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
  defaultTemplates,
}: TemplatesEditorProps) {
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('newOrder');

  const templates: Record<TemplateType, { value: string; setter: (v: string) => void; default: string }> = {
    newOrder: { value: templateNewOrder, setter: setTemplateNewOrder, default: defaultTemplates.newOrder },
    preparing: { value: templatePreparing, setter: setTemplatePreparing, default: defaultTemplates.preparing },
    ready: { value: templateReady, setter: setTemplateReady, default: defaultTemplates.ready },
    completed: { value: templateCompleted, setter: setTemplateCompleted, default: defaultTemplates.completed },
    cancelled: { value: templateCancelled, setter: setTemplateCancelled, default: defaultTemplates.cancelled },
  };

  const currentTemplate = templates[activeTemplate];
  const config = TEMPLATE_CONFIG[activeTemplate];

  const handleInsertVariable = (variable: string) => {
    currentTemplate.setter(currentTemplate.value + variable);
  };

  const handleResetTemplate = () => {
    currentTemplate.setter(currentTemplate.default);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Header com título e descrição */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Editor de Mensagens</h3>
          <p className="text-sm text-muted-foreground">Personalize as mensagens automáticas enviadas aos clientes</p>
        </div>
        <Button 
          onClick={onSave}
          disabled={isSaving}
          className="bg-red-500 hover:bg-red-600"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Salvar Alterações
        </Button>
      </div>

      {/* Tabs de navegação entre templates */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(Object.keys(TEMPLATE_CONFIG) as TemplateType[]).map((type) => {
          const cfg = TEMPLATE_CONFIG[type];
          const isActive = activeTemplate === type;
          return (
            <button
              key={type}
              onClick={() => setActiveTemplate(type)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-red-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cfg.icon}
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Card de variáveis disponíveis */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 mb-2">Variáveis disponíveis</p>
              <div className="flex flex-wrap gap-2">
                {VARIABLES.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => handleInsertVariable(v.name)}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                    title={v.description}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout principal: Editor + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Coluna do Editor */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`${config.color}`}>{config.icon}</span>
                <span className="font-medium">{config.label}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetTemplate}
                className="text-gray-500 hover:text-gray-700"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Restaurar padrão
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{config.description}</p>
            <Textarea
              value={currentTemplate.value}
              onChange={(e) => currentTemplate.setter(e.target.value)}
              rows={10}
              className="font-mono text-sm resize-none"
              placeholder="Digite sua mensagem aqui..."
            />
            <p className="text-xs text-muted-foreground mt-2 text-right">
              {currentTemplate.value.length} caracteres
            </p>
          </CardContent>
        </Card>

        {/* Coluna do Preview WhatsApp */}
        <Card className="bg-[#e5ddd5]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-medium text-gray-700">Preview</span>
              <span className="text-xs text-gray-500">Como o cliente verá</span>
            </div>
            
            {/* Simulação de tela WhatsApp */}
            <div className="bg-[#e5ddd5] rounded-lg p-4 min-h-[280px]" style={{
              backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QkZEBQQ3WPvJAAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAJklEQVRo3u3BMQEAAADCoPVP7WsIoAAAAAAAAAAAAAAAAAAAbjh4AAFiTgvhAAAAAElFTkSuQmCC")`,
              backgroundRepeat: 'repeat'
            }}>
              {/* Bolha de mensagem */}
              <div className="max-w-[85%] ml-auto">
                <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none p-3 shadow-sm relative">
                  {/* Triângulo da bolha */}
                  <div className="absolute -right-2 top-0 w-0 h-0 border-l-8 border-l-[#dcf8c6] border-t-8 border-t-transparent border-b-8 border-b-transparent"></div>
                  
                  {/* Conteúdo da mensagem */}
                  <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                    {formatWhatsAppText(currentTemplate.value)}
                  </div>
                  
                  {/* Horário e checkmarks */}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-gray-500">{getCurrentTime()}</span>
                    <svg className="w-4 h-4 text-blue-500" viewBox="0 0 16 15" fill="currentColor">
                      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
