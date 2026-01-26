import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, StatusBadge, EmptyState, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Package,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  RefreshCw,
  Printer,
  Smartphone,
  MessageCircle,
  Mail,
  Calendar,
  User,
  Trash2,
  Edit,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useOrdersSSE } from "@/hooks/useOrdersSSE";
import { useNewOrders } from "@/contexts/NewOrdersContext";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type OrderStatus = "new" | "preparing" | "ready" | "completed" | "cancelled";

const statusConfig: Record<OrderStatus, { 
  label: string; 
  variant: "success" | "warning" | "error" | "info" | "default";
  icon: typeof Clock;
  color: string;
  bgColor: string;
}> = {
  new: { label: "Novo", variant: "info", icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50" },
  preparing: { label: "Preparando", variant: "warning", icon: ChefHat, color: "text-amber-600", bgColor: "bg-amber-50" },
  ready: { label: "Pronto", variant: "success", icon: Package, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  completed: { label: "Finalizado", variant: "default", icon: CheckCircle, color: "text-gray-600", bgColor: "bg-gray-50" },
  cancelled: { label: "Cancelado", variant: "error", icon: XCircle, color: "text-red-600", bgColor: "bg-red-50" },
};

const paymentMethodLabels: Record<string, { label: string; icon: typeof CreditCard }> = {
  cash: { label: "Dinheiro", icon: Banknote },
  card: { label: "Cartão", icon: CreditCard },
  pix: { label: "Pix", icon: CreditCard },
  boleto: { label: "Boleto", icon: CreditCard },
};

export default function Pedidos() {
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("new");
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // All hooks MUST be called before any early return
  const utils = trpc.useUtils();
  
  // Query para buscar todos os pedidos (para contagem)
  const { data: allOrdersData, refetch: refetchAll } = trpc.orders.list.useQuery(
    { 
      establishmentId: establishmentId ?? 0,
    },
    { 
      enabled: !!establishmentId && establishmentId > 0,
      // Polling como fallback apenas se SSE não estiver conectado
      refetchInterval: false,
    }
  );

  // Query para buscar pedidos filtrados por status
  const { data: ordersData, refetch, isLoading } = trpc.orders.list.useQuery(
    { 
      establishmentId: establishmentId ?? 0,
      status: activeTab !== "all" ? activeTab : undefined,
    },
    { 
      enabled: !!establishmentId && establishmentId > 0,
      // Polling como fallback apenas se SSE não estiver conectado
      refetchInterval: false,
    }
  );

  // Handlers para eventos SSE
  const handleNewOrder = useCallback(() => {
    // Atualizar cache do tRPC quando novo pedido chegar
    refetch();
    refetchAll();
    // Som de notificação é gerenciado pelo NewOrdersContext
    // Não tocar som aqui para evitar duplicação e respeitar preferência do usuário
    toast.success("Novo pedido recebido!", {
      description: "Um novo pedido acabou de chegar.",
      duration: 5000,
    });
  }, [refetch, refetchAll]);

  const handleOrderUpdate = useCallback(() => {
    // Atualizar cache do tRPC quando pedido for atualizado
    refetch();
    refetchAll();
  }, [refetch, refetchAll]);

  const handleSSEConnected = useCallback(() => {
    console.log("[Pedidos] SSE conectado - tempo real ativado");
  }, []);

  const handleSSEDisconnected = useCallback(() => {
    console.log("[Pedidos] SSE desconectado - ativando fallback de polling");
    // Quando SSE desconectar, fazer refetch manual
    refetch();
    refetchAll();
  }, [refetch, refetchAll]);

  // Hook SSE para receber pedidos em tempo real
  // IMPORTANTE: Passa establishmentId para garantir conexão única por estabelecimento
  const { status: sseStatus, isConnected: sseConnected } = useOrdersSSE({
    establishmentId: establishmentId ?? undefined,
    onNewOrder: handleNewOrder,
    onOrderUpdate: handleOrderUpdate,
    onConnected: handleSSEConnected,
    onDisconnected: handleSSEDisconnected,
    enabled: !!establishmentId && establishmentId > 0,
  });

  // Fallback: polling a cada 30 segundos se SSE não estiver conectado
  useEffect(() => {
    if (!establishmentId || sseConnected) return;
    
    const interval = setInterval(() => {
      console.log("[Pedidos] Polling fallback - SSE não conectado");
      refetch();
      refetchAll();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [establishmentId, sseConnected, refetch, refetchAll]);

  const allOrders = allOrdersData?.orders || [];
  const orders = ordersData?.orders || [];

  const { data: orderDetails } = trpc.orders.get.useQuery(
    { id: selectedOrder! },
    { enabled: !!selectedOrder }
  );

  // Hook para gerenciar contagem de pedidos novos na sidebar
  const { decrementCount } = useNewOrders();

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    // Optimistic update: atualiza a UI instantaneamente antes da resposta do servidor
    onMutate: async (variables) => {
      console.log("[Pedidos] Optimistic update iniciado", { orderId: variables.id, newStatus: variables.status });
      
      // Cancelar queries em andamento para evitar sobrescrever o optimistic update
      await utils.orders.list.cancel();
      
      // Salvar estado anterior para rollback em caso de erro
      const previousAllOrders = utils.orders.list.getData({ establishmentId: establishmentId ?? 0 });
      const previousFilteredOrders = utils.orders.list.getData({ 
        establishmentId: establishmentId ?? 0,
        status: activeTab !== "all" ? activeTab : undefined,
      });
      
      // Atualizar cache otimisticamente para todas as queries de pedidos
      utils.orders.list.setData(
        { establishmentId: establishmentId ?? 0 },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            orders: old.orders.map(order => 
              order.id === variables.id 
                ? { ...order, status: variables.status, cancellationReason: variables.cancellationReason || order.cancellationReason }
                : order
            ),
          };
        }
      );
      
      // Atualizar cache para TODAS as queries de status específico
      // Isso garante que o pedido seja removido do card antigo e apareça no novo instantaneamente
      const allStatuses: (OrderStatus | undefined)[] = ["new", "preparing", "ready", "completed", "cancelled", undefined];
      
      for (const status of allStatuses) {
        utils.orders.list.setData(
          { establishmentId: establishmentId ?? 0, status },
          (old) => {
            if (!old) return old;
            
            // Se este é o status ANTIGO do pedido, filtrar o pedido para removê-lo
            // Se este é o status NOVO do pedido, adicionar o pedido
            const orderInList = old.orders.find(o => o.id === variables.id);
            
            if (orderInList) {
              // O pedido está nesta lista - atualizar seu status
              // Se o novo status não corresponde ao filtro desta query, o pedido será filtrado naturalmente
              return {
                ...old,
                orders: old.orders.map(order => 
                  order.id === variables.id 
                    ? { ...order, status: variables.status, cancellationReason: variables.cancellationReason || order.cancellationReason }
                    : order
                ).filter(order => {
                  // Se a query tem filtro de status, filtrar pedidos que não correspondem
                  if (status === undefined) return true; // Query sem filtro mostra todos
                  return order.status === status;
                }),
              };
            }
            
            // Se o pedido não está nesta lista mas o novo status corresponde ao filtro,
            // precisamos buscar o pedido de outra lista e adicioná-lo
            if (status === variables.status || status === undefined) {
              // Buscar o pedido da lista principal
              const mainList = utils.orders.list.getData({ establishmentId: establishmentId ?? 0 });
              const orderToAdd = mainList?.orders.find(o => o.id === variables.id);
              
              if (orderToAdd && !old.orders.find(o => o.id === variables.id)) {
                return {
                  ...old,
                  orders: [...old.orders, { ...orderToAdd, status: variables.status }],
                };
              }
            }
            
            return old;
          }
        );
      }
      
      // Decrementar badge se estava como "new"
      const order = previousAllOrders?.orders?.find(o => o.id === variables.id);
      if (order?.status === "new" && variables.status !== "new") {
        decrementCount();
      }
      
      console.log("[Pedidos] Optimistic update aplicado");
      
      return { previousAllOrders, previousFilteredOrders };
    },
    onSuccess: (_data, variables) => {
      console.log("[Pedidos] Mutation sucesso - confirmando optimistic update");
      toast.success("Status atualizado");
      // Refetch para garantir sincronização com servidor
      refetch();
      refetchAll();
    },
    onError: (error, variables, context) => {
      console.error("[Pedidos] Mutation erro - revertendo optimistic update", error);
      toast.error("Erro ao atualizar status");
      
      // Rollback para estado anterior em caso de erro
      if (context?.previousAllOrders) {
        utils.orders.list.setData(
          { establishmentId: establishmentId ?? 0 },
          context.previousAllOrders
        );
      }
      if (context?.previousFilteredOrders) {
        utils.orders.list.setData(
          { establishmentId: establishmentId ?? 0, status: activeTab !== "all" ? activeTab : undefined },
          context.previousFilteredOrders
        );
      }
    },
  });

  // Função para imprimir pedido diretamente do card (sem precisar abrir detalhes)
  const handlePrintOrderDirect = async (orderId: number) => {
    // IMPORTANTE: Em PWA, window.open() só funciona em resposta direta a evento de usuário
    // Se houver um await antes, o contexto de evento se perde e o popup é bloqueado
    // Solução: abrir a janela ANTES de fazer o fetch
    const printWindow = window.open('about:blank', '_blank');
    if (!printWindow) {
      toast.error("Erro ao abrir janela de impressão. Verifique se popups estão permitidos.");
      return;
    }
    
    // Mostrar loading na janela enquanto carrega
    printWindow.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial;"><p>Carregando pedido...</p></body></html>');
    
    try {
      // Buscar detalhes do pedido
      const orderData = await utils.orders.get.fetch({ id: orderId });
      if (!orderData) {
        printWindow.close();
        toast.error("Erro ao carregar pedido para impressão");
        return;
      }
      
      // Gerar HTML dos itens com adicionais e observações
      const itemsHtml = orderData.items?.map((item: any) => {
        const complementsHtml = item.complements && item.complements.length > 0
          ? item.complements.map((c: any) => {
              const price = Number(c.price || 0);
              const priceStr = price > 0 ? ` (R$ ${price.toFixed(2).replace('.', ',')})` : '';
              return `<div class="item-complement">+ ${c.name}${priceStr}</div>`;
            }).join('')
          : '';
        return `
          <div class="item">
            <div class="item-header">
              <span class="item-qty">${item.quantity}x ${item.productName}</span>
              <span class="item-price">R$ ${Number(item.totalPrice).toFixed(2).replace('.', ',')}</span>
            </div>
            ${complementsHtml}
            ${item.notes ? `<div class="item-obs">Obs: ${item.notes}</div>` : ''}
          </div>
        `;
      }).join('') || '';
      
      const discount = orderData.discount ? Number(orderData.discount) : 0;
      
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pedido ${orderData.orderNumber?.startsWith('#') ? orderData.orderNumber : `#${orderData.orderNumber}`}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 13px; padding: 20px; max-width: 320px; margin: 0 auto; background: #f5f5f0; color: #333; }
            .receipt { background: #f5f5f0; padding: 10px; }
            .logo { text-align: center; padding-bottom: 15px; margin-bottom: 15px; }
            .logo h1 { font-size: 22px; font-weight: bold; margin: 0; letter-spacing: 1px; }
            .logo p { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px; }
            .order-info { margin-bottom: 15px; }
            .order-info h2 { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
            .order-info p { font-size: 12px; color: #666; }
            .divider { border: none; border-top: 1px solid #ccc; margin: 12px 0; }
            .divider-dashed { border: none; border-top: 1px dashed #bbb; margin: 10px 0; }
            .item { margin-bottom: 10px; }
            .item-header { display: flex; justify-content: space-between; font-weight: 500; }
            .item-obs { font-size: 11px; color: #666; margin-top: 2px; padding-left: 5px; }
            .item-complement { font-size: 11px; color: #555; margin-top: 2px; padding-left: 10px; }
            .totals { margin: 15px 0; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; }
            .total-row.final { font-weight: bold; font-size: 15px; margin-top: 8px; }
            .section { margin: 15px 0; }
            .section-title { font-weight: bold; font-size: 14px; margin-bottom: 6px; }
            .section-content { font-size: 13px; color: #444; line-height: 1.4; }
            .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ccc; }
            .footer p { font-size: 11px; color: #666; }
            @media print { body { padding: 0; background: white; } .receipt { background: white; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="logo">
              <h1>${establishment?.name || 'Cardápio'}</h1>
              <p>Sistema de Pedidos</p>
            </div>
            <div class="order-info">
              <h2>Pedido ${orderData.orderNumber?.startsWith('#') ? orderData.orderNumber : `#${orderData.orderNumber}`}</h2>
              <p>Realizado em: ${format(new Date(orderData.createdAt), "dd/MM/yyyy")} - ${format(new Date(orderData.createdAt), "HH:mm")}</p>
            </div>
            <hr class="divider">
            <div class="items">${itemsHtml}</div>
            <hr class="divider-dashed">
            <div class="totals">
              <div class="total-row"><span>Valor dos produtos</span><span>R$ ${Number(orderData.subtotal).toFixed(2).replace('.', ',')}</span></div>
              ${orderData.couponCode ? `<div class="total-row"><span>Cupom aplicado</span><span>${orderData.couponCode}</span></div>` : ''}
              ${discount > 0 ? `<div class="total-row"><span>Desconto</span><span>- R$ ${discount.toFixed(2).replace('.', ',')}</span></div>` : ''}
              <div class="total-row"><span>Taxa de entrega</span><span>${Number(orderData.deliveryFee) > 0 ? `R$ ${Number(orderData.deliveryFee).toFixed(2).replace('.', ',')}` : 'Grátis'}</span></div>
              <div class="total-row final"><span>Total</span><span>R$ ${Number(orderData.total).toFixed(2).replace('.', ',')}</span></div>
            </div>
            ${orderData.notes ? `<hr class="divider"><div class="section"><div class="section-title">Observações:</div><div class="section-content">${orderData.notes}</div></div>` : ''}
            <hr class="divider">
            <div class="section">
              <div class="section-title">${orderData.deliveryType === 'delivery' ? 'Endereço de Entrega' : 'Retirada no Local'}</div>
              <div class="section-content">
                ${orderData.deliveryType === 'delivery' ? `${(orderData as any).deliveryAddress || (orderData as any).address || ''}<br>${(orderData as any).deliveryNeighborhood || (orderData as any).neighborhood || ''}` : 'Cliente irá retirar no estabelecimento'}
              </div>
            </div>
            <div class="section">
              <div class="section-title">Pagamento</div>
              <div class="section-content">${orderData.paymentMethod === 'pix' ? 'PIX' : orderData.paymentMethod === 'card' ? 'Cartão' : orderData.paymentMethod === 'cash' ? 'Dinheiro' : orderData.paymentMethod === 'boleto' ? 'Boleto' : orderData.paymentMethod}</div>
            </div>
            <div class="section">
              <div class="section-title">Cliente</div>
              <div class="section-content">${orderData.customerName || 'Não informado'}<br>${orderData.customerPhone || ''}</div>
            </div>
            <div class="footer"><p>Pedido realizado via Cardápio Admin</p><p>manus.space</p></div>
          </div>
          <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
        </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
    } catch (error) {
      console.error("Erro ao imprimir pedido:", error);
      toast.error("Erro ao imprimir pedido");
    }
  };

  // Função para imprimir via app ESC POS Android (impressora térmica)
  const handlePrintThermal = (orderId: number) => {
    // Detectar se é Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    // URL do recibo no servidor (precisa ser uma URL HTTP acessível, não blob)
    const receiptUrl = `${window.location.origin}/api/print/receipt/${orderId}`;
    
    if (isAndroid) {
      // Usar app-link do ESC POS Wifi Print Service
      const printUrl = `print://escpos.org/escpos/net/print?srcTp=uri&srcObj=html&numCopies=1&src='${encodeURIComponent(receiptUrl)}'`;
      window.location.href = printUrl;
      toast.success("Enviando para impressora térmica...");
    } else {
      // Em outros dispositivos, abrir o recibo em nova aba
      window.open(receiptUrl, '_blank');
      toast.info("Recibo aberto em nova aba. Para impressão térmica, use um dispositivo Android com o app ESC POS Wifi Print Service.");
    }
  };

  // Função para imprimir apenas o pedido (do modal de detalhes)
  const handlePrintOrder = () => {
    if (!orderDetails) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Erro ao abrir janela de impressão");
      return;
    }
    
    // Gerar HTML dos itens com adicionais e observações
    const itemsHtml = orderDetails.items?.map(item => {
      const unitPrice = Number(item.totalPrice) / item.quantity;
      // Gerar HTML dos complementos com preço
      const complementsHtml = item.complements && item.complements.length > 0
        ? item.complements.map((c: any) => {
            const price = Number(c.price || 0);
            const priceStr = price > 0 ? ` (R$ ${price.toFixed(2).replace('.', ',')})` : '';
            return `<div class="item-complement">+ ${c.name}${priceStr}</div>`;
          }).join('')
        : '';
      return `
        <div class="item">
          <div class="item-header">
            <span class="item-qty">${item.quantity}x ${item.productName}</span>
            <span class="item-price">R$ ${Number(item.totalPrice).toFixed(2).replace('.', ',')}</span>
          </div>
          ${complementsHtml}
          ${item.notes ? `<div class="item-obs">Obs: ${item.notes}</div>` : ''}
        </div>
      `;
    }).join('') || '';
    
    // Calcular desconto se houver cupom
    const discount = orderDetails.discount ? Number(orderDetails.discount) : 0;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedido ${orderDetails.orderNumber?.startsWith('#') ? orderDetails.orderNumber : `#${orderDetails.orderNumber}`}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 13px; 
            padding: 20px; 
            max-width: 320px; 
            margin: 0 auto; 
            background: #f5f5f0;
            color: #333;
          }
          .receipt {
            background: #f5f5f0;
            padding: 10px;
          }
          .logo {
            text-align: center;
            padding-bottom: 15px;
            margin-bottom: 15px;
          }
          .logo h1 {
            font-size: 22px;
            font-weight: bold;
            margin: 0;
            letter-spacing: 1px;
          }
          .logo p {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 2px;
          }
          .order-info {
            margin-bottom: 15px;
          }
          .order-info h2 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .order-info p {
            font-size: 12px;
            color: #666;
          }
          .divider {
            border: none;
            border-top: 1px solid #ccc;
            margin: 12px 0;
          }
          .divider-dashed {
            border: none;
            border-top: 1px dashed #bbb;
            margin: 10px 0;
          }
          .item {
            margin-bottom: 10px;
          }
          .item-header {
            display: flex;
            justify-content: space-between;
            font-weight: 500;
          }
          .item-obs {
            font-size: 11px;
            color: #666;
            margin-top: 2px;
            padding-left: 5px;
          }
          .item-complement {
            font-size: 11px;
            color: #555;
            margin-top: 2px;
            padding-left: 10px;
          }
          .totals {
            margin: 15px 0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 13px;
          }
          .total-row.final {
            font-weight: bold;
            font-size: 15px;
            margin-top: 8px;
          }
          .section {
            margin: 15px 0;
          }
          .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 6px;
          }
          .section-content {
            font-size: 13px;
            color: #444;
            line-height: 1.4;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #ccc;
          }
          .footer p {
            font-size: 11px;
            color: #666;
          }
          @media print { 
            body { 
              padding: 0; 
              background: white;
            }
            .receipt {
              background: white;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="logo">
            <h1>${establishment?.name || 'Cardápio'}</h1>
            <p>Sistema de Pedidos</p>
          </div>
          
          <div class="order-info">
            <h2>Pedido ${orderDetails.orderNumber?.startsWith('#') ? orderDetails.orderNumber : `#${orderDetails.orderNumber}`}</h2>
            <p>Realizado em: ${format(new Date(orderDetails.createdAt), "dd/MM/yyyy")} - ${format(new Date(orderDetails.createdAt), "HH:mm")}</p>
          </div>
          
          <hr class="divider">
          
          <div class="items">
            ${itemsHtml}
          </div>
          
          <hr class="divider-dashed">
          
          <div class="totals">
            <div class="total-row">
              <span>Valor dos produtos</span>
              <span>R$ ${Number(orderDetails.subtotal).toFixed(2).replace('.', ',')}</span>
            </div>
            ${orderDetails.couponCode ? `
            <div class="total-row">
              <span>Cupom aplicado</span>
              <span>${orderDetails.couponCode}</span>
            </div>
            ` : ''}
            ${discount > 0 ? `
            <div class="total-row">
              <span>Desconto</span>
              <span>- R$ ${discount.toFixed(2).replace('.', ',')}</span>
            </div>
            ` : ''}
            <div class="total-row">
              <span>Taxa de entrega</span>
              <span>${Number(orderDetails.deliveryFee) > 0 ? `R$ ${Number(orderDetails.deliveryFee).toFixed(2).replace('.', ',')}` : 'Grátis'}</span>
            </div>
            <div class="total-row final">
              <span>Total</span>
              <span>R$ ${Number(orderDetails.total).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
          
          ${orderDetails.notes ? `
          <hr class="divider">
          <div class="section">
            <div class="section-title">Observações:</div>
            <div class="section-content">${orderDetails.notes}</div>
          </div>
          ` : ''}
          
          <hr class="divider">
          
          <div class="section">
            <div class="section-title">Entrega</div>
            <div class="section-content">
              ${orderDetails.deliveryType === 'delivery' ? 
                (orderDetails.customerAddress || 'Endereço não informado') : 
                'Retirada no local'
              }
            </div>
          </div>
          
          <hr class="divider">
          
          <div class="section">
            <div class="section-title">Forma de pagamento</div>
            <div class="section-content">${paymentMethodLabels[orderDetails.paymentMethod]?.label || orderDetails.paymentMethod}</div>
          </div>
          
          <hr class="divider">
          
          <div class="section">
            <div class="section-title">Cliente</div>
            <div class="section-content">
              ${orderDetails.customerName || 'Não informado'}<br>
              ${orderDetails.customerPhone || ''}
            </div>
          </div>
          
          <div class="footer">
            <p>Pedido realizado via Cardápio Admin</p>
            <p>manus.space</p>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Se não há estabelecimento, mostrar tela de criação
  if (!establishmentLoading && !establishment) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-6 bg-muted/30 rounded-3xl mb-6">
            <ClipboardList className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Configure seu estabelecimento</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Antes de gerenciar pedidos, você precisa configurar as informações do seu estabelecimento.
          </p>
          <Button onClick={() => window.location.href = "/configuracoes"} className="rounded-xl">
            Ir para Configurações
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const handleStatusUpdate = (orderId: number, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
    
    // Se está aceitando o pedido (mudando de "new" para "preparing"), enviar para impressão térmica automaticamente
    if (newStatus === "preparing") {
      // Mostrar notificação visual de pedido aceito e enviado para impressão
      toast.success("📦 Pedido aceito e enviado para impressão!", {
        description: "O pedido foi aceito e está sendo enviado para a impressora térmica.",
        duration: 4000,
      });
      
      // Pequeno delay para garantir que a mutação foi processada
      setTimeout(() => {
        handlePrintThermal(orderId);
      }, 300);
    }
  };

  const handleCancelOrder = () => {
    if (orderToCancel) {
      updateStatusMutation.mutate(
        { id: orderToCancel, status: "cancelled", cancellationReason: cancellationReason || undefined },
        {
          onSuccess: () => {
            setCancelDialogOpen(false);
            setOrderToCancel(null);
            setCancellationReason("");
          },
        }
      );
    }
  };

  const getNextAction = (status: OrderStatus): { label: string; newStatus: OrderStatus } | null => {
    switch (status) {
      case "new":
        return { label: "Aceitar", newStatus: "preparing" };
      case "preparing":
        return { label: "Pronto", newStatus: "ready" };
      case "ready":
        return { label: "Finalizar", newStatus: "completed" };
      default:
        return null;
    }
  };

  // Count orders by status
  // Calcular contagem usando todos os pedidos
  const orderCounts = {
    new: allOrders?.filter(o => o.status === "new").length ?? 0,
    preparing: allOrders?.filter(o => o.status === "preparing").length ?? 0,
    ready: allOrders?.filter(o => o.status === "ready").length ?? 0,
    completed: allOrders?.filter(o => o.status === "completed").length ?? 0,
    cancelled: allOrders?.filter(o => o.status === "cancelled").length ?? 0,
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Pedidos"
          description="Gerencie os pedidos do seu estabelecimento"
        />
        <div className="hidden sm:flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
            sseConnected 
              ? "bg-emerald-100 text-emerald-700" 
              : "bg-amber-100 text-amber-700"
          )}>
            <span className={cn(
              "w-2 h-2 rounded-full",
              sseConnected 
                ? "bg-emerald-500 animate-pulse" 
                : "bg-amber-500"
            )} />
            {sseConnected ? "Tempo real" : "Polling"}
          </div>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {/* Novos */}
        <div 
          className={cn(
            "bg-card rounded-xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer",
            activeTab === "new" && "ring-2 ring-blue-500"
          )}
          onClick={() => setActiveTab("new")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Novos</p>
              <p className="text-2xl font-bold mt-1 tracking-tight text-blue-600">{orderCounts.new}</p>
            </div>
            <div className="p-2.5 bg-blue-100 rounded-lg shrink-0">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        {/* Em Preparo */}
        <div 
          className={cn(
            "bg-card rounded-xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer",
            activeTab === "preparing" && "ring-2 ring-amber-500"
          )}
          onClick={() => setActiveTab("preparing")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Em Preparo</p>
              <p className="text-2xl font-bold mt-1 tracking-tight text-amber-600">{orderCounts.preparing}</p>
            </div>
            <div className="p-2.5 bg-amber-100 rounded-lg shrink-0">
              <ChefHat className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
        {/* Prontos */}
        <div 
          className={cn(
            "bg-card rounded-xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer",
            activeTab === "ready" && "ring-2 ring-emerald-500"
          )}
          onClick={() => setActiveTab("ready")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Prontos</p>
              <p className="text-2xl font-bold mt-1 tracking-tight text-emerald-600">{orderCounts.ready}</p>
            </div>
            <div className="p-2.5 bg-emerald-100 rounded-lg shrink-0">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>
        {/* Finalizados */}
        <div 
          className={cn(
            "bg-card rounded-xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer",
            activeTab === "completed" && "ring-2 ring-gray-500"
          )}
          onClick={() => setActiveTab("completed")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Finalizados</p>
              <p className="text-2xl font-bold mt-1 tracking-tight text-gray-600">{orderCounts.completed}</p>
            </div>
            <div className="p-2.5 bg-gray-100 rounded-lg shrink-0">
              <CheckCircle className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>
        {/* Cancelados - Oculto no mobile */}
        <div 
          className={cn(
            "hidden md:block bg-card rounded-xl p-4 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer border-red-200/50 bg-red-50/30",
            activeTab === "cancelled" && "ring-2 ring-red-500"
          )}
          onClick={() => setActiveTab("cancelled")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Cancelados</p>
              <p className="text-2xl font-bold mt-1 tracking-tight text-red-600">{orderCounts.cancelled}</p>
            </div>
            <div className="p-2.5 bg-red-100 rounded-lg shrink-0">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderStatus | "all")}>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
                  <div className="skeleton h-5 w-24 rounded-md mb-3" />
                  <div className="skeleton h-4 w-full rounded-md mb-2" />
                  <div className="skeleton h-3 w-2/3 rounded-md mb-4" />
                  <div className="skeleton h-9 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {orders.map((order) => {
                const config = statusConfig[order.status as OrderStatus];
                const nextAction = getNextAction(order.status as OrderStatus);
                const PaymentIcon = paymentMethodLabels[order.paymentMethod]?.icon || CreditCard;

                return (
                  <div
                    key={order.id}
                    className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-200"
                  >
                    {/* Header */}
                    <div className={cn("px-4 py-3 flex items-center justify-between", config.bgColor)}>
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg bg-white/80", config.color)}>
                          <config.icon className="h-3.5 w-3.5" />
                        </div>
                        <span className={cn("font-bold text-sm", config.color)}>{order.orderNumber?.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}</span>
                      </div>
                      <div className={cn("flex items-center gap-1 text-xs font-medium", config.color)}>
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(order.createdAt), {
                          addSuffix: false,
                          locale: ptBR,
                        })}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Linha compacta com todas as informações (mobile e desktop) */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* Nome do cliente */}
                          {order.customerName && (
                            <span className="font-semibold text-sm truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px]">
                              {order.customerName}
                            </span>
                          )}
                          
                          {/* Separador */}
                          {order.customerName && (
                            <span className="text-muted-foreground/50">•</span>
                          )}
                          
                          {/* Ícone e método de pagamento */}
                          <span className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                            <PaymentIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            {paymentMethodLabels[order.paymentMethod]?.label}
                          </span>
                          
                          {/* Tag de entrega/retirada */}
                          <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-muted/50 rounded text-[10px] sm:text-xs font-medium capitalize whitespace-nowrap">
                            {order.deliveryType === "delivery" ? "Entrega" : "Retirada"}
                          </span>
                        </div>
                        
                        {/* Valor total */}
                        <span className="text-base sm:text-lg font-bold text-primary whitespace-nowrap">
                          {formatCurrency(order.total)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-lg border-border/50 hover:bg-accent text-muted-foreground hover:text-foreground"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Imprimir</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handlePrintOrderDirect(order.id)}>
                              <Printer className="h-4 w-4 mr-2" />
                              Impressão Normal
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintThermal(order.id)}>
                              <Smartphone className="h-4 w-4 mr-2" />
                              Impressora Térmica (Android)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-9 rounded-lg border-border/50 hover:bg-accent text-sm"
                          onClick={() => setSelectedOrder(order.id)}
                        >
                          Ver detalhes
                        </Button>
                        {nextAction && (
                          <Button
                            size="sm"
                            className="flex-1 h-9 rounded-lg shadow-sm text-sm"
                            onClick={() => handleStatusUpdate(order.id, nextAction.newStatus)}
                            disabled={updateStatusMutation.isPending}
                          >
                            {nextAction.label}
                          </Button>
                        )}
                        {order.status !== "completed" && order.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                            onClick={() => {
                              setOrderToCancel(order.id);
                              setCancelDialogOpen(true);
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <SectionCard>
              <EmptyState
                icon={ClipboardList}
                title="Nenhum pedido"
                description={
                  activeTab === "new"
                    ? "Novos pedidos aparecerão aqui"
                    : `Nenhum pedido ${statusConfig[activeTab as OrderStatus]?.label.toLowerCase() || ""}`
                }
              />
            </SectionCard>
          )}
        </TabsContent>
      </Tabs>

      {/* Order Details Sidebar */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-lg">Detalhes do Pedido</span>
            </div>
          </div>

          {orderDetails && (
            <div className="overflow-y-auto flex-1">
              {/* Order ID and Actions */}
              <div className="px-6 py-4 bg-muted/20 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Pedido {orderDetails.orderNumber?.startsWith('#') ? orderDetails.orderNumber : `#${orderDetails.orderNumber}`}</h2>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(orderDetails.createdAt), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge variant={statusConfig[orderDetails.status as OrderStatus]?.variant}>
                    {statusConfig[orderDetails.status as OrderStatus]?.label}
                  </StatusBadge>
                </div>
              </div>

              {/* Info Cards - Layout Vertical */}
              <div className="px-6 py-4 space-y-4">
                {/* Customer Info */}
                <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-3">Informações do Cliente</h4>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {orderDetails.customerName?.charAt(0) || "C"}
                      </span>
                      <span className="font-medium truncate">{orderDetails.customerName || "Cliente"}</span>
                    </div>
                    {orderDetails.customerPhone && (
                      <span className="text-muted-foreground shrink-0">{orderDetails.customerPhone}</span>
                    )}
                  </div>
                  {orderDetails.customerPhone && (
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => window.open(`tel:${orderDetails.customerPhone}`)}>
                        Ligar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => window.open(`https://wa.me/${orderDetails.customerPhone?.replace(/\D/g, '')}`, '_blank')}>
                        Mensagem
                      </Button>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-4">Itens do Pedido</h4>
                  <div className="space-y-3">
                    {orderDetails.items?.map((item, index) => (
                      <div key={index} className="border-b border-border/30 pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between">
                          <span className="font-medium text-sm">{item.productName}</span>
                          <span className="font-semibold text-sm">{formatCurrency(item.totalPrice)}</span>
                        </div>
                        {/* Complementos do item */}
                        {item.complements && item.complements.length > 0 && (
                          <div className="mt-1.5 pl-2 border-l-2 border-primary/30">
                            {item.complements.map((complement: { name: string; price: number }, compIndex: number) => (
                              <div key={compIndex} className="flex justify-between text-xs text-muted-foreground">
                                <span className="text-foreground/70">+ {complement.name}</span>
                                {complement.price > 0 && (
                                  <span className="text-foreground/70">+ {formatCurrency(complement.price)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {(Number(item.unitPrice) > 0 || item.notes) && (
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{item.notes || ""}</span>
                            {Number(item.unitPrice) > 0 && (
                              <span>{formatCurrency(item.unitPrice)} x {item.quantity}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Price Details */}
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                    <h5 className="font-medium text-sm mb-2">Detalhes do Preço</h5>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(orderDetails.subtotal)}</span>
                    </div>
                    {Number(orderDetails.deliveryFee) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxa de Entrega:</span>
                        <span className="font-medium">{formatCurrency(orderDetails.deliveryFee)}</span>
                      </div>
                    )}
                    {orderDetails.couponCode && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cupom Aplicado:</span>
                        <span className="font-medium text-emerald-600">{orderDetails.couponCode}</span>
                      </div>
                    )}
                    {Number(orderDetails.discount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Desconto:</span>
                        <span className="font-medium text-red-500">-{formatCurrency(orderDetails.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa da Plataforma:</span>
                      <span className="font-medium">Grátis</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border/50">
                      <span className="font-bold text-primary">Total:</span>
                      <span className="font-bold text-primary">{formatCurrency(orderDetails.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery & Payment Info - Unified Card */}
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-3">Entrega e Pagamento</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{orderDetails.deliveryType === "delivery" ? "Entrega" : "Retirada"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Método:</span>
                      <span className="font-medium">{paymentMethodLabels[orderDetails.paymentMethod]?.label || orderDetails.paymentMethod}</span>
                    </div>
                    {orderDetails.customerAddress && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Endereço:</span>
                        <span className="font-medium text-right max-w-[180px]">{orderDetails.customerAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="border border-border/50 rounded-xl p-4">
                  <h4 className="font-semibold text-base mb-4">Status do Pedido</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          orderDetails.status !== "cancelled" ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
                        )}>
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <div className="w-0.5 h-8 bg-border/50" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Pedido Recebido</p>
                        <p className="text-xs text-muted-foreground">Pedido criado no sistema</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          ["preparing", "ready", "completed"].includes(orderDetails.status) ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
                        )}>
                          <ChefHat className="h-4 w-4" />
                        </div>
                        <div className="w-0.5 h-8 bg-border/50" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Em Preparo</p>
                        <p className="text-xs text-muted-foreground">Pedido sendo preparado</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          ["ready", "completed"].includes(orderDetails.status) ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
                        )}>
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="w-0.5 h-8 bg-border/50" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Pronto</p>
                        <p className="text-xs text-muted-foreground">Pedido pronto para entrega/retirada</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          orderDetails.status === "completed" ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
                        )}>
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Finalizado</p>
                        <p className="text-xs text-muted-foreground">Pedido entregue ao cliente</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {orderDetails.notes && (
                <div className="px-6 py-4">
                  <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-amber-800 mb-2">Observações</h4>
                    <p className="text-sm text-amber-700">{orderDetails.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Printer className="h-4 w-4" />
                  Imprimir Pedido
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={handlePrintOrder}>
                  <Printer className="h-4 w-4 mr-2" />
                  Impressão Normal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => orderDetails && handlePrintThermal(orderDetails.id)}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Impressora Térmica (Android)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                const phone = orderDetails?.customerPhone?.replace(/\D/g, '');
                if (phone) {
                  window.open(`https://wa.me/${phone}?text=Olá! Sobre seu pedido %23${orderDetails?.orderNumber}...`, '_blank');
                } else {
                  toast.error("Cliente não possui telefone cadastrado");
                }
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Mensagem no WhatsApp
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={(open) => {
        setCancelDialogOpen(open);
        if (!open) setCancellationReason("");
      }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancelar pedido</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo do cancelamento (obrigatório)
            </label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Ex: Produto indisponível, cliente solicitou cancelamento..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
              rows={3}
            />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="rounded-xl">
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={updateStatusMutation.isPending || !cancellationReason.trim()}
              className="rounded-xl"
            >
              {updateStatusMutation.isPending ? "Cancelando..." : "Cancelar Pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
