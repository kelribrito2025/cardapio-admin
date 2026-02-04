import { useState } from "react";
import type { Coupon } from "../../../drizzle/schema";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Ticket,
  MoreVertical,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Percent,
  DollarSign,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type CouponStatus = "active" | "inactive" | "expired" | "exhausted";

const statusConfig: Record<CouponStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  active: { label: "Ativo", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  inactive: { label: "Inativo", color: "text-gray-700", bgColor: "bg-gray-50", borderColor: "border-gray-200", icon: <XCircle className="h-3.5 w-3.5" /> },
  expired: { label: "Expirado", color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  exhausted: { label: "Esgotado", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200", icon: <Ban className="h-3.5 w-3.5" /> },
};

const dayLabels: Record<string, string> = {
  dom: "Dom",
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
  sab: "Sáb",
};

const originLabels: Record<string, string> = {
  retirada: "Retirada",
  delivery: "Delivery",
  autoatendimento: "Autoatendimento",
};

export default function Cupons() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Filters
  const [search, setSearch] = useState("");

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<number | null>(null);

  // Get establishment
  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();

  // Get coupons
  const { data: couponsData, isLoading: couponsLoading } = trpc.coupon.list.useQuery(
    { 
      establishmentId: establishment?.id ?? 0,
      search: search || undefined,
    },
    { enabled: !!establishment?.id }
  );

  // Mutations
  const toggleStatusMutation = trpc.coupon.toggleStatus.useMutation({
    onSuccess: () => {
      utils.coupon.list.invalidate();
      toast.success("Status do cupom atualizado!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const deleteMutation = trpc.coupon.delete.useMutation({
    onSuccess: () => {
      utils.coupon.list.invalidate();
      toast.success("Cupom excluído com sucesso!");
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir cupom");
    },
  });

  const handleToggleStatus = (id: number, currentStatus: CouponStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    toggleStatusMutation.mutate({ id, status: newStatus });
  };

  const handleDelete = (id: number) => {
    setCouponToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (couponToDelete) {
      deleteMutation.mutate({ id: couponToDelete });
    }
  };

  const formatCurrency = (value: string | number | null | undefined) => {
    if (!value) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `R$ ${num.toFixed(2).replace(".", ",")}`;
  };

  const formatDateRange = (start: Date | null | undefined, end: Date | null | undefined) => {
    if (!start && !end) return "Sem limite";
    if (start && end) {
      return `${format(new Date(start), "dd/MM/yy", { locale: ptBR })} - ${format(new Date(end), "dd/MM/yy", { locale: ptBR })}`;
    }
    if (start) return `A partir de ${format(new Date(start), "dd/MM/yy", { locale: ptBR })}`;
    if (end) return `Até ${format(new Date(end), "dd/MM/yy", { locale: ptBR })}`;
    return "-";
  };

  const formatActiveDays = (days: string[] | null | undefined) => {
    if (!days || days.length === 0 || days.length === 7) return "Todos";
    return days.map(d => dayLabels[d] || d).join(", ");
  };

  const formatValidOrigins = (origins: string[] | null | undefined) => {
    if (!origins || origins.length === 0) return "Todas";
    return origins.map(o => originLabels[o] || o).join(", ");
  };

  const isLoading = establishmentLoading || couponsLoading;
  const coupons = couponsData?.coupons ?? [];

  // Stats
  const activeCoupons = coupons.filter((c: Coupon) => c.status === "active").length;
  const inactiveCoupons = coupons.filter((c: Coupon) => c.status === "inactive").length;
  const expiredCoupons = coupons.filter((c: Coupon) => c.status === "expired").length;
  const exhaustedCoupons = coupons.filter((c: Coupon) => c.status === "exhausted").length;

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Cupons</h1>
            <p className="text-base text-muted-foreground">Gerencie os cupons de desconto do seu estabelecimento</p>
          </div>
          <Button onClick={() => navigate("/cupons/novo")} className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-1.5" />
            Criar novo cupom
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Ativos */}
          <div className="bg-card rounded-xl p-5 border border-border/50 border-t-4 border-t-green-500 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Ativos</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-2xl font-bold tracking-tight text-green-600">{activeCoupons}</span>
                </div>
              </div>
              <div className="p-2.5 bg-green-100 rounded-lg shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          {/* Inativos */}
          <div className="bg-card rounded-xl p-5 border border-border/50 border-t-4 border-t-gray-400 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Inativos</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-2xl font-bold tracking-tight text-gray-600">{inactiveCoupons}</span>
                </div>
              </div>
              <div className="p-2.5 bg-gray-100 rounded-lg shrink-0">
                <XCircle className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>
          {/* Expirados */}
          <div className="bg-card rounded-xl p-5 border border-border/50 border-t-4 border-t-orange-500 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Expirados</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-2xl font-bold tracking-tight text-orange-600">{expiredCoupons}</span>
                </div>
              </div>
              <div className="p-2.5 bg-orange-100 rounded-lg shrink-0">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>
          {/* Esgotados */}
          <div className="bg-card rounded-xl p-5 border border-border/50 border-t-4 border-t-red-500 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Esgotados</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-2xl font-bold tracking-tight text-red-600">{exhaustedCoupons}</span>
                </div>
              </div>
              <div className="p-2.5 bg-red-100 rounded-lg shrink-0">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <Card className="shadow-none" style={{paddingTop: '0px', paddingBottom: '0px'}}>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : coupons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-3 bg-gray-100 rounded-full mb-3">
                  <Ticket className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Nenhum cupom encontrado</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {search ? "Tente buscar por outro código" : "Crie seu primeiro cupom de desconto"}
                </p>
                {!search && (
                  <Button onClick={() => navigate("/cupons/novo")} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Criar cupom
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-medium">Código</TableHead>
                      <TableHead className="font-medium">Tipo</TableHead>
                      <TableHead className="font-medium">Valor</TableHead>
                      <TableHead className="font-medium">Máx. Desconto</TableHead>
                      <TableHead className="font-medium">Mín. Pedido</TableHead>
                      <TableHead className="font-medium">Validade</TableHead>
                      <TableHead className="font-medium">Dias</TableHead>
                      <TableHead className="font-medium">Origem</TableHead>
                      <TableHead className="font-medium">Status</TableHead>
                      <TableHead className="font-medium">Uso</TableHead>
                      <TableHead className="font-medium w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon: Coupon) => {
                      const status = statusConfig[coupon.status as CouponStatus];
                      return (
                        <TableRow 
                          key={coupon.id} 
                          className="cursor-pointer hover:bg-gray-50/50"
                          onClick={() => navigate(`/cupons/${coupon.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-red-50 rounded">
                                <Ticket className="h-3.5 w-3.5 text-red-600" />
                              </div>
                              <span className="font-mono font-medium text-gray-900">{coupon.code}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {coupon.type === "percentage" ? (
                                <>
                                  <Percent className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="text-sm text-gray-600">Percentual</span>
                                </>
                              ) : (
                                <>
                                  <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="text-sm text-gray-600">Valor fixo</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-gray-900">
                              {coupon.type === "percentage" 
                                ? `${coupon.value}%` 
                                : formatCurrency(coupon.value)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatCurrency(coupon.maxDiscount)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatCurrency(coupon.minOrderValue)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              {formatDateRange(coupon.startDate, coupon.endDate)}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatActiveDays(coupon.activeDays)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatValidOrigins(coupon.validOrigins)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`${status.bgColor} ${status.color} ${status.borderColor} gap-1`}
                            >
                              {status.icon}
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {coupon.usedCount}
                              {coupon.quantity && `/${coupon.quantity}`}
                            </span>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/cupons/${coupon.id}`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleToggleStatus(coupon.id, coupon.status as CouponStatus)}
                                  disabled={coupon.status === "expired" || coupon.status === "exhausted"}
                                >
                                  {coupon.status === "active" ? (
                                    <>
                                      <ToggleLeft className="h-4 w-4 mr-2" />
                                      Desativar
                                    </>
                                  ) : (
                                    <>
                                      <ToggleRight className="h-4 w-4 mr-2" />
                                      Ativar
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(coupon.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cupom será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
