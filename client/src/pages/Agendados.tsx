import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { StatCard, PageHeader, SectionCard, StatusBadge, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  Package,
  Truck,
  Store,
  UtensilsCrossed,
  Check,
  X,
  RefreshCw,
  CalendarDays,
  ListChecks,
  ArrowRightCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const periodOptions = [
  { value: "today" as const, label: "Hoje" },
  { value: "7days" as const, label: "7 dias" },
  { value: "month" as const, label: "Este mês" },
];

export default function Agendados() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [filterRange, setFilterRange] = useState<"today" | "7days" | "month">("month");
  const [rescheduleOrderId, setRescheduleOrderId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  // Fetch establishment
  const { data: establishment } = trpc.establishment.get.useQuery();

  // Fetch scheduled orders for the current month view
  const startOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const endDate = new Date(currentYear, currentMonth + 1, 0);
  const endOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  const { data: scheduledOrders, isLoading, refetch } = trpc.scheduling.getByRange.useQuery(
    {
      startDate: startOfMonth,
      endDate: endOfMonth,
    },
    { enabled: !!establishment?.id }
  );

  // Mutations
  const acceptOrder = trpc.scheduling.accept.useMutation({
    onSuccess: () => {
      toast.success("Pedido aceito antecipadamente!");
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const cancelOrder = trpc.scheduling.cancel.useMutation({
    onSuccess: () => {
      toast.success("Pedido agendado cancelado.");
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rescheduleOrder = trpc.scheduling.reschedule.useMutation({
    onSuccess: () => {
      toast.success("Pedido reagendado com sucesso!");
      setRescheduleOrderId(null);
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Calendar data
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startPad = firstDay.getDay();
    const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month padding
    const prevMonth = new Date(currentYear, currentMonth, 0);
    for (let i = startPad - 1; i >= 0; i--) {
      const d = prevMonth.getDate() - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({
        date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        day: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month
    const today = new Date().toISOString().split("T")[0];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: true,
        isToday: dateStr === today,
      });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth + 2 > 12 ? 1 : currentMonth + 2;
      const y = currentMonth + 2 > 12 ? currentYear + 1 : currentYear;
      days.push({
        date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        day: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  // Count orders per day
  const ordersPerDay = useMemo(() => {
    const map: Record<string, number> = {};
    if (!scheduledOrders) return map;
    for (const order of scheduledOrders) {
      if (order.scheduledAt) {
        const dateStr = new Date(order.scheduledAt).toISOString().split("T")[0];
        map[dateStr] = (map[dateStr] || 0) + 1;
      }
    }
    return map;
  }, [scheduledOrders]);

  // Filter orders for selected date
  const filteredOrders = useMemo(() => {
    if (!scheduledOrders) return [];
    return scheduledOrders
      .filter((order: any) => {
        if (!order.scheduledAt) return false;
        const orderDate = new Date(order.scheduledAt).toISOString().split("T")[0];
        return orderDate === selectedDate;
      })
      .sort((a: any, b: any) => {
        const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return aTime - bTime;
      });
  }, [scheduledOrders, selectedDate]);

  // Stats
  const stats = useMemo(() => {
    if (!scheduledOrders) return { total: 0, pending: 0, accepted: 0, moved: 0 };
    return {
      total: scheduledOrders.length,
      pending: scheduledOrders.filter((o: any) => o.status === "scheduled" && !o.movedToQueue).length,
      accepted: scheduledOrders.filter((o: any) => o.status === "scheduled" && o.movedToQueue).length,
      moved: scheduledOrders.filter((o: any) => o.status !== "scheduled" && o.status !== "cancelled").length,
    };
  }, [scheduledOrders]);

  const navigateMonth = (dir: number) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today.toISOString().split("T")[0]);
  };

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const selectedDateFormatted = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00");
    const dayName = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][d.getDay()];
    return `${dayName}, ${d.getDate()} de ${MONTHS_PT[d.getMonth()]}`;
  }, [selectedDate]);

  const deliveryTypeLabel = (type: string) => {
    switch (type) {
      case "delivery": return "Entrega";
      case "pickup": return "Retirada";
      case "dine_in": return "Local";
      default: return type;
    }
  };

  const deliveryTypeIcon = (type: string) => {
    switch (type) {
      case "delivery": return <Truck className="h-3.5 w-3.5" />;
      case "pickup": return <Store className="h-3.5 w-3.5" />;
      case "dine_in": return <UtensilsCrossed className="h-3.5 w-3.5" />;
      default: return <Package className="h-3.5 w-3.5" />;
    }
  };

  const getStatusBadge = (order: any) => {
    if (order.status === "scheduled" && !order.movedToQueue) {
      return <StatusBadge variant="default">Agendado</StatusBadge>;
    }
    if (order.status === "scheduled" && order.movedToQueue) {
      return <StatusBadge variant="success">Aceito</StatusBadge>;
    }
    if (order.status === "cancelled") {
      return <StatusBadge variant="error">Cancelado</StatusBadge>;
    }
    return <StatusBadge variant="info">Na fila</StatusBadge>;
  };

  return (
    <AdminLayout>
      {/* Header — same pattern as Dashboard */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Agendados"
          description="Gerencie os pedidos agendados pelos seus clientes"
          icon={<CalendarClock className="h-6 w-6 text-blue-600" />}
        />
        {/* Period filter — exact same component as Dashboard */}
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setFilterRange(opt.value);
                if (opt.value === "today") goToToday();
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                filterRange === opt.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards — using StatCard component from Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          title="Total Agendados"
          value={stats.total}
          icon={CalendarDays}
          loading={isLoading}
          variant="blue"
        />
        <StatCard
          title="Aguardando"
          value={stats.pending}
          icon={Clock}
          loading={isLoading}
          variant="amber"
        />
        <StatCard
          title="Aceitos"
          value={stats.accepted}
          icon={ListChecks}
          loading={isLoading}
          variant="emerald"
        />
        <StatCard
          title="Na Fila"
          value={stats.moved}
          icon={ArrowRightCircle}
          loading={isLoading}
          variant="primary"
        />
      </div>

      {/* Main Content: Calendar + Orders — using SectionCard */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Calendar — SectionCard wrapper */}
        <SectionCard
          title={`${MONTHS_PT[currentMonth]} ${currentYear}`}
          actions={
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                Hoje
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          }
        >
          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_PT.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const orderCount = ordersPerDay[day.date] || 0;
              const isSelected = day.date === selectedDate;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day.date)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-xl py-3 transition-all duration-200",
                    !day.isCurrentMonth && "text-muted-foreground/30",
                    day.isCurrentMonth && !isSelected && "hover:bg-muted text-foreground",
                    day.isToday && !isSelected && "bg-primary/5 font-bold text-primary",
                    isSelected && "bg-primary text-primary-foreground shadow-sm"
                  )}
                >
                  <span className="text-sm font-medium leading-none">
                    {day.day}
                  </span>
                  {orderCount > 0 && (
                    <div className="mt-1 flex items-center gap-0.5">
                      {orderCount <= 3 ? (
                        Array.from({ length: orderCount }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isSelected ? "bg-primary-foreground/70" : "bg-primary"
                            )}
                          />
                        ))
                      ) : (
                        <span
                          className={cn(
                            "text-[10px] font-bold leading-none",
                            isSelected ? "text-primary-foreground/80" : "text-primary"
                          )}
                        >
                          {orderCount}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Orders List for Selected Date — SectionCard wrapper */}
        <SectionCard
          title={selectedDateFormatted}
          actions={
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {filteredOrders.length} pedido{filteredOrders.length !== 1 ? "s" : ""}
            </span>
          }
        >
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Nenhum pedido agendado"
              description="Não há pedidos agendados para este dia"
              className="py-12"
            />
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
              {filteredOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="bg-card rounded-xl border border-border/50 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Order Header */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-sm font-bold">
                          {order.scheduledAt ? formatTime(order.scheduledAt) : "--:--"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {deliveryTypeIcon(order.deliveryType)}
                        <span className="text-xs font-medium">{deliveryTypeLabel(order.deliveryType)}</span>
                      </div>
                    </div>
                    {getStatusBadge(order)}
                  </div>

                  {/* Order Body */}
                  <div className="px-4 pb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{order.customerName || "Cliente"}</span>
                      <span className="text-sm font-bold">
                        R$ {(Number(order.total) / 100).toFixed(2).replace(".", ",")}
                      </span>
                    </div>

                    {order.customerPhone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {order.customerPhone}
                      </div>
                    )}

                    {/* Items preview */}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {order.items && order.items.length > 0
                        ? order.items.map((item: any) => `${item.quantity}x ${item.productName}`).join(", ")
                        : "Sem itens"}
                    </p>
                  </div>

                  {/* Actions */}
                  {order.status === "scheduled" && (
                    <div className="px-4 py-2.5 border-t border-border/50 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10 rounded-lg"
                        onClick={() => acceptOrder.mutate({ orderId: order.id })}
                        disabled={acceptOrder.isPending}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs flex-1 rounded-lg"
                        onClick={() => {
                          setRescheduleOrderId(order.id);
                          if (order.scheduledAt) {
                            const d = new Date(order.scheduledAt);
                            setRescheduleDate(d.toISOString().split("T")[0]);
                            setRescheduleTime(d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
                          }
                        }}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Reagendar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/10 rounded-lg"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja cancelar este pedido agendado?")) {
                            cancelOrder.mutate({ orderId: order.id, reason: "Cancelado pelo restaurante" });
                          }
                        }}
                        disabled={cancelOrder.isPending}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOrderId !== null} onOpenChange={(open) => !open && setRescheduleOrderId(null)}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Reagendar Pedido
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nova Data</Label>
              <Input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Novo Horário</Label>
              <Input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="rounded-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOrderId(null)} className="rounded-lg">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!rescheduleDate || !rescheduleTime || !rescheduleOrderId) return;
                const newScheduledAt = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
                rescheduleOrder.mutate({
                  orderId: rescheduleOrderId,
                  scheduledAt: newScheduledAt.toISOString(),
                });
              }}
              disabled={rescheduleOrder.isPending}
              className="rounded-lg"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
