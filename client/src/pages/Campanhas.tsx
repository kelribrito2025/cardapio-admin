import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, SectionCard, StatCard } from "@/components/shared";
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

  Loader2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  UserPlus,
  Trash2,
  X,
  ChevronLeft,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";

// Limite de caracteres do SMS
const SMS_CHAR_LIMIT = 152;

// Custo padrão por SMS (usado quando não há dados do servidor)
const DEFAULT_COST_PER_SMS = 0.10;

// Função para formatar número de telefone no padrão brasileiro
const formatPhoneNumber = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Se começar com 55, remove (será adicionado automaticamente)
  const cleaned = numbers.startsWith('55') ? numbers.slice(2) : numbers;
  
  // Limita a 11 dígitos (DDD + 9 dígitos)
  const limited = cleaned.slice(0, 11);
  
  // Formata conforme vai digitando
  if (limited.length === 0) return '';
  if (limited.length <= 2) return `+55 ${limited}`;
  if (limited.length <= 3) return `+55 ${limited.slice(0, 2)} ${limited.slice(2)}`;
  if (limited.length <= 7) return `+55 ${limited.slice(0, 2)} ${limited.slice(2, 3)} ${limited.slice(3)}`;
  if (limited.length <= 11) return `+55 ${limited.slice(0, 2)} ${limited.slice(2, 3)} ${limited.slice(3, 7)}-${limited.slice(7)}`;
  
  return `+55 ${limited.slice(0, 2)} ${limited.slice(2, 3)} ${limited.slice(3, 7)}-${limited.slice(7, 11)}`;
};

// Função para extrair apenas números do telefone formatado
const extractPhoneNumbers = (formatted: string): string => {
  return formatted.replace(/\D/g, '');
};

// Função para formatar telefone para exibição (a partir de número limpo)
const formatPhoneForDisplay = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  
  // Se já tem 55 no início
  if (numbers.startsWith('55') && numbers.length >= 12) {
    const ddd = numbers.slice(2, 4);
    const firstDigit = numbers.slice(4, 5);
    const middle = numbers.slice(5, 9);
    const end = numbers.slice(9, 13);
    return `+55 ${ddd} ${firstDigit} ${middle}-${end}`;
  }
  
  // Se tem 11 dígitos (DDD + 9 dígitos)
  if (numbers.length === 11) {
    return `+55 ${numbers.slice(0, 2)} ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }
  
  // Se tem 10 dígitos (DDD + 8 dígitos - telefone fixo)
  if (numbers.length === 10) {
    return `+55 ${numbers.slice(0, 2)} ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  
  return phone;
};

// Função para mascarar telefone para privacidade (ex: +55 11 9 9929-00**)
const maskPhoneForPrivacy = (phone: string): string => {
  const formatted = formatPhoneForDisplay(phone);
  // Substitui os últimos 2 dígitos por **
  return formatted.replace(/(\d{2})$/, '**');
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

  // Buscar clientes reais do banco de dados
  const { data: clientesBase, isLoading: isLoadingClientes } = trpc.campanhas.getClientes.useQuery();
  
  // Buscar saldo SMS real do banco de dados
  const { data: saldoData, isLoading: isLoadingSaldo, refetch: refetchSaldo } = trpc.campanhas.getSaldo.useQuery();
  
  // Dados de saldo (real ou padrão)
  const saldo = saldoData?.saldo ?? 0;
  const custoPorSms = saldoData?.custoPorSms ?? DEFAULT_COST_PER_SMS;
  const smsPossiveis = saldoData?.smsDisponiveis ?? 0;
  const ultimoDisparo = saldoData?.ultimoDisparo ? new Date(saldoData.ultimoDisparo) : null;

  // Calcular total de destinatários
  const totalDestinatarios = useMemo(() => {
    return clientesSelecionados.length + numerosImportados.length + numerosManual.length;
  }, [clientesSelecionados, numerosImportados, numerosManual]);

  // Calcular custo total
  const custoTotal = useMemo(() => {
    return totalDestinatarios * custoPorSms;
  }, [totalDestinatarios, custoPorSms]);

  // Formatar data do último disparo
  const formatarUltimoDisparo = () => {
    if (!ultimoDisparo) return "Nunca";
    
    const agora = new Date();
    const diff = agora.getTime() - ultimoDisparo.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (dias === 0) return "Hoje";
    if (dias === 1) return "Ontem";
    return `Há ${dias} dias`;
  };
  
  // Verificar se tem saldo suficiente
  const temSaldoSuficiente = saldo >= custoTotal && totalDestinatarios > 0;
  const maxDestinatariosComSaldo = Math.floor(saldo / custoPorSms);

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
      setClientesSelecionados(clientesBase?.map(c => c.id) || []);
    }
    setSelecionarTodos(!selecionarTodos);
  };

  // Handler para input de número manual com formatação automática
  const handleNumeroManualChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setNumeroManual(formatted);
  }, []);

  // Adicionar número manual
  const adicionarNumeroManual = () => {
    const numeroLimpo = extractPhoneNumbers(numeroManual);
    
    // Validar: deve ter pelo menos 12 dígitos (55 + DDD + número)
    // ou 10-11 dígitos sem o 55
    const numeroParaSalvar = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;
    
    if (numeroParaSalvar.length >= 12 && numeroParaSalvar.length <= 13) {
      if (!numerosManual.includes(numeroParaSalvar)) {
        setNumerosManual(prev => [...prev, numeroParaSalvar]);
        setNumeroManual("");
      } else {
        toast.error("Número já adicionado");
      }
    } else {
      toast.error("Número inválido. Digite DDD + número (ex: 11 9 1234-5678)");
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
      "5511999991111",
      "5511999992222",
      "5511999993333",
    ];
    setNumerosImportados(numerosSimulados);
    toast.success(`${numerosSimulados.length} números importados com sucesso!`);
  };

  // Mutation para enviar SMS
  const enviarSMSMutation = trpc.campanhas.enviarSMS.useMutation({
    onSuccess: (data) => {
      if (data.enviados > 0) {
        toast.success(`SMS enviado com sucesso para ${data.enviados} destinatário(s)!`);
      }
      if (data.falhas > 0) {
        toast.error(`Falha ao enviar para ${data.falhas} destinatário(s)`);
      }
      // Limpar seleções
      setMensagem("");
      setClientesSelecionados([]);
      setNumerosImportados([]);
      setNumerosManual([]);
      // Atualizar saldo após envio
      refetchSaldo();
    },
    onError: (error) => {
      toast.error(`Erro ao enviar SMS: ${error.message}`);
    },
  });

  // Enviar SMS usando a API real
  const handleEnviarSMS = async () => {
    if (!mensagem.trim()) {
      toast.error("Digite uma mensagem para enviar");
      return;
    }
    if (totalDestinatarios === 0) {
      toast.error("Selecione pelo menos um destinatário");
      return;
    }
    if (custoTotal > saldo) {
      toast.error(`Saldo insuficiente. Você pode enviar no máximo ${maxDestinatariosComSaldo} SMS.`);
      return;
    }

    setIsEnviando(true);
    
    // Coletar todos os números de telefone
    const todosNumeros: string[] = [];
    
    // Adicionar números dos clientes selecionados
    if (clientesBase) {
      clientesSelecionados.forEach(id => {
        const cliente = clientesBase.find(c => c.id === id);
        if (cliente?.phone) {
          todosNumeros.push(cliente.phone);
        }
      });
    }
    
    // Adicionar números importados
    todosNumeros.push(...numerosImportados);
    
    // Adicionar números manuais
    todosNumeros.push(...numerosManual);
    
    try {
      await enviarSMSMutation.mutateAsync({
        mensagem: mensagem.trim(),
        destinatarios: todosNumeros,
        nomeCampanha: "Campanha Promocional",
      });
    } finally {
      setIsEnviando(false);
    }
  };

  // Preview da mensagem com substituições
  const previewMensagem = mensagem || "Você ganhou R$15 de desconto! Use o cupom #15OFF em pedidos acima de R$ 100. Aproveite!";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Campanhas SMS"
          description="Envie mensagens promocionais para seus clientes"
        />

        {/* Cards Informativos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Saldo Disponível"
            value={isLoadingSaldo ? "..." : `R$ ${saldo.toFixed(2)}`}
            icon={Wallet}
            variant="emerald"
          />
          <StatCard
            title="Custo por SMS"
            value={`R$ ${custoPorSms.toFixed(2)}`}
            icon={DollarSign}
            variant="blue"
          />
          <StatCard
            title="SMS Possíveis"
            value={smsPossiveis.toLocaleString()}
            icon={Hash}
            variant="blue"
          />
          <StatCard
            title="Último Disparo"
            value={formatarUltimoDisparo()}
            icon={Clock}
            variant="amber"
          />
        </div>

        {/* Layout em duas colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Coluna Esquerda - Editor */}
          <div className="lg:col-span-3 space-y-6">
            {/* Editor de Mensagem */}
            <div className="bg-card rounded-xl border border-border/50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-[12px] bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">Mensagem SMS</h3>
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
                  </div>
                  <p className="text-xs text-muted-foreground">Máximo de {SMS_CHAR_LIMIT} caracteres</p>
                </div>
              </div>

              <div className="relative flex items-start gap-2">
                <Textarea
                  value={mensagem}
                  onChange={(e) => {
                    if (e.target.value.length <= SMS_CHAR_LIMIT) {
                      setMensagem(e.target.value);
                    }
                  }}
                  placeholder="Você ganhou R$15 de desconto! Use o cupom #15OFF em pedidos acima de R$ 100. Aproveite!"
                  className="min-h-[44px] resize-none flex-1"
                  rows={1}
                  style={{ height: 'auto', minHeight: '44px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = '44px';
                    target.style.height = `${Math.max(44, target.scrollHeight)}px`;
                  }}
                />
                {/* Contador de caracteres ao lado do campo */}
                <div className={cn(
                  "text-sm font-medium whitespace-nowrap pt-2.5",
                  mensagem.length > SMS_CHAR_LIMIT * 0.9 ? "text-orange-500" : "text-muted-foreground",
                  mensagem.length >= SMS_CHAR_LIMIT && "text-red-500"
                )}>
                  {mensagem.length} / {SMS_CHAR_LIMIT}
                </div>
              </div>
            </div>

            {/* Seleção de Destinatários */}
            <div className="bg-card rounded-xl border border-border/50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-[12px] bg-purple-100 flex items-center justify-center">
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
                          disabled={isLoadingClientes || !clientesBase?.length}
                        />
                        <span className="text-sm font-medium">Selecionar todos</span>
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {isLoadingClientes ? "Carregando..." : `${clientesBase?.length || 0} clientes`}
                      </span>
                    </div>
                    
                    {/* Lista de clientes */}
                    <div className="max-h-[240px] overflow-y-auto">
                      {isLoadingClientes ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : clientesBase && clientesBase.length > 0 ? (
                        clientesBase.map((cliente) => (
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
                              <p className="text-sm font-medium truncate">{cliente.name || "Cliente"}</p>
                              <p className="text-xs text-muted-foreground">{maskPhoneForPrivacy(cliente.phone)}</p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {cliente.orderCount} pedido{cliente.orderCount !== 1 ? "s" : ""}
                            </div>
                          </label>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Os clientes aparecerão aqui após realizarem pedidos
                          </p>
                        </div>
                      )}
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
                              {maskPhoneForPrivacy(numero)}
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
                        onChange={handleNumeroManualChange}
                        placeholder="+55 11 9 1234-5678"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            adicionarNumeroManual();
                          }
                        }}
                      />
                      <Button onClick={adicionarNumeroManual} className="bg-primary hover:bg-primary/90">
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
                              {maskPhoneForPrivacy(numero)}
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
            <div className="bg-card rounded-xl border border-border/50 p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Custo estimado: <span className="font-semibold text-foreground">R$ {custoTotal.toFixed(2)}</span>
                  </p>
                  {custoTotal > saldo && totalDestinatarios > 0 && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Saldo insuficiente
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleEnviarSMS}
                  disabled={isEnviando || totalDestinatarios === 0 || !mensagem.trim() || custoTotal > saldo}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90"
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

          {/* Coluna Direita - Preview */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border/50 p-5 sticky top-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Preview</h3>
                  <p className="text-xs text-muted-foreground">Como o cliente verá o SMS</p>
                </div>
              </div>

              {/* Preview estilo iOS Messages */}
              <div className="bg-gray-100 rounded-xl overflow-hidden">
                {/* Header estilo iOS */}
                <div className="bg-gray-50 px-3 py-2.5 flex items-center gap-2 border-b border-gray-200">
                  <ChevronLeft className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold text-base text-gray-900">Mensagens</span>
                </div>

                {/* Área de mensagem */}
                <div className="p-4 bg-gray-100">
                  {/* Balão de mensagem */}
                  <div className="bg-gray-200 rounded-2xl rounded-tl-sm p-3 max-w-[90%]">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                      {previewMensagem}
                    </p>
                    <p className="text-[11px] text-gray-400 text-right mt-1">Agora</p>
                  </div>
                </div>
              </div>

              {/* Informação adicional */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    O cliente verá a mensagem exatamente como mostrado acima.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
