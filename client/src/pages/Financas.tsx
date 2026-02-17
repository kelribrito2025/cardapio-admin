import { AdminLayout } from "@/components/AdminLayout";
import { StatCard, PageHeader, SectionCard, EmptyState } from "@/components/shared";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
  Plus,
  Search,
  Edit2,
  Trash2,
  Receipt,
  Target,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Tag,
  Calendar,
  Filter,
  Repeat,
  Pause,
  Play,
  Clock,
  Activity,
  BarChart3,
  CreditCard,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const periodOptions = [
  { value: "today" as const, label: "Hoje" },
  { value: "week" as const, label: "7 dias" },
  { value: "month" as const, label: "Este mês" },
];

const paymentMethodLabels: Record<string, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  card: "Cartão",
  card_online: "Cartão Online",
  transfer: "Transferência",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// ============ EXPENSE MODAL ============
const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTH_LABELS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function ExpenseModal({
  open,
  onOpenChange,
  establishmentId,
  editingExpense,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  editingExpense?: any;
  onSuccess: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Recurring fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<string>("monthly");
  const [executionDay, setExecutionDay] = useState<string>("1");
  const [executionMonth, setExecutionMonth] = useState<string>("1");
  const [generateAsPending, setGenerateAsPending] = useState(false);
  const [endDate, setEndDate] = useState("");
  const recurringRef = useRef<HTMLDivElement>(null);

  const { data: categories } = trpc.finance.listCategories.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  const createMutation = trpc.finance.createExpense.useMutation({
    onSuccess: () => {
      toast.success("Despesa registrada com sucesso!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.finance.updateExpense.useMutation({
    onSuccess: () => {
      toast.success("Despesa atualizada com sucesso!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const createRecurringMutation = trpc.finance.createRecurring.useMutation({
    onSuccess: () => {
      toast.success("Despesa recorrente criada com sucesso!");
      onSuccess();
      onOpenChange(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (editingExpense) {
      setCategoryId(String(editingExpense.categoryId));
      setDescription(editingExpense.description);
      setAmount(String(Number(editingExpense.amount)));
      setPaymentMethod(editingExpense.paymentMethod);
      setDate(
        new Date(editingExpense.date).toISOString().split("T")[0]
      );
      setNotes(editingExpense.notes || "");
      setIsRecurring(false); // Can't convert existing to recurring
    } else {
      resetForm();
    }
  }, [editingExpense, open]);

  function resetForm() {
    setCategoryId("");
    setDescription("");
    setAmount("");
    setPaymentMethod("cash");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setIsRecurring(false);
    setFrequency("monthly");
    setExecutionDay("1");
    setExecutionMonth("1");
    setGenerateAsPending(false);
    setEndDate("");
  }

  function handleSubmit() {
    if (!categoryId || !description || !amount || !date) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (isRecurring && !editingExpense) {
      // Create the current expense + recurring rule
      createMutation.mutate(
        {
          establishmentId,
          categoryId: Number(categoryId),
          description,
          amount: String(parseFloat(amount)),
          paymentMethod: paymentMethod as "cash" | "pix" | "card" | "transfer",
          date: new Date(date + "T12:00:00").toISOString(),
          notes: notes || undefined,
        },
        {
          onSuccess: () => {
            // Also create the recurring rule
            createRecurringMutation.mutate({
              establishmentId,
              type: "expense",
              description,
              categoryId: Number(categoryId),
              amount: String(parseFloat(amount)),
              paymentMethod: paymentMethod as "cash" | "pix" | "card" | "transfer",
              frequency: frequency as "weekly" | "monthly" | "yearly",
              executionDay: Number(executionDay),
              executionMonth: frequency === "yearly" ? Number(executionMonth) : undefined,
              generateAsPending,
              startDate: new Date(date + "T12:00:00").toISOString(),
              endDate: endDate ? new Date(endDate + "T23:59:59").toISOString() : undefined,
              notes: notes || undefined,
            });
          },
        }
      );
      return;
    }

    const data = {
      categoryId: Number(categoryId),
      description,
      amount: String(parseFloat(amount)),
      paymentMethod: paymentMethod as "cash" | "pix" | "card" | "transfer",
      date: new Date(date + "T12:00:00").toISOString(),
      notes: notes || undefined,
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, ...data });
    } else {
      createMutation.mutate({ establishmentId, ...data });
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending || createRecurringMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingExpense ? "Editar despesa" : "Registrar despesa"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Data *
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Categoria *
            </label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || "#6b7280" }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Descrição *
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Compra de ingredientes"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Valor (R$) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Forma de pagamento
            </label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Observação
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          {/* Recurring Toggle */}
          {!editingExpense && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="recurring-toggle" className="text-sm font-medium cursor-pointer">
                    Tornar lançamento recorrente
                  </Label>
                </div>
                <Switch
                  id="recurring-toggle"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>

              {/* Recurring Fields - Animated Accordion */}
              <div
                ref={recurringRef}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: isRecurring ? "400px" : "0px",
                  opacity: isRecurring ? 1 : 0,
                  marginTop: isRecurring ? "16px" : "0px",
                }}
              >
                <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/30">
                  {/* Frequency */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                      Frequência
                    </label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conditional: Day of Month */}
                  {frequency === "monthly" && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        Dia do mês
                      </label>
                      <Select value={executionDay} onValueChange={setExecutionDay}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>
                              Dia {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Conditional: Day of Week */}
                  {frequency === "weekly" && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        Dia da semana
                      </label>
                      <Select value={executionDay} onValueChange={setExecutionDay}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WEEKDAY_LABELS.map((label, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Conditional: Day + Month for Yearly */}
                  {frequency === "yearly" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                          Dia
                        </label>
                        <Select value={executionDay} onValueChange={setExecutionDay}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>
                                Dia {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                          Mês
                        </label>
                        <Select value={executionMonth} onValueChange={setExecutionMonth}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTH_LABELS.map((label, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Generate as pending */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pending-toggle" className="text-sm cursor-pointer">
                      Gerar como pendente
                    </Label>
                    <Switch
                      id="pending-toggle"
                      checked={generateAsPending}
                      onCheckedChange={setGenerateAsPending}
                    />
                  </div>

                  {/* End date (optional) */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                      Data final (opcional)
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="Sem data final"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Deixe vazio para recorrência sem fim
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading
              ? "Salvando..."
              : editingExpense
              ? "Atualizar"
              : isRecurring
              ? "Salvar recorrente"
              : "Salvar despesa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ CATEGORY MANAGER MODAL ============
function CategoryManagerModal({
  open,
  onOpenChange,
  establishmentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
}) {
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#6b7280");

  const utils = trpc.useUtils();
  const { data: categories } = trpc.finance.listCategories.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  const createMutation = trpc.finance.createCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoria criada!");
      utils.finance.listCategories.invalidate();
      setNewCatName("");
      setNewCatColor("#6b7280");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.finance.deleteCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoria excluída!");
      utils.finance.listCategories.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Gerenciar categorias</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nova categoria..."
              className="flex-1"
            />
            <input
              type="color"
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer"
            />
            <Button
              size="icon"
              onClick={() => {
                if (!newCatName.trim()) return;
                createMutation.mutate({
                  establishmentId,
                  name: newCatName.trim(),
                  color: newCatColor,
                });
              }}
              disabled={createMutation.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {categories?.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || "#6b7280" }}
                  />
                  <span className="text-sm font-medium">{cat.name}</span>
                  {cat.isDefault && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      padrão
                    </span>
                  )}
                </div>
                {!cat.isDefault && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate({ id: cat.id })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ GOAL MODAL ============
function GoalModal({
  open,
  onOpenChange,
  establishmentId,
  currentGoal,
  month,
  year,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  currentGoal: number | null;
  month: number;
  year: number;
}) {
  const [targetProfit, setTargetProfit] = useState(
    currentGoal ? String(currentGoal) : ""
  );

  useEffect(() => {
    setTargetProfit(currentGoal ? String(currentGoal) : "");
  }, [currentGoal, open]);

  const utils = trpc.useUtils();
  const mutation = trpc.finance.setGoal.useMutation({
    onSuccess: () => {
      toast.success("Meta atualizada!");
      utils.finance.getGoal.invalidate();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Meta mensal de lucro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Defina sua meta de lucro líquido para{" "}
            {new Date(year, month - 1).toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
            .
          </p>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Meta de lucro (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={targetProfit}
              onChange={(e) => setTargetProfit(e.target.value)}
              placeholder="Ex: 10000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!targetProfit) return;
              mutation.mutate({
                establishmentId,
                month,
                year,
                targetProfit,
              });
            }}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Salvando..." : "Salvar meta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ FINANCIAL HEALTH INDICATOR ============
function FinancialHealthIndicator({
  profit,
  revenue,
  expensesTotal,
  goalTarget,
  goalProgress,
}: {
  profit: number;
  revenue: number;
  expensesTotal: number;
  goalTarget: number | null;
  goalProgress: number | null;
}) {
  const isNegative = profit < 0;
  const isWarning = expensesTotal > revenue && revenue > 0;
  const healthPercent = revenue > 0 ? Math.min(100, Math.max(0, ((revenue - expensesTotal) / revenue) * 100)) : 0;

  let healthColor = "bg-emerald-500";
  let healthLabel = "Saudável";
  let healthTextColor = "text-emerald-600";

  if (isNegative) {
    healthColor = "bg-red-500";
    healthLabel = "Prejuízo";
    healthTextColor = "text-red-600";
  } else if (healthPercent < 20) {
    healthColor = "bg-amber-500";
    healthLabel = "Atenção";
    healthTextColor = "text-amber-600";
  } else if (healthPercent < 40) {
    healthColor = "bg-yellow-500";
    healthLabel = "Regular";
    healthTextColor = "text-yellow-600";
  }

  return (
    <div className="space-y-4">
      {/* Health Thermometer */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Saúde financeira
          </span>
          <span className={`text-sm font-semibold ${healthTextColor}`}>
            {healthLabel}
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${healthColor}`}
            style={{ width: `${Math.max(3, healthPercent)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[11px] text-muted-foreground">Prejuízo</span>
          <span className="text-[11px] text-muted-foreground">Lucro máximo</span>
        </div>
      </div>

      {/* Warning Alert */}
      {isWarning && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <span className="text-xs text-red-700 dark:text-red-400 font-medium">
            Despesas excedem a receita neste período
          </span>
        </div>
      )}


    </div>
  );
}

// ============ CUSTOM CHART TOOLTIP ============
function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/50 rounded-xl shadow-lg p-3 min-w-[160px]">
      <p className="text-xs text-muted-foreground font-medium mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ============ EVOLUTION BAR CHART (estilo WeeklyRevenueCard) ============
function EvolutionBarChart({ data }: { data: { label: string; revenue: number; expenses: number; profit: number }[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const maxValue = useMemo(() => {
    const allValues = data.flatMap(d => [d.revenue, d.expenses, Math.abs(d.profit)]);
    return Math.max(...allValues, 1);
  }, [data]);

  return (
    <div className="flex-1 flex flex-col justify-end">
      <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-40">
        {data.map((item, index) => {
          const revenueH = (item.revenue / maxValue) * 100;
          const expenseH = (item.expenses / maxValue) * 100;
          const profitH = (Math.abs(item.profit) / maxValue) * 100;

          return (
            <div
              key={item.label}
              className="flex-1 flex flex-col items-center gap-1.5 relative group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Bars container */}
              <div className="relative w-full h-32 flex items-end justify-center gap-[2px]">
                {/* Revenue bar */}
                <div
                  className="flex-1 rounded-t-md bg-emerald-500 transition-all duration-300"
                  style={{ height: `${Math.max(revenueH, 3)}%` }}
                />
                {/* Expenses bar */}
                <div
                  className="flex-1 rounded-t-md bg-red-400 transition-all duration-300"
                  style={{ height: `${Math.max(expenseH, 3)}%` }}
                />
                {/* Profit bar */}
                <div
                  className={cn(
                    "flex-1 rounded-t-md transition-all duration-300",
                    item.profit >= 0 ? "bg-blue-500" : "bg-blue-300"
                  )}
                  style={{ height: `${Math.max(profitH, 3)}%` }}
                />
              </div>

              {/* Label */}
              <span className="text-[10px] font-medium text-muted-foreground truncate w-full text-center">
                {item.label}
              </span>

              {/* Tooltip */}
              {hoveredIndex === index && (
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-10 bg-gray-900 dark:bg-gray-800 text-white px-2.5 py-2 rounded-md shadow-lg text-xs whitespace-nowrap">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Receita:</span>
                    <span className="font-semibold">{formatCurrency(item.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span>Despesas:</span>
                    <span className="font-semibold">{formatCurrency(item.expenses)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Lucro:</span>
                    <span className={cn("font-semibold", item.profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {formatCurrency(item.profit)}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-900 dark:bg-gray-800 rotate-45" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function Financas() {
  const { data: establishment } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 15;
  const [listTab, setListTab] = useState<"gastos" | "receitas" | "recorrentes">("gastos");
  const [revenueSearchTerm, setRevenueSearchTerm] = useState("");
  const [revenuePage, setRevenuePage] = useState(0);

  useEffect(() => {
    if (establishment) setEstablishmentId(establishment.id);
  }, [establishment]);

  const utils = trpc.useUtils();

  // Current month/year for goal
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Memoize inputs
  const summaryInput = useMemo(
    () => ({ establishmentId: establishmentId!, period }),
    [establishmentId, period]
  );

  const chartPeriod = period === "today" ? "week" : period;
  const chartInput = useMemo(
    () => ({ establishmentId: establishmentId!, period: chartPeriod as "week" | "month" }),
    [establishmentId, chartPeriod]
  );

  const expensesInput = useMemo(
    () => ({
      establishmentId: establishmentId!,
      search: searchTerm || undefined,
      categoryId: filterCategory !== "all" ? Number(filterCategory) : undefined,
      limit: ITEMS_PER_PAGE,
      offset: page * ITEMS_PER_PAGE,
    }),
    [establishmentId, searchTerm, filterCategory, page]
  );

  const goalInput = useMemo(
    () => ({
      establishmentId: establishmentId!,
      month: currentMonth,
      year: currentYear,
    }),
    [establishmentId, currentMonth, currentYear]
  );

  const expensesByCatInput = useMemo(
    () => ({ establishmentId: establishmentId!, period }),
    [establishmentId, period]
  );

  // Queries
  const { data: summary, isLoading: summaryLoading } =
    trpc.finance.summary.useQuery(summaryInput, {
      enabled: !!establishmentId,
    });

  const { data: chartData, isLoading: chartLoading } =
    trpc.finance.chart.useQuery(chartInput, {
      enabled: !!establishmentId,
    });

  const { data: expensesData, isLoading: expensesLoading } =
    trpc.finance.listExpenses.useQuery(expensesInput, {
      enabled: !!establishmentId,
    });

  const { data: categories } = trpc.finance.listCategories.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  const { data: goal } = trpc.finance.getGoal.useQuery(goalInput, {
    enabled: !!establishmentId,
  });

  const { data: expensesByCategory } = trpc.finance.expensesByCategory.useQuery(
    expensesByCatInput,
    { enabled: !!establishmentId }
  );

  // Revenue by channel
  const channelInput = useMemo(
    () => ({ establishmentId: establishmentId!, period }),
    [establishmentId, period]
  );
  const { data: channelData, isLoading: channelLoading } =
    trpc.finance.revenueByChannel.useQuery(channelInput, {
      enabled: !!establishmentId,
    });

  // Revenue by payment method
  const paymentMethodInput = useMemo(
    () => ({ establishmentId: establishmentId!, period }),
    [establishmentId, period]
  );
  const { data: paymentMethodData, isLoading: paymentMethodLoading } =
    trpc.finance.revenueByPaymentMethod.useQuery(paymentMethodInput, {
      enabled: !!establishmentId,
    });

  // Payment method daily breakdown for sparklines
  const paymentDailyInput = useMemo(
    () => ({ establishmentId: establishmentId!, period }),
    [establishmentId, period]
  );
  const { data: paymentDailyData } =
    trpc.finance.paymentMethodDaily.useQuery(paymentDailyInput, {
      enabled: !!establishmentId,
    });

  // Monthly comparison
  const comparisonInput = useMemo(
    () => ({ establishmentId: establishmentId! }),
    [establishmentId]
  );
  const { data: comparison, isLoading: comparisonLoading } =
    trpc.finance.getMonthlyComparison.useQuery(comparisonInput, {
      enabled: !!establishmentId,
    });

  // Recurring expenses
  const recurringInput = useMemo(
    () => ({ establishmentId: establishmentId! }),
    [establishmentId]
  );
  const { data: recurringExpenses } = trpc.finance.listRecurring.useQuery(
    recurringInput,
    { enabled: !!establishmentId }
  );

  // Upcoming recurring expenses query
  const { data: upcomingRecurring } = trpc.finance.upcomingRecurring.useQuery(
    recurringInput,
    { enabled: !!establishmentId }
  );

  // Daily revenue query
  const dailyRevenueInput = useMemo(
    () => ({
      establishmentId: establishmentId!,
      limit: ITEMS_PER_PAGE,
      offset: revenuePage * ITEMS_PER_PAGE,
    }),
    [establishmentId, revenuePage]
  );
  const { data: dailyRevenueData, isLoading: dailyRevenueLoading } =
    trpc.finance.listDailyRevenue.useQuery(dailyRevenueInput, {
      enabled: !!establishmentId && listTab === "receitas",
    });

  // Delete mutation
  const deleteMutation = trpc.finance.deleteExpense.useMutation({
    onSuccess: () => {
      toast.success("Despesa excluída!");
      invalidateAll();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteRecurringMutation = trpc.finance.deleteRecurring.useMutation({
    onSuccess: () => {
      toast.success("Recorrência removida!");
      utils.finance.listRecurring.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleRecurringMutation = trpc.finance.updateRecurring.useMutation({
    onSuccess: () => {
      toast.success("Recorrência atualizada!");
      utils.finance.listRecurring.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function invalidateAll() {
    utils.finance.summary.invalidate();
    utils.finance.chart.invalidate();
    utils.finance.listExpenses.invalidate();
    utils.finance.expensesByCategory.invalidate();
    utils.finance.listRecurring.invalidate();
    utils.finance.getMonthlyComparison.invalidate();
  }

  const goalTarget = goal ? Number(goal.targetProfit) : null;
  const goalProgress =
    goalTarget && summary ? (summary.profit / goalTarget) * 100 : null;

  const totalPages = expensesData
    ? Math.ceil(expensesData.total / ITEMS_PER_PAGE)
    : 0;

  const revenueTotalPages = dailyRevenueData
    ? Math.ceil(dailyRevenueData.total / ITEMS_PER_PAGE)
    : 0;

  const sourceLabels: Record<string, string> = {
    internal: "Menu público",
    pdv: "PDV",
    ifood: "iFood",
    rappi: "Rappi",
    ubereats: "Uber Eats",
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Finanças"
          description="Controle completo das receitas e despesas do restaurante."
          icon={<Wallet className="h-6 w-6 text-emerald-600" />}
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  period === opt.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button
            onClick={() => {
              setEditingExpense(null);
              setExpenseModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo lançamento</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          title={
            period === "today"
              ? "Receita Hoje"
              : period === "week"
              ? "Receita 7 dias"
              : "Receita do Mês"
          }
          value={formatCurrency(summary?.revenue ?? 0)}
          icon={DollarSign}
          loading={summaryLoading}
          variant="emerald"
          trend={
            summary && summary.revenueChange !== undefined
              ? {
                  value: summary.revenueChange,
                  isPositive: summary.revenueChange >= 0,
                  label:
                    period === "today"
                      ? "vs ontem"
                      : period === "week"
                      ? "vs semana anterior"
                      : "vs mês anterior",
                }
              : undefined
          }
        />
        <StatCard
          title={
            period === "today"
              ? "Despesas Hoje"
              : period === "week"
              ? "Despesas 7 dias"
              : "Despesas do Mês"
          }
          value={formatCurrency(summary?.expensesTotal ?? 0)}
          icon={TrendingDown}
          loading={summaryLoading}
          variant="red"
          trend={
            summary && summary.expensesChange !== undefined
              ? {
                  value: summary.expensesChange,
                  isPositive: summary.expensesChange <= 0,
                  label:
                    period === "today"
                      ? "vs ontem"
                      : period === "week"
                      ? "vs semana anterior"
                      : "vs mês anterior",
                }
              : undefined
          }
        />
        <StatCard
          title="L. Líquido"
          value={formatCurrency(summary?.profit ?? 0)}
          icon={TrendingUp}
          loading={summaryLoading}
          variant="blue"
          trend={
            summary && summary.profitChange !== undefined
              ? {
                  value: summary.profitChange,
                  isPositive: summary.profitChange >= 0,
                  label:
                    period === "today"
                      ? "vs ontem"
                      : period === "week"
                      ? "vs semana anterior"
                      : "vs mês anterior",
                }
              : undefined
          }
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(summary?.avgTicket ?? 0)}
          icon={Receipt}
          loading={summaryLoading}
          variant="amber"
          trend={
            summary && summary.avgTicketChange !== undefined
              ? {
                  value: summary.avgTicketChange,
                  isPositive: summary.avgTicketChange >= 0,
                  label:
                    period === "today"
                      ? "vs ontem"
                      : period === "week"
                      ? "vs semana anterior"
                      : "vs mês anterior",
                }
              : undefined
          }
        />
      </div>

      {/* Chart + Health Indicator */}
      <div key={period} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Coluna esquerda */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '24px' }}>
        <div className="bg-card rounded-xl border border-border/50 p-5" style={{ flex: 1, display: 'flex', flexDirection: 'column' as const }}>
          {/* Header com ícone + tags de legenda */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Evolução financeira</h3>
                <p className="text-xs text-muted-foreground">
                  {chartPeriod === 'week' ? 'Últimos 7 dias' : 'Este mês'}
                </p>
              </div>
            </div>
            {/* Legend tags */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Receita</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Despesas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Lucro</span>
              </div>
            </div>
          </div>

          {/* Gráfico recharts */}
          <div style={{ flex: 1, minHeight: 250 }}>
          {chartLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="skeleton h-full w-full rounded-lg" />
            </div>
          ) : chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`
                  }
                />
                <RechartsTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="expenses"
                  name="Despesas"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                  opacity={0.85}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Receita"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#10b981" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Lucro"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: "#3b82f6" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Sem dados para o período selecionado
            </div>
          )}
          </div>
        </div>

        {/* Comparação Mensal */}
        <div className="bg-card rounded-xl border border-border/50 p-5" style={{ flex: 1, display: 'flex', flexDirection: 'column' as const }}>
          {/* Header com ícone */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Comparação Mensal</h3>
                <p className="text-xs text-muted-foreground">Últimos 4 meses</p>
              </div>
            </div>
            {/* Legend tags */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-muted-foreground">Receitas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-muted-foreground">Despesas</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 250 }}>
          {comparisonLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="skeleton h-full w-full rounded-lg" />
            </div>
          ) : comparison && comparison.months?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparison.months}
                barGap={4}
                barCategoryGap="25%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => {
                    if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(0)}.000`;
                    return `R$ ${v}`;
                  }}
                />
                <RechartsTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="receitas"
                  name="Receitas"
                  fill="#86efac"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
                <Bar
                  dataKey="despesas"
                  name="Despesas"
                  fill="#fca5a5"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Sem dados para comparação
            </div>
          )}
          </div>
        </div>
        </div>{/* end coluna esquerda */}

        {/* Coluna direita */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '24px' }}>
        {/* Indicadores */}
        <div className="bg-card rounded-xl border border-border/50 p-5">
          {/* Header com ícone - mesmo estilo do Evolução Financeira */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Indicadores</h3>
                <p className="text-xs text-muted-foreground">Saúde e metas do período</p>
              </div>
            </div>
          </div>

          <FinancialHealthIndicator
            profit={summary?.profit ?? 0}
            revenue={summary?.revenue ?? 0}
            expensesTotal={summary?.expensesTotal ?? 0}
            goalTarget={goalTarget}
            goalProgress={goalProgress}
          />

          {/* Expenses by category mini-list */}
          {expensesByCategory && expensesByCategory.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Despesas por categoria
              </h4>
              <div className="space-y-2">
                {expensesByCategory.map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: cat.categoryColor || "#6b7280",
                        }}
                      />
                      <span className="text-sm">{cat.categoryName}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 space-y-2">
            {/* Meta button with integrated progress fill */}
            <div
              className="relative w-full h-10 rounded-md border border-border overflow-hidden cursor-pointer transition-all hover:border-foreground/30"
              onClick={() => setGoalModalOpen(true)}
            >
              {/* Progress fill background */}
              {goalTarget && goalProgress !== null && (
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(0, goalProgress))}%`,
                    background: goalProgress >= 70
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                      : goalProgress >= 30
                      ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                      : goalProgress >= 10
                      ? 'linear-gradient(90deg, #f97316, #f59e0b)'
                      : 'linear-gradient(90deg, #ef4444, #f97316)',
                    opacity: 0.2,
                  }}
                />
              )}
              {/* Button content */}
              <div className="relative flex items-center gap-2 h-full px-3 z-10">
                <Target className={`h-4 w-4 shrink-0 ${
                  goalTarget && goalProgress !== null
                    ? goalProgress >= 70 ? 'text-emerald-600' : goalProgress >= 30 ? 'text-amber-600' : goalProgress >= 10 ? 'text-orange-600' : 'text-red-600'
                    : 'text-muted-foreground'
                }`} />
                <span className="text-sm font-medium">
                  {goalTarget
                    ? `Meta: ${formatCurrency(goalTarget)}`
                    : "Definir meta mensal"}
                </span>
                {goalTarget && goalProgress !== null && (
                  <span className={`ml-auto text-xs font-bold ${
                    goalProgress >= 70 ? 'text-emerald-600' : goalProgress >= 30 ? 'text-amber-600' : goalProgress >= 10 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {goalProgress >= 100 ? '✓ Atingida!' : `${Math.round(Math.max(0, goalProgress))}%`}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setCategoryModalOpen(true)}
            >
              <Tag className="h-4 w-4" />
              Gerenciar categorias
            </Button>
          </div>
        </div>

        {/* Faturamento por canal - mesma coluna do Indicadores */}
        <div className="bg-card rounded-xl border border-border/50 p-5">
          {/* Header com ícone */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
              <DollarSign className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">Faturamento por canal</h3>
              <p className="text-xs text-muted-foreground">Origem das receitas no período</p>
            </div>
          </div>

          {channelLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="skeleton h-full w-full rounded-lg" />
            </div>
          ) : channelData && channelData.total > 0 ? (
            <div className="space-y-4">
              {/* Horizontal bars - one per channel */}
              {channelData.channels.map((ch) => {
                const channelColors: Record<string, string> = {
                  pdv: 'bg-blue-500',
                  menu: 'bg-emerald-500',
                  mesas: 'bg-amber-500',
                };
                const barColor = channelColors[ch.id] || 'bg-gray-500';
                const variation = (ch as any).variation as number | null;
                const prevTotal = (ch as any).prevTotal as number | undefined;

                return (
                  <div key={ch.id} className="group relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{ch.name}</span>
                        <span className="text-xs text-muted-foreground">({ch.count} pedidos)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(ch.total)}</span>
                        <span className="text-xs font-semibold" style={{ color: ch.color }}>{ch.percent}%</span>
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden cursor-pointer">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.max(3, ch.percent)}%` }}
                      />
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                      <div className="bg-foreground text-background rounded-lg px-3 py-2 shadow-lg text-xs whitespace-nowrap">
                        <div className="font-semibold mb-1">{ch.name}</div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span>Valor:</span>
                          <span className="font-semibold">{formatCurrency(ch.total)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span>Pedidos:</span>
                          <span className="font-semibold">{ch.count}</span>
                        </div>
                        {variation !== null && variation !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <span>vs anterior:</span>
                            <span className={`font-semibold ${variation > 0 ? 'text-emerald-400' : variation < 0 ? 'text-red-400' : ''}`}>
                              {variation > 0 ? '↑' : variation < 0 ? '↓' : '↔'} {Math.abs(variation)}%
                            </span>
                          </div>
                        )}
                        {prevTotal !== undefined && (
                          <div className="flex items-center gap-1.5 text-[10px] opacity-70 mt-0.5">
                            <span>Período anterior:</span>
                            <span>{formatCurrency(prevTotal)}</span>
                          </div>
                        )}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-foreground" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">
              Sem faturamento registrado neste período
            </div>
          )}
        </div>
        {/* Formas de Pagamento */}
        <div className="bg-card rounded-xl border border-border/50 p-5">
          {/* Header com ícone */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0" style={{borderRadius: '12px'}}>
              <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">Formas de Pagamento</h3>
              <p className="text-xs text-muted-foreground">Distribuição por método de pagamento</p>
            </div>
          </div>

          {paymentMethodLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="skeleton h-full w-full rounded-lg" />
            </div>
          ) : paymentMethodData && paymentMethodData.total > 0 ? (
            <div className="space-y-4">
              {/* Horizontal bars - one per payment method */}
              {paymentMethodData.methods.map((m) => {
                const paymentColors: Record<string, string> = {
                  pix: 'bg-violet-500',
                  card: 'bg-blue-500',
                  cash: 'bg-emerald-500',
                };
                const barColor = paymentColors[m.id] || 'bg-gray-500';

                return (
                  <div key={m.id} className="group relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{m.name}</span>
                        <span className="text-xs text-muted-foreground">({m.count} pedidos)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(m.total)}</span>
                        <span className="text-xs font-semibold" style={{ color: m.color }}>{m.percent}%</span>
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden cursor-pointer">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.max(3, m.percent)}%` }}
                      />
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                      <div className="bg-foreground text-background rounded-lg px-3 py-2 shadow-lg text-xs whitespace-nowrap">
                        <div className="font-semibold mb-1">{m.name}</div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span>Valor:</span>
                          <span className="font-semibold">{formatCurrency(m.total)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span>Pedidos:</span>
                          <span className="font-semibold">{m.count}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>Percentual:</span>
                          <span className="font-semibold">{m.percent}%</span>
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-foreground" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">
              Nenhuma venda registrada neste período
            </div>
          )}
        </div>
        </div>{/* end coluna direita */}

      </div>

      {/* Lançamentos futuros - Timeline horizontal */}
      {(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const currentMonthName = MONTH_LABELS[currentMonth];
        
        // Filter occurrences for current month to calculate committed amount
        const monthOccurrences = (upcomingRecurring ?? []).filter(item => {
          const d = new Date(item.dueDate + 'T12:00:00');
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const committedTotal = monthOccurrences.reduce((sum, item) => sum + item.amount, 0);
        
        // Get badge for each item
        const getBadge = (dueDate: string) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const due = new Date(dueDate + 'T12:00:00');
          due.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays < 0) return { text: "Atrasado", color: "bg-red-500 text-white" };
          if (diffDays === 0) return { text: "Hoje", color: "bg-orange-500 text-white" };
          if (diffDays <= 3) return { text: "Próximo", color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" };
          return null;
        };
        
        const formatDate = (dateStr: string) => {
          const d = new Date(dateStr + 'T12:00:00');
          return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        };
        
        // Category icon mapping
        const getCategoryIcon = (categoryName: string | null) => {
          const name = (categoryName ?? '').toLowerCase();
          if (name.includes('aluguel')) return '🏠';
          if (name.includes('energia') || name.includes('luz')) return '⚡';
          if (name.includes('água')) return '💧';
          if (name.includes('internet') || name.includes('telefone')) return '🌐';
          if (name.includes('marketing') || name.includes('publicidade')) return '📣';
          if (name.includes('funcionário') || name.includes('salário')) return '👤';
          if (name.includes('imposto') || name.includes('taxa')) return '📊';
          if (name.includes('fornecedor')) return '📦';
          if (name.includes('seguro')) return '🛡️';
          if (name.includes('manutenção')) return '🔧';
          return '📅';
        };
        
        return (
          <div className="bg-card rounded-xl border border-border/50 p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Lançamentos futuros</h3>
                <p className="text-xs text-muted-foreground">
                  Quantia comprometida em {currentMonthName}: {formatCurrency(committedTotal)}
                </p>
              </div>
            </div>
            
            {/* Timeline horizontal */}
            {(!upcomingRecurring || upcomingRecurring.length === 0) ? (
              <div className="h-[100px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhum lançamento recorrente programado.
              </div>
            ) : (
              <div className="relative">
                <div 
                  className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-thin"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(200 200 200) transparent' }}
                >
                  {upcomingRecurring.slice(0, 12).map((item, index) => {
                    const badge = getBadge(item.dueDate);
                    return (
                      <div key={`${item.recurringId}-${item.dueDate}`} className="flex items-center gap-3 flex-shrink-0">
                        {/* Mini card */}
                        <div className="relative bg-muted/50 border border-border/50 rounded-xl p-3 min-w-[150px] hover:border-border transition-colors">
                          {/* Badge */}
                          {badge && (
                            <span className={`absolute -top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.color}`}>
                              {badge.text}
                            </span>
                          )}
                          <div className="flex items-start gap-2.5">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: item.categoryColor ? `${item.categoryColor}20` : 'rgb(254 226 226)' }}>
                              {getCategoryIcon(item.categoryName)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground truncate max-w-[100px]">{item.description}</p>
                              <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-0.5">
                                {item.type === 'revenue' ? (
                                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(item.amount)}</span>
                                ) : (
                                  formatCurrency(item.amount)
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(item.dueDate)}</p>
                            </div>
                          </div>
                        </div>
                        {/* Arrow separator */}
                        {index < Math.min((upcomingRecurring?.length ?? 0), 12) - 1 && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Unified Tabbed Section: Gastos / Receitas / Recorrentes */}
      <div className="mt-6">
        {/* Header with tabs - OUTSIDE the card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-5">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              listTab === "gastos" ? "bg-red-100 dark:bg-red-500/15" :
              listTab === "receitas" ? "bg-emerald-100 dark:bg-emerald-500/15" :
              "bg-purple-100 dark:bg-purple-500/15"
            }`} style={{borderRadius: '12px'}}>
              {listTab === "gastos" ? (
                <Receipt className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : listTab === "receitas" ? (
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Repeat className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">
                {listTab === "gastos" ? "Gastos registrados" :
                 listTab === "receitas" ? "Receitas di\u00e1rias" :
                 "Despesas recorrentes"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {listTab === "gastos" ? `${expensesData?.total ?? 0} despesas` :
                 listTab === "receitas" ? `${dailyRevenueData?.total ?? 0} dias com receita` :
                 `${recurringExpenses?.length ?? 0} lan\u00e7amentos recorrentes`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Tab selector - same style as period selector */}
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
              {(["gastos", "receitas", "recorrentes"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setListTab(tab);
                    setPage(0);
                    setRevenuePage(0);
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    listTab === tab
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "gastos" ? "Gastos" : tab === "receitas" ? "Receitas" : "Recorrentes"}
                </button>
              ))}
            </div>
            {listTab === "gastos" && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingExpense(null);
                  setExpenseModalOpen(true);
                }}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Novo gasto
              </Button>
            )}
          </div>
        </div>

        {/* Card container for tab content */}
        <div className="bg-card rounded-xl border border-border/50 p-5">
        {/* === GASTOS TAB === */}
        {listTab === "gastos" && (
          <>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar despesas..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={filterCategory}
            onValueChange={(v) => {
              setFilterCategory(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Todas categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color || "#6b7280" }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {expensesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton h-5 flex-[0.8] rounded" />
                <div className="skeleton h-5 flex-1 rounded" />
                <div className="skeleton h-5 flex-[1.5] rounded" />
                <div className="skeleton h-5 flex-[0.7] rounded" />
                <div className="skeleton h-5 flex-[0.8] rounded" />
                <div className="skeleton h-5 flex-[0.5] rounded" />
              </div>
            ))}
          </div>
        ) : expensesData && expensesData.items.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                      Data
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                      Categoria
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                      Descrição
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                      Valor
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                      Pagamento
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expensesData.items.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-2 text-sm">
                        {new Date(expense.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                expense.categoryColor || "#6b7280",
                            }}
                          />
                          <span className="text-sm">
                            {expense.categoryName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm max-w-[200px] truncate">
                        {expense.description}
                      </td>
                      <td className="py-3 px-2 text-sm font-semibold text-right text-red-600 dark:text-red-400">
                        -{formatCurrency(Number(expense.amount))}
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {paymentMethodLabels[expense.paymentMethod] ||
                          expense.paymentMethod}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingExpense(expense);
                              setExpenseModalOpen(true);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              if (
                                confirm(
                                  "Tem certeza que deseja excluir esta despesa?"
                                )
                              ) {
                                deleteMutation.mutate({ id: expense.id });
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {expensesData.items.map((expense) => (
                <div
                  key={expense.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">
                        {expense.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              expense.categoryColor || "#6b7280",
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {expense.categoryName}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      -{formatCurrency(Number(expense.amount))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {new Date(expense.date).toLocaleDateString("pt-BR")}
                      </span>
                      <span>
                        {paymentMethodLabels[expense.paymentMethod] ||
                          expense.paymentMethod}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingExpense(expense);
                          setExpenseModalOpen(true);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (
                            confirm("Excluir esta despesa?")
                          ) {
                            deleteMutation.mutate({ id: expense.id });
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                <span className="text-sm text-muted-foreground">
                  {expensesData.total} despesa
                  {expensesData.total !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={Receipt}
            title="Nenhuma despesa registrada"
            description="Registre seus gastos para acompanhar a saúde financeira do restaurante."
            action={{
              label: "Registrar despesa",
              onClick: () => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              },
            }}
          />
        )}
          </>
        )}

        {/* === RECEITAS TAB === */}
        {listTab === "receitas" && (
          <>
            {dailyRevenueLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="skeleton h-5 flex-1 rounded" />
                    <div className="skeleton h-5 flex-[0.7] rounded" />
                    <div className="skeleton h-5 flex-1 rounded" />
                    <div className="skeleton h-5 flex-[0.8] rounded" />
                  </div>
                ))}
              </div>
            ) : dailyRevenueData && dailyRevenueData.items.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">Data</th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">Pedidos</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">Canais</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">Pagamentos</th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyRevenueData.items.map((rev) => (
                        <tr key={rev.date} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-2 text-sm">
                            {new Date(rev.date + 'T12:00:00').toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}
                          </td>
                          <td className="py-3 px-2 text-sm text-right">{rev.orderCount}</td>
                          <td className="py-3 px-2 text-sm">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {rev.sources.split(',').map((s) => (
                                <span key={s} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted">
                                  {sourceLabels[s.trim()] || s.trim()}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">
                            {rev.paymentMethods.split(',').map(m => paymentMethodLabels[m.trim()] || m.trim()).join(', ')}
                          </td>
                          <td className="py-3 px-2 text-sm font-semibold text-right text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(rev.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {dailyRevenueData.items.map((rev) => (
                    <div key={rev.date} className="p-4 rounded-xl bg-muted/30 border border-border/30">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(rev.date + 'T12:00:00').toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{rev.orderCount} pedidos</p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(rev.total)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {rev.sources.split(',').map((s) => (
                          <span key={s} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted">
                            {sourceLabels[s.trim()] || s.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {revenueTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                    <span className="text-sm text-muted-foreground">
                      {dailyRevenueData.total} dia{dailyRevenueData.total !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={revenuePage === 0} onClick={() => setRevenuePage((p) => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">{revenuePage + 1} / {revenueTotalPages}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={revenuePage >= revenueTotalPages - 1} onClick={() => setRevenuePage((p) => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={DollarSign}
                title="Nenhuma receita registrada"
                description="As receitas são geradas automaticamente a partir dos pedidos finalizados."
              />
            )}
          </>
        )}

        {/* === RECORRENTES TAB === */}
        {listTab === "recorrentes" && (
          <>
            {recurringExpenses && recurringExpenses.length > 0 ? (
              <div className="space-y-3">
                {recurringExpenses.map((rec: any) => {
                  const freqLabel =
                    rec.frequency === "monthly"
                      ? `Mensal (dia ${rec.executionDay})`
                      : rec.frequency === "weekly"
                      ? `Semanal (${WEEKDAY_LABELS[rec.executionDay] || rec.executionDay})`
                      : `Anual (dia ${rec.executionDay}/${MONTH_LABELS[(rec.executionMonth || 1) - 1]})`;
                  return (
                    <div
                      key={rec.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                        rec.active
                          ? "bg-muted/30 border-border/30"
                          : "bg-muted/10 border-border/20 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${
                          rec.active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                        }`}>
                          <Repeat className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{rec.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{freqLabel}</span>
                            <span>·</span>
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              {formatCurrency(Number(rec.amount))}
                            </span>
                            {rec.generateAsPending && (
                              <>
                                <span>·</span>
                                <span className="text-amber-600">Pendente</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={rec.active ? "Pausar" : "Ativar"}
                          onClick={() => {
                            toggleRecurringMutation.mutate({
                              id: rec.id,
                              establishmentId: establishmentId!,
                              active: !rec.active,
                            });
                          }}
                        >
                          {rec.active ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (confirm("Excluir esta recorrência? Os lançamentos já gerados serão mantidos.")) {
                              deleteRecurringMutation.mutate({
                                id: rec.id,
                                establishmentId: establishmentId!,
                                deleteFutureExpenses: false,
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Repeat}
                title="Nenhuma despesa recorrente"
                description="Crie despesas recorrentes para automatizar lançamentos periódicos."
                action={{
                  label: "Criar recorrência",
                  onClick: () => {
                    setEditingExpense(null);
                    setExpenseModalOpen(true);
                  },
                }}
              />
            )}
          </>
        )}
        </div>{/* end card container */}
      </div>{/* end tabbed section wrapper */}

      {/* Modals */}
      {establishmentId && (
        <>
          <ExpenseModal
            open={expenseModalOpen}
            onOpenChange={setExpenseModalOpen}
            establishmentId={establishmentId}
            editingExpense={editingExpense}
            onSuccess={invalidateAll}
          />
          <CategoryManagerModal
            open={categoryModalOpen}
            onOpenChange={setCategoryModalOpen}
            establishmentId={establishmentId}
          />
          <GoalModal
            open={goalModalOpen}
            onOpenChange={setGoalModalOpen}
            establishmentId={establishmentId}
            currentGoal={goalTarget}
            month={currentMonth}
            year={currentYear}
          />
        </>
      )}
    </AdminLayout>
  );
}
