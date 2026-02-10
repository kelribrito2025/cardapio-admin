import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Star, MessageSquare, Users, Clock, TrendingUp, Send, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Hash, Calendar, Phone, X, Pencil, CheckCircle2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";

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
      {Number(rating).toFixed(1)}
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

// Sidebar de detalhes da avaliação - estilo iFood profissional
function ReviewDetailSheet({ review, open, onOpenChange, establishmentId, onResponded }: {
  review: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  onResponded: () => void;
}) {
  const [responseText, setResponseText] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (review) {
      setResponseText(review.responseText || "");
      setIsEditing(false);
    }
  }, [review?.id]);

  const respondMutation = trpc.reviewsAdmin.respond.useMutation({
    onSuccess: () => {
      toast.success("Resposta enviada com sucesso!");
      setIsEditing(false);
      onResponded();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar resposta");
    },
  });

  if (!review) return null;

  const createdDate = new Date(review.createdAt);
  const hasResponse = !!review.responseText;
  const showTextarea = !hasResponse || isEditing;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent hideCloseButton className="w-full sm:max-w-[480px] !p-0 !gap-0 !h-dvh">
        <SheetTitle className="sr-only">Detalhes da Avaliação</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Header vermelho */}
          <div className="shrink-0 bg-gradient-to-r from-red-500 to-red-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Detalhes da Avaliação</h2>
                  <p className="text-sm text-white/80">Veja e responda a avaliação do cliente</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto">
            {/* Card do pedido */}
            <div className="bg-muted/40 px-5 py-3 border-b border-border/50">
              <span className="text-red-600 font-semibold">Pedido {review.orderNumber || review.orderId || "—"}</span>
              <span className="text-sm text-muted-foreground ml-3">Feito em {createdDate.toLocaleDateString("pt-BR")}</span>
            </div>

            <div className="p-5 space-y-6">
              {/* Nota geral em destaque */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">O que você achou do pedido?</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold tracking-tight">{Number(review.rating).toFixed(1)}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={22}
                        className={cn(
                          "transition-colors",
                          i <= review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted text-muted"
                        )}
                      />
                    ))}
                  </div>

                </div>
              </div>

              <div className="border-t border-border/60" />

              {/* Comentário do cliente */}
              <div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-red-600 font-bold text-sm">
                      {(review.customerName || "C").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-[15px]">
                      {review.customerName || "Cliente"} disse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      em {createdDate.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="mt-3 ml-10">
                  {review.comment ? (
                    <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Nenhum comentário</p>
                  )}
                </div>
              </div>

              <div className="border-t border-border/60" />

              {/* Seção Sua resposta */}
              <div>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    hasResponse ? "bg-red-100" : "bg-gray-100"
                  )}>
                    <span className={cn("font-bold text-sm", hasResponse ? "text-red-600" : "text-gray-400")}>
                      R
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-[15px]">Sua resposta</p>
                    {review.responseDate ? (
                      <p className="text-xs text-muted-foreground">
                        até {new Date(review.responseDate).toLocaleDateString("pt-BR")}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Aguardando resposta</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 ml-10">
                  {/* Estado: com resposta publicada (modo leitura) */}
                  {hasResponse && !isEditing ? (
                    <div className="space-y-3">
                      <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-lg p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span className="text-xs font-medium text-emerald-700">Resposta publicada</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{review.responseText}</p>
                        {review.responseDate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Respondido em {new Date(review.responseDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil size={12} />
                        Editar resposta
                      </Button>
                    </div>
                  ) : (
                    /* Estado: sem resposta ou editando */
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Escreva aqui uma resposta ao cliente"
                        value={responseText}
                        onChange={(e) => {
                          if (e.target.value.length <= 300) {
                            setResponseText(e.target.value);
                          }
                        }}
                        rows={5}
                        className="text-sm resize-none bg-muted/30 border-border/60 focus:bg-background transition-colors"
                        maxLength={300}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {responseText.length}/300 caracteres
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer fixo - só aparece quando em modo de escrita/edição */}
          {showTextarea && (
            <div className="shrink-0 p-4 border-t border-border bg-background">
              <Button
                className="w-full bg-red-500 hover:bg-red-600 text-white rounded-lg py-3 gap-2"
                onClick={() => respondMutation.mutate({
                  reviewId: review.id,
                  establishmentId,
                  responseText: responseText.trim(),
                })}
                disabled={!responseText.trim() || respondMutation.isPending}
              >
                <Send size={16} />
                {respondMutation.isPending ? "Enviando..." : (isEditing ? "Atualizar resposta" : "Enviar resposta")}
              </Button>
            </div>
          )}
        </div>
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
  const [pageInput, setPageInput] = useState("");
  const LIMIT = 15;

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

  // Contagem total de avaliações
  const { data: totalCount, refetch: refetchCount } = trpc.reviewsAdmin.count.useQuery(
    { establishmentId: establishmentId!, filter },
    { enabled: !!establishmentId }
  );

  // Lista de avaliações
  const { data: reviewsList, refetch: refetchReviews, isLoading } = trpc.reviewsAdmin.list.useQuery(
    { establishmentId: establishmentId!, filter, limit: LIMIT, offset: page * LIMIT },
    { enabled: !!establishmentId }
  );

  const totalPages = totalCount ? Math.ceil(totalCount / LIMIT) : 0;

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
    refetchCount();
  };

  // Reset page quando muda o filtro
  useEffect(() => {
    setPage(0);
    setPageInput("");
  }, [filter]);

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
          {totalCount ?? reviewsList?.length ?? 0} avaliação(ões) encontrada(s)
        </p>
      </div>

      {/* Tabela de avaliações */}
      {isLoading ? (
        <Card className="shadow-none">
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
          <Card className="shadow-none" style={{paddingTop: '0px', paddingBottom: '0px'}}>
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5 mt-2">
              <p className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages} · Total: {totalCount} avaliações
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setPage(0)}
                  disabled={page === 0}
                >
                  Primeira
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1.5 mx-1">
                  <span className="text-xs text-muted-foreground">Página</span>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageInput || (page + 1)}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(pageInput);
                        if (val >= 1 && val <= totalPages) {
                          setPage(val - 1);
                        }
                        setPageInput("");
                      }
                    }}
                    onBlur={() => {
                      const val = parseInt(pageInput);
                      if (val >= 1 && val <= totalPages) {
                        setPage(val - 1);
                      }
                      setPageInput("");
                    }}
                    className="h-8 w-14 text-center text-xs"
                  />
                  <span className="text-xs text-muted-foreground">de {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-semibold"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Próxima
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page >= totalPages - 1}
                >
                  Última
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="shadow-none">
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
