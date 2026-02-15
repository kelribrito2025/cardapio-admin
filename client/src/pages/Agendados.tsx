import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  Phone,
  Truck,
  Store,
  UtensilsCrossed,
  Check,
  X,
  RefreshCw,
  CalendarDays,
  AlertCircle,
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

type FilterRange = "today" | "7days" | "month" | "custom";

export default function Agendados() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [filterRange, setFilterRange] = useState<FilterRange>("month");
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
    const startPad = firstDay.getDay(); // 0=Sun
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

  const formatDateShort = (date: string) => {
    const parts = date.split("-");
    return `${parts[2]}/${parts[1]}`;
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

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Pedidos Agendados
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie os pedidos agendados pelos seus clientes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFilterRange("7days")}>
              7 dias
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFilterRange("month")}>
              Este mês
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="border-t-2 border-t-blue-400">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-t-2 border-t-amber-400">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground font-medium">Aguardando</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="border-t-2 border-t-green-400">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground font-medium">Aceitos</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.accepted}</p>
            </CardContent>
          </Card>
          <Card className="border-t-2 border-t-purple-400">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground font-medium">Na fila</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.moved}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Calendar + Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          {/* Calendar */}
          <Card>
            <CardContent className="p-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-base font-semibold">
                    {MONTHS_PT[currentMonth]} {currentYear}
                  </h2>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS_PT.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  const orderCount = ordersPerDay[day.date] || 0;
                  const isSelected = day.date === selectedDate;

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(day.date)}
                      className={cn(
                        "relative h-16 p-1 border border-border/30 text-sm transition-all hover:bg-accent/50",
                        !day.isCurrentMonth && "text-muted-foreground/40",
                        day.isToday && "bg-primary/5 font-bold",
                        isSelected && "ring-2 ring-primary bg-primary/10"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs",
                          day.isToday && "bg-primary text-primary-foreground"
                        )}
                      >
                        {day.day}
                      </span>
                      {orderCount > 0 && (
                        <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5 justify-center">
                          {orderCount <= 3 ? (
                            Array.from({ length: orderCount }).map((_, i) => (
                              <span key={i} className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            ))
                          ) : (
                            <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-1.5 rounded-full">
                              {orderCount}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Orders List for Selected Date */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{selectedDateFormatted}</h3>
              <Badge variant="outline" className="text-xs">
                {filteredOrders.length} pedido{filteredOrders.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <CalendarClock className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum pedido agendado para este dia
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                {filteredOrders.map((order: any) => (
                  <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 px-3 py-2 flex items-center justify-between border-b">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-sm font-bold text-red-600">
                            {order.scheduledAt ? formatTime(order.scheduledAt) : "--:--"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {deliveryTypeIcon(order.deliveryType)}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              order.deliveryType === "delivery"
                                ? "border-orange-300 text-orange-700 bg-orange-50"
                                : order.deliveryType === "pickup"
                                ? "border-blue-300 text-blue-700 bg-blue-50"
                                : "border-green-300 text-green-700 bg-green-50"
                            )}
                          >
                            {deliveryTypeLabel(order.deliveryType)}
                          </Badge>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="px-3 py-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{order.customerName || "Cliente"}</span>
                          <span className="text-sm font-bold text-red-600">
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
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {order.items && order.items.length > 0
                            ? order.items.map((item: any) => `${item.quantity}x ${item.productName}`).join(", ")
                            : "Sem itens"}
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={cn(
                              "text-[10px]",
                              order.status === "scheduled" && !order.movedToQueue
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                : order.status === "scheduled" && order.movedToQueue
                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                : order.status === "cancelled"
                                ? "bg-red-100 text-red-700 hover:bg-red-100"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-100"
                            )}
                          >
                            {order.status === "scheduled" && !order.movedToQueue
                              ? "Agendado"
                              : order.status === "scheduled" && order.movedToQueue
                              ? "Aceito"
                              : order.status === "cancelled"
                              ? "Cancelado"
                              : "Na fila"}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      {order.status === "scheduled" && (
                        <div className="px-3 py-2 border-t bg-muted/30 flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs flex-1 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => acceptOrder.mutate({ orderId: order.id })}
                            disabled={acceptOrder.isPending}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs flex-1"
                            onClick={() => {
                              setRescheduleOrderId(order.id);
                              if (order.scheduledAt) {
                                const d = new Date(order.scheduledAt);
                                setRescheduleDate(d.toISOString().split("T")[0]);
                                setRescheduleTime(d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
                              }
                            }}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reagendar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs flex-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja cancelar este pedido agendado?")) {
                                cancelOrder.mutate({ orderId: order.id, reason: "Cancelado pelo restaurante" });
                              }
                            }}
                            disabled={cancelOrder.isPending}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOrderId !== null} onOpenChange={(open) => !open && setRescheduleOrderId(null)}>
        <DialogContent className="sm:max-w-md">
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
              />
            </div>
            <div className="space-y-2">
              <Label>Novo Horário</Label>
              <Input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOrderId(null)}>
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
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
