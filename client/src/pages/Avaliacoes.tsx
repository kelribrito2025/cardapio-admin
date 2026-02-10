import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Star, MessageSquare, Users, Clock, TrendingUp, Send, ChevronDown, Filter, Hash, Calendar, Phone } from "lucide-react";
import { StatCard } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

function StarRatingCompact({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {rating}
      <Star size={14} className="fill-amber-400 text-amber-400" />
    </span>
  );
}

function getStatusBadge(review: any) {
  if (review.responseText) {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1">
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
        Respondida
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs gap-1">
      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
      Não respondida
    </Badge>
  );
}

// Sidebar de detalhes da avaliação - estilo iFood
function ReviewDetailSheet({ review, open, onOpenChange, establishmentId, onResponded }: {
  review: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  onResponded: () => void;
}) {
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    if (review) {
      setResponseText(review.responseText || "");
    }
  }, [review?.id]);

  const respondMutation = trpc.reviewsAdmin.respond.useMutation({
    onSuccess: () => {
      toast.success("Resposta enviada com sucesso!");
      onResponded();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar resposta");
    },
  });

  if (!review) return null;

  const createdDate = new Date(review.createdAt);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold">Detalhes da avaliação</SheetTitle>
        </SheetHeader>

        {/* Card cinza com pedido e data */}
        <div className="bg-muted/60 rounded-lg px-4 py-3 mb-6">
          <span className="text-red-600 font-semibold">Pedido {review.orderNumber || review.orderId || "—"}</span>
          <span className="text-sm text-foreground ml-3">Feito em {createdDate.toLocaleDateString("pt-BR")}</span>
        </div>

        {/* Nota */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">O que você achou do pedido?</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">{review.rating}.0</span>
            <StarRating rating={review.rating} size={20} />
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        {/* Comentário do cliente */}
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{review.customerName || "Cliente"} disse</p>
              <p className="text-xs text-muted-foreground">em {createdDate.toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
          {review.comment && (
            <p className="text-sm text-foreground leading-relaxed mt-3 ml-9">{review.comment}</p>
          )}
          {!review.comment && (
            <p className="text-sm text-muted-foreground italic mt-3 ml-9">Nenhum comentário</p>
          )}
        </div>

        {/* Sua resposta */}
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
              review.responseText ? "bg-emerald-500" : "bg-muted-foreground/30"
            )}>
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Sua resposta</p>
              {review.responseDate && (
                <p className="text-xs text-muted-foreground">
                  até {new Date(review.responseDate).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 ml-9">
            <Textarea
              placeholder="Escreva aqui uma resposta"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={4}
              className="text-sm"
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{responseText.length}/300 caracteres</p>
          </div>
        </div>

        {/* Botão enviar */}
        <Button
          className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-6"
          onClick={() => respondMutation.mutate({
            reviewId: review.id,
            establishmentId,
            responseText: responseText.trim(),
          })}
          disabled={!responseText.trim() || respondMutation.isPending}
        >
          {respondMutation.isPending ? "Enviando..." : "Enviar resposta"}
        </Button>
      </SheetContent>
    </Sheet>
  );
}

export default function Avaliacoes() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "pending" | "responded">("all");
  const [page, setPage] = useState(0);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const LIMIT = 20;

  // Buscar estabelecimento
  const { data: establishment } = trpc.establishment.get.useQuery(undefined, {
    enabled: !!user,
  });

  const establishmentId = establishment?.id;

  // Métricas
  const { data: metrics, refetch: refetchMetrics, isLoading: metricsLoading } = trpc.reviewsAdmin.metrics.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Lista de avaliações
  const { data: reviewsList, refetch: refetchReviews, isLoading } = trpc.reviewsAdmin.list.useQuery(
    { establishmentId: establishmentId!, filter, limit: LIMIT, offset: page * LIMIT },
    { enabled: !!establishmentId }
  );

  // Marcar como lidas
  const markAsReadMutation = trpc.reviewsAdmin.markAsRead.useMutation();

  useEffect(() => {
    if (reviewsList && establishmentId) {
      const unreadIds = reviewsList
        .filter((r: any) => !r.isRead)
        .map((r: any) => r.id);
      if (unreadIds.length > 0) {
        markAsReadMutation.mutate({ establishmentId, reviewIds: unreadIds });
      }
    }
  }, [reviewsList, establishmentId]);

  // Atualizar selectedReview quando a lista é refetched
  useEffect(() => {
    if (selectedReview && reviewsList) {
      const updated = reviewsList.find((r: any) => r.id === selectedReview.id);
      if (updated) {
        setSelectedReview(updated);
      }
    }
  }, [reviewsList]);

  const handleSelectReview = (review: any) => {
    setSelectedReview(review);
    setShowSidebar(true);
  };

  const handleResponded = () => {
    refetchReviews();
    refetchMetrics();
  };

  if (!establishment) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AdminLayout>
    );
  }

  if (establishment.reviewsEnabled === false) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
          <div className="p-4 bg-muted rounded-full">
            <Star className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Avaliações desativadas</h2>
            <p className="text-muted-foreground mt-1 max-w-md">
              As avaliações estão desativadas para o seu estabelecimento. Para ativar, acesse Configurações &gt; Estabelecimento &gt; Avaliações do Restaurante.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Star className="text-amber-500" size={28} />
          Avaliações
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie e responda as avaliações dos seus clientes</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        <StatCard
          title="Nota Média"
          value={metrics ? Number(metrics.avgRating).toFixed(1) : "—"}
          icon={Star}
          loading={metricsLoading}
          variant="amber"
          tooltip="Média geral de todas as avaliações"
        />
        <StatCard
          title="Média 30 dias"
          value={metrics ? Number(metrics.avgRating30d).toFixed(1) : "—"}
          icon={TrendingUp}
          loading={metricsLoading}
          variant="blue"
          tooltip="Média dos últimos 30 dias"
        />
        <StatCard
          title="Total"
          value={metrics?.totalReviews ?? 0}
          icon={MessageSquare}
          loading={metricsLoading}
          variant="emerald"
          tooltip="Total de avaliações recebidas"
        />
        <StatCard
          title="Clientes"
          value={metrics?.uniqueCustomers ?? 0}
          icon={Users}
          loading={metricsLoading}
          variant="primary"
          tooltip="Clientes únicos que avaliaram"
        />
        <StatCard
          title="Pendentes"
          value={metrics?.pendingResponse ?? 0}
          icon={Clock}
          loading={metricsLoading}
          variant="amber"
          tooltip="Avaliações aguardando resposta"
        />
      </div>

      {/* Filtros + contagem */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <Select value={filter} onValueChange={(v) => { setFilter(v as any); setPage(0); }}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="responded">Respondidas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {reviewsList?.length ?? 0} avaliação(ões) encontrada(s)
        </p>
      </div>

      {/* Tabela de avaliações */}
      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            <div className="animate-pulse">
              <div className="h-10 bg-muted/30 border-b" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 border-b flex items-center gap-4 px-4">
                  <div className="h-4 bg-muted rounded w-16" />
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-12" />
                  <div className="h-4 bg-muted rounded w-40" />
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-6 bg-muted rounded-full w-28" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : reviewsList && reviewsList.length > 0 ? (
        <>
          <Card style={{paddingTop: '0px', paddingBottom: '5px'}}>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold text-muted-foreground">Pedido</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Data da avaliação</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Nota</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Comentário</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Avaliação</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewsList.map((review: any) => {
                    const createdDate = new Date(review.createdAt);
                    return (
                      <TableRow
                        key={review.id}
                        className={cn(
                          "cursor-pointer transition-colors",
                          selectedReview?.id === review.id && "bg-muted/50",
                          !review.isRead && "font-medium"
                        )}
                      >
                        <TableCell className="text-sm text-red-600 font-medium">
                          {review.orderNumber || review.orderId || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {createdDate.toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <StarRatingCompact rating={review.rating} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                          <span className="line-clamp-2">
                            {review.comment || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <button
                            className="text-sm text-red-600 hover:text-red-700 hover:underline font-medium cursor-pointer"
                            onClick={() => handleSelectReview(review)}
                          >
                            Mostrar detalhes
                          </button>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(review)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Paginação */}
          {reviewsList.length === LIMIT && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronDown size={14} />
                Carregar mais
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star size={48} className="text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhuma avaliação encontrada</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {filter === "pending" ? "Todas as avaliações foram respondidas!" : 
               filter === "responded" ? "Nenhuma avaliação respondida ainda." :
               "As avaliações dos clientes aparecerão aqui."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>

    {/* Sidebar de detalhes da avaliação */}
    <ReviewDetailSheet
      review={selectedReview}
      open={showSidebar}
      onOpenChange={setShowSidebar}
      establishmentId={establishmentId!}
      onResponded={handleResponded}
    />
    </AdminLayout>
  );
}
