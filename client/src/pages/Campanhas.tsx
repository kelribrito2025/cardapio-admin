import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, SectionCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare,
  Wallet,
  DollarSign,
  Hash,
  Clock,
  Users,
  Upload,
  Plus,
  Send,
  Info,
  Signal,
  Battery,
  Wifi,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  UserPlus,
  Trash2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Limite de caracteres do SMS
const SMS_CHAR_LIMIT = 152;

// Dados mockados para demonstração visual
const MOCK_DATA = {
  saldo: 125.50,
  custoPorSms: 0.08,
  ultimoDisparo: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
  clientesBase: [
    { id: 1, nome: "João Silva", telefone: "(11) 99999-1234", selecionado: false },
    { id: 2, nome: "Maria Santos", telefone: "(11) 98888-5678", selecionado: false },
    { id: 3, nome: "Pedro Oliveira", telefone: "(11) 97777-9012", selecionado: false },
    { id: 4, nome: "Ana Costa", telefone: "(11) 96666-3456", selecionado: false },
    { id: 5, nome: "Carlos Lima", telefone: "(11) 95555-7890", selecionado: false },
  ],
};

export default function Campanhas() {
  const [mensagem, setMensagem] = useState("");
  const [destinatariosTab, setDestinatariosTab] = useState("base");
  const [clientesSelecionados, setClientesSelecionados] = useState<number[]>([]);
  const [numerosImportados, setNumerosImportados] = useState<string[]>([]);
  const [numeroManual, setNumeroManual] = useState("");
  const [numerosManual, setNumerosManual] = useState<string[]>([]);
  const [isEnviando, setIsEnviando] = useState(false);
  const [selecionarTodos, setSelecionarTodos] = useState(false);

  // Calcular quantidade de SMS possíveis com o saldo
  const smsPossiveis = Math.floor(MOCK_DATA.saldo / MOCK_DATA.custoPorSms);

  // Calcular total de destinatários
  const totalDestinatarios = useMemo(() => {
    return clientesSelecionados.length + numerosImportados.length + numerosManual.length;
  }, [clientesSelecionados, numerosImportados, numerosManual]);

  // Calcular custo total
  const custoTotal = useMemo(() => {
    return totalDestinatarios * MOCK_DATA.custoPorSms;
  }, [totalDestinatarios]);

  // Formatar data do último disparo
  const formatarUltimoDisparo = () => {
    const agora = new Date();
    const diff = agora.getTime() - MOCK_DATA.ultimoDisparo.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (dias === 0) return "Hoje";
    if (dias === 1) return "Ontem";
    return `Há ${dias} dias`;
  };

  // Selecionar/deselecionar cliente
  const toggleCliente = (id: number) => {
    setClientesSelecionados(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  // Selecionar todos os clientes
  const toggleSelecionarTodos = () => {
    if (selecionarTodos) {
      setClientesSelecionados([]);
    } else {
      setClientesSelecionados(MOCK_DATA.clientesBase.map(c => c.id));
    }
    setSelecionarTodos(!selecionarTodos);
  };

  // Adicionar número manual
  const adicionarNumeroManual = () => {
    const numeroLimpo = numeroManual.replace(/\D/g, "");
    if (numeroLimpo.length >= 10 && numeroLimpo.length <= 11) {
      if (!numerosManual.includes(numeroLimpo)) {
        setNumerosManual(prev => [...prev, numeroLimpo]);
        setNumeroManual("");
      } else {
        toast.error("Número já adicionado");
      }
    } else {
      toast.error("Número inválido. Use o formato (XX) XXXXX-XXXX");
    }
  };

  // Remover número manual
  const removerNumeroManual = (numero: string) => {
    setNumerosManual(prev => prev.filter(n => n !== numero));
  };

  // Simular importação de CSV
  const handleImportarCSV = () => {
    // Simular importação
    const numerosSimulados = [
      "11999991111",
      "11999992222",
      "11999993333",
    ];
    setNumerosImportados(numerosSimulados);
    toast.success(`${numerosSimulados.length} números importados com sucesso!`);
  };

  // Simular envio de SMS
  const handleEnviarSMS = async () => {
    if (!mensagem.trim()) {
      toast.error("Digite uma mensagem para enviar");
      return;
    }
    if (totalDestinatarios === 0) {
      toast.error("Selecione pelo menos um destinatário");
      return;
    }
    if (custoTotal > MOCK_DATA.saldo) {
      toast.error("Saldo insuficiente para este envio");
      return;
    }

    setIsEnviando(true);
    
    // Simular envio
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(`SMS enviado para ${totalDestinatarios} destinatários!`);
    setIsEnviando(false);
    
    // Limpar seleções
    setMensagem("");
    setClientesSelecionados([]);
    setNumerosImportados([]);
    setNumerosManual([]);
  };

  // Formatar número para exibição
  const formatarTelefone = (numero: string) => {
    const limpo = numero.replace(/\D/g, "");
    if (limpo.length === 11) {
      return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
    }
    if (limpo.length === 10) {
      return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
    }
    return numero;
  };

  // Preview da mensagem com substituições
  const previewMensagem = mensagem || "Sua mensagem aparecerá aqui...";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Campanhas SMS"
          description="Envie mensagens promocionais para seus clientes"
        />

        {/* Cards Informativos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Saldo Disponível */}
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Saldo Disponível</p>
                <p className="text-xl font-bold text-foreground">
                  R$ {MOCK_DATA.saldo.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Custo por SMS */}
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Custo por SMS</p>
                <p className="text-xl font-bold text-foreground">
                  R$ {MOCK_DATA.custoPorSms.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Quantidade de SMS Possíveis */}
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Hash className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">SMS Possíveis</p>
                <p className="text-xl font-bold text-foreground">
                  {smsPossiveis.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Último Disparo */}
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Último Disparo</p>
                <p className="text-xl font-bold text-foreground">
                  {formatarUltimoDisparo()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Layout em duas colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Coluna Esquerda - Editor */}
          <div className="lg:col-span-3 space-y-6">
            {/* Editor de Mensagem */}
            <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Mensagem SMS</h3>
                  <p className="text-xs text-muted-foreground">Máximo de {SMS_CHAR_LIMIT} caracteres</p>
                </div>
              </div>

              <div className="space-y-3">
                <Textarea
                  value={mensagem}
                  onChange={(e) => {
                    if (e.target.value.length <= SMS_CHAR_LIMIT) {
                      setMensagem(e.target.value);
                    }
                  }}
                  placeholder="Digite sua mensagem promocional aqui..."
                  className="min-h-[120px] resize-none"
                />
                
                {/* Contador de caracteres */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>SMS com mais de 160 caracteres são divididos em múltiplas mensagens e cobrados separadamente.</p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-xs text-muted-foreground">
                      Dica: Mensagens curtas têm melhor engajamento
                    </span>
                  </div>
                  <div className={cn(
                    "text-sm font-medium",
                    mensagem.length > SMS_CHAR_LIMIT * 0.9 ? "text-orange-500" : "text-muted-foreground",
                    mensagem.length >= SMS_CHAR_LIMIT && "text-red-500"
                  )}>
                    {mensagem.length} / {SMS_CHAR_LIMIT}
                  </div>
                </div>
              </div>
            </div>

            {/* Seleção de Destinatários */}
            <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground">Destinatários</h3>
                  <p className="text-xs text-muted-foreground">Selecione quem receberá a mensagem</p>
                </div>
                {totalDestinatarios > 0 && (
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {totalDestinatarios} selecionado{totalDestinatarios !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              <Tabs value={destinatariosTab} onValueChange={setDestinatariosTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="base" className="text-xs sm:text-sm">
                    <Users className="h-4 w-4 mr-1.5 hidden sm:inline" />
                    Base de Clientes
                  </TabsTrigger>
                  <TabsTrigger value="importar" className="text-xs sm:text-sm">
                    <FileSpreadsheet className="h-4 w-4 mr-1.5 hidden sm:inline" />
                    Importar CSV
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="text-xs sm:text-sm">
                    <UserPlus className="h-4 w-4 mr-1.5 hidden sm:inline" />
                    Adicionar Manual
                  </TabsTrigger>
                </TabsList>

                {/* Aba: Base de Clientes */}
                <TabsContent value="base" className="mt-0">
                  <div className="border rounded-lg overflow-hidden">
                    {/* Header da lista */}
                    <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selecionarTodos}
                          onChange={toggleSelecionarTodos}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm font-medium">Selecionar todos</span>
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {MOCK_DATA.clientesBase.length} clientes
                      </span>
                    </div>
                    
                    {/* Lista de clientes */}
                    <div className="max-h-[240px] overflow-y-auto">
                      {MOCK_DATA.clientesBase.map((cliente) => (
                        <label
                          key={cliente.id}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 border-b last:border-b-0 cursor-pointer transition-colors",
                            clientesSelecionados.includes(cliente.id) 
                              ? "bg-primary/5" 
                              : "hover:bg-muted/30"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={clientesSelecionados.includes(cliente.id)}
                            onChange={() => toggleCliente(cliente.id)}
                            className="rounded border-gray-300"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{cliente.nome}</p>
                            <p className="text-xs text-muted-foreground">{cliente.telefone}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Aba: Importar CSV */}
                <TabsContent value="importar" className="mt-0">
                  <div className="border rounded-lg p-6 text-center">
                    {numerosImportados.length === 0 ? (
                      <>
                        <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h4 className="font-medium mb-2">Importar números de um arquivo</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Faça upload de um arquivo CSV com uma coluna de números de telefone
                        </p>
                        <Button onClick={handleImportarCSV} variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Selecionar arquivo CSV
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="font-medium">{numerosImportados.length} números importados</span>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center mb-4">
                          {numerosImportados.map((numero, index) => (
                            <span key={index} className="bg-muted px-3 py-1 rounded-full text-sm">
                              {formatarTelefone(numero)}
                            </span>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setNumerosImportados([])}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Limpar importação
                        </Button>
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* Aba: Adicionar Manual */}
                <TabsContent value="manual" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={numeroManual}
                        onChange={(e) => setNumeroManual(e.target.value)}
                        placeholder="(XX) XXXXX-XXXX"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            adicionarNumeroManual();
                          }
                        }}
                      />
                      <Button onClick={adicionarNumeroManual}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {numerosManual.length > 0 ? (
                      <div className="border rounded-lg p-4">
                        <div className="flex flex-wrap gap-2">
                          {numerosManual.map((numero, index) => (
                            <span 
                              key={index} 
                              className="bg-muted px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                            >
                              {formatarTelefone(numero)}
                              <button
                                onClick={() => removerNumeroManual(numero)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-6 text-center text-muted-foreground">
                        <p className="text-sm">Nenhum número adicionado ainda</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Resumo e Botão de Envio */}
            <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Custo estimado: <span className="font-semibold text-foreground">R$ {custoTotal.toFixed(2)}</span>
                  </p>
                  {custoTotal > MOCK_DATA.saldo && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Saldo insuficiente
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleEnviarSMS}
                  disabled={isEnviando || totalDestinatarios === 0 || !mensagem.trim() || custoTotal > MOCK_DATA.saldo}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isEnviando ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Disparar SMS
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Preview do Celular */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Preview</h3>
                    <p className="text-xs text-muted-foreground">Como o cliente verá o SMS</p>
                  </div>
                </div>

                {/* Moldura do Celular */}
                <div className="flex justify-center">
                  <div className="relative bg-[#1a1a1a] rounded-[40px] p-2 shadow-xl" style={{ width: '280px' }}>
                    {/* Borda interna do celular */}
                    <div className="bg-[#0a0a0a] rounded-[32px] overflow-hidden">
                      {/* Barra de status do celular */}
                      <div className="bg-[#1a1a1a] px-6 py-2 flex items-center justify-between">
                        <span className="text-white text-xs font-medium">9:41</span>
                        <div className="flex items-center gap-1">
                          <Signal className="h-3.5 w-3.5 text-white" />
                          <Wifi className="h-3.5 w-3.5 text-white" />
                          <Battery className="h-4 w-4 text-white" />
                        </div>
                      </div>

                      {/* Tela do SMS */}
                      <div className="bg-white min-h-[400px] flex flex-col">
                        {/* Header do app de mensagens */}
                        <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b">
                          <ChevronLeft className="h-5 w-5 text-blue-500" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Mensagens</p>
                          </div>
                        </div>

                        {/* Área de mensagens */}
                        <div className="flex-1 p-4 bg-white">
                          {/* Balão de mensagem */}
                          <div className="flex justify-start">
                            <div className="max-w-[85%] bg-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5">
                              <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                                {previewMensagem}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-1 text-right">
                                Agora
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Barra inferior do app */}
                        <div className="bg-gray-100 px-4 py-3 border-t">
                          <div className="bg-white rounded-full px-4 py-2 text-sm text-gray-400 border">
                            Mensagem de texto
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Barra de navegação inferior do celular */}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
                  </div>
                </div>

                {/* Nota informativa */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex gap-2">
                    <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      O SMS será enviado do número da Disparo Pro. O cliente verá a mensagem exatamente como mostrado acima.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Componente X para o botão de remover
function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
