import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { StatCard, PageHeader, SectionCard, EmptyState } from "@/components/shared";
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
  RefreshCw,
  CalendarDays,
  ListChecks,
  ArrowRightCircle,
  Pencil,
  Trash2,
  Calendar,
  LayoutDashboard,
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

const DAYS_HEADER = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAYS_FULL = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

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

  const { data: establishment } = trpc.establishment.get.useQuery();

  const startOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const endDate = new Date(currentYear, currentMonth + 1, 0);
  const endOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  const { data: scheduledOrders, isLoading, refetch } = trpc.scheduling.getByRange.useQuery(
    { startDate: startOfMonth, endDate: endOfMonth },
    { enabled: !!establishment?.id }
  );

  const acceptOrder = trpc.scheduling.accept.useMutation({
    onSuccess: () => { toast.success("Pedido aceito antecipadamente!"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const cancelOrder = trpc.scheduling.cancel.useMutation({
    onSuccess: () => { toast.success("Pedido agendado cancelado."); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const rescheduleOrder = trpc.scheduling.reschedule.useMutation({
    onSuccess: () => { toast.success("Pedido reagendado com sucesso!"); setRescheduleOrderId(null); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  // Calendar computation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startPad = firstDay.getDay();
    const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    const prevMonth = new Date(currentYear, currentMonth, 0);
    for (let i = startPad - 1; i >= 0; i--) {
      const d = prevMonth.getDate() - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({
        date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        day: d, isCurrentMonth: false, isToday: false,
      });
    }

    const today = new Date().toISOString().split("T")[0];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: dateStr === today });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth + 2 > 12 ? 1 : currentMonth + 2;
      const y = currentMonth + 2 > 12 ? currentYear + 1 : currentYear;
      days.push({
        date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        day: d, isCurrentMonth: false, isToday: false,
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  const numWeeks = useMemo(() => {
    // Only show 5 rows if the 6th row is entirely next month
    const totalDays = calendarDays.length;
    if (totalDays <= 35) return 5;
    const sixthRow = calendarDays.slice(35, 42);
    const allNextMonth = sixthRow.every(d => !d.isCurrentMonth);
    return allNextMonth ? 5 : 6;
  }, [calendarDays]);

  const visibleDays = calendarDays.slice(0, numWeeks * 7);

  // Orders grouped by day
  const ordersByDay = useMemo(() => {
    const map: Record<string, { customerName: string; time: string }[]> = {};
    if (!scheduledOrders) return map;
    for (const order of scheduledOrders) {
      if (order.scheduledAt) {
        const dateStr = new Date(order.scheduledAt).toISOString().split("T")[0];
        if (!map[dateStr]) map[dateStr] = [];
        const t = new Date(order.scheduledAt);
        map[dateStr].push({
          customerName: (order as any).customerName || "Pedido",
          time: t.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        });
      }
    }
    return map;
  }, [scheduledOrders]);

  const filteredOrders = useMemo(() => {
    if (!scheduledOrders) return [];
    return scheduledOrders
      .filter((order: any) => {
        if (!order.scheduledAt) return false;
        return new Date(order.scheduledAt).toISOString().split("T")[0] === selectedDate;
      })
      .sort((a: any, b: any) => {
        const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return aTime - bTime;
      });
  }, [scheduledOrders, selectedDate]);

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

  const selectedDateObj = useMemo(() => new Date(selectedDate + "T12:00:00"), [selectedDate]);

  const selectedDateFormatted = useMemo(() => {
    const d = selectedDateObj;
    const dayName = DAYS_FULL[d.getDay()];
    const month = MONTHS_PT[d.getMonth()];
    return `${month} ${String(d.getDate()).padStart(2, "0")} ${dayName}`;
  }, [selectedDateObj]);

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
    if (order.status === "cancelled") {
      return <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">Cancelado</span>;
    }
    if (order.status === "scheduled" && order.movedToQueue) {
      return <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">Aceito</span>;
    }
    if (order.status === "scheduled") {
      return <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">Agendado</span>;
    }
    return <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">Na fila</span>;
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

      {/* KPI Cards — same StatCard as Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard title="Total Agendados" value={stats.total} icon={CalendarDays} loading={isLoading} variant="blue" />
        <StatCard title="Aguardando" value={stats.pending} icon={Clock} loading={isLoading} variant="amber" />
        <StatCard title="Aceitos" value={stats.accepted} icon={ListChecks} loading={isLoading} variant="emerald" />
        <StatCard title="Na Fila" value={stats.moved} icon={ArrowRightCircle} loading={isLoading} variant="primary" />
      </div>

      {/* Main Content: Calendar + Orders — two SectionCards side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* LEFT: Calendar SectionCard */}
        <SectionCard noPadding className="overflow-hidden">
          {/* Month Navigation Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border/50">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-base font-semibold">
              {MONTHS_PT[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day of Week Header Row */}
          <div className="grid grid-cols-7 border-b border-border/40">
            {DAYS_HEADER.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "text-center text-[11px] font-medium text-muted-foreground/70 py-2.5 tracking-wider",
                  i < 6 && "border-r border-border/30"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid — clean table cells */}
          <div>
            {Array.from({ length: numWeeks }).map((_, weekIdx) => (
              <div
                key={weekIdx}
                className={cn(
                  "grid grid-cols-7",
                  weekIdx < numWeeks - 1 && "border-b border-border/30"
                )}
              >
                {visibleDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => {
                  const dayOrders = ordersByDay[day.date] || [];
                  const isSelected = day.date === selectedDate;

                  return (
                    <button
                      key={dayIdx}
                      onClick={() => setSelectedDate(day.date)}
                      className={cn(
                        "relative text-left p-2.5 min-h-[100px] transition-colors duration-150 group",
                        dayIdx < 6 && "border-r border-border/30",
                        !day.isCurrentMonth && "bg-muted/20",
                        day.isCurrentMonth && !isSelected && "hover:bg-muted/40",
                        isSelected && "bg-primary/[0.04]"
                      )}
                    >
                      {/* Day number — top left */}
                      <div className="mb-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-7 h-7 rounded-full text-[13px]",
                            !day.isCurrentMonth && "text-muted-foreground/30 font-normal",
                            day.isCurrentMonth && !day.isToday && !isSelected && "text-foreground/80 font-medium",
                            day.isToday && "bg-primary text-primary-foreground font-semibold",
                            isSelected && !day.isToday && "bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                          )}
                        >
                          {day.day}
                        </span>
                      </div>

                      {/* Order labels inside cell — green/primary text like reference */}
                      <div className="space-y-0.5">
                        {dayOrders.slice(0, 3).map((o, i) => (
                          <div
                            key={i}
                            className={cn(
                              "text-[10px] leading-tight font-medium truncate max-w-full",
                              isSelected ? "text-primary" : "text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            {o.customerName.length > 14 ? o.customerName.slice(0, 14) + "..." : o.customerName}
                          </div>
                        ))}
                        {dayOrders.length > 3 && (
                          <div className="text-[10px] text-muted-foreground/60 font-medium">
                            +{dayOrders.length - 3} mais
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* RIGHT: Orders Panel SectionCard */}
        <SectionCard
          title={selectedDateFormatted}
          noPadding
          className="h-fit lg:sticky lg:top-4"
        >
          {/* Orders List */}
          <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
            {isLoading ? (
              <div className="p-5 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-5 w-40 rounded" />
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <div className="p-4 bg-muted/50 rounded-2xl mb-5">
                  <Calendar className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground/70">Nenhum pedido agendado</p>
                <p className="text-xs text-muted-foreground/50 mt-1 text-center">
                  Selecione um dia com pedidos no calendário
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredOrders.map((order: any) => (
                  <div key={order.id} className="px-5 py-4 hover:bg-muted/30 transition-colors">
                    {/* Row 1: Status badge + action icons */}
                    <div className="flex items-center justify-between mb-2.5">
                      {getStatusBadge(order)}
                      {order.status === "scheduled" && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => {
                              setRescheduleOrderId(order.id);
                              if (order.scheduledAt) {
                                const d = new Date(order.scheduledAt);
                                setRescheduleDate(d.toISOString().split("T")[0]);
                                setRescheduleTime(d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
                              }
                            }}
                            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground/60 hover:text-foreground"
                            title="Reagendar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Tem certeza que deseja cancelar este pedido agendado?")) {
                                cancelOrder.mutate({ orderId: order.id, reason: "Cancelado pelo restaurante" });
                              }
                            }}
                            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-red-400/60 hover:text-red-600"
                            title="Cancelar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Row 2: Customer name (title) */}
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      {order.customerName || "Cliente"}
                    </h4>

                    {/* Row 3: Items description */}
                    <p className="text-xs text-muted-foreground/70 mb-2 line-clamp-2 leading-relaxed">
                      {order.items && order.items.length > 0
                        ? order.items.map((item: any) => `${item.quantity}x ${item.productName}`).join(", ")
                        : "Sem itens"}
                    </p>

                    {/* Row 4: Phone (WhatsApp style like reference) */}
                    {order.customerPhone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 mb-2">
                        <Phone className="h-3 w-3" />
                        <span>Whats App: {order.customerPhone}</span>
                      </div>
                    )}

                    {/* Row 5: Date + Time (like reference: calendar icon + date, clock icon + time) */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3" />
                        <span>
                          {order.scheduledAt
                            ? new Date(order.scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
                            : "--/--/----"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>{order.scheduledAt ? formatTime(order.scheduledAt) : "--:--"}</span>
                      </div>
                    </div>

                    {/* Accept button for scheduled orders */}
                    {order.status === "scheduled" && !order.movedToQueue && (
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">
                          R$ {(Number(order.total) / 100).toFixed(2).replace(".", ",")}
                        </span>
                        <Button
                          size="sm"
                          className="h-7 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => acceptOrder.mutate({ orderId: order.id })}
                          disabled={acceptOrder.isPending}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Aceitar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
