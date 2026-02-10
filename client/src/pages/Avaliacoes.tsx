import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Star, MessageSquare, Users, Clock, TrendingUp, Send, ChevronDown, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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

function MetricCard({ icon: Icon, label, value, subValue, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${color}`} />
      <CardContent className="p-4 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color.replace('bg-', 'bg-').replace('-500', '-100')} bg-opacity-20`}>
            <Icon size={20} className={color.replace('bg-', 'text-')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewCard({ review, establishmentId, onResponded }: {
  review: any;
  establishmentId: number;
  onResponded: () => void;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [responseText, setResponseText] = useState(review.responseText || "");

  const respondMutation = trpc.reviewsAdmin.respond.useMutation({
    onSuccess: () => {
      toast.success("Resposta enviada com sucesso!");
      setIsReplying(false);
      onResponded();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar resposta");
    },
  });

  const isNegative = review.rating <= 2;
  const timeAgo = useMemo(() => {
    const now = new Date();
    const created = new Date(review.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semana(s) atrás`;
    return created.toLocaleDateString("pt-BR");
  }, [review.createdAt]);

  return (
    <Card className={`transition-all ${isNegative ? "border-red-200 bg-red-50/30" : ""} ${!review.isRead ? "border-l-4 border-l-blue-500" : ""}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 ${isNegative ? "bg-red-400" : "bg-emerald-500"}`}>
              {review.customerName?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{review.customerName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <StarRating rating={review.rating} size={14} />
                <span className="text-xs text-muted-foreground">{timeAgo}</span>
              </div>
            </div>
          </div>
          <div className="shrink-0">
            {review.responseText ? (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                Respondida
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                Pendente
              </Badge>
            )}
          </div>
        </div>

        {/* Comment */}
        {review.comment && (
          <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{review.comment}</p>
        )}

        {/* Existing response */}
        {review.responseText && !isReplying && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg border-l-2 border-primary/30">
            <p className="text-xs font-medium text-muted-foreground mb-1">Sua resposta</p>
            <p className="text-sm">{review.responseText}</p>
            {review.responseDate && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(review.responseDate).toLocaleDateString("pt-BR")}
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 text-xs"
              onClick={() => { setIsReplying(true); setResponseText(review.responseText || ""); }}
            >
              Editar resposta
            </Button>
          </div>
        )}

        {/* Reply form */}
        {!review.responseText && !isReplying && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 h-8 text-xs gap-1.5"
            onClick={() => setIsReplying(true)}
          >
            <MessageSquare size={14} />
            Responder
          </Button>
        )}

        {isReplying && (
          <div className="mt-3 space-y-2">
            <Textarea
              placeholder="Escreva sua resposta pública..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={3}
              className="text-sm resize-none"
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{responseText.length}/1000</p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => { setIsReplying(false); setResponseText(review.responseText || ""); }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-red-600 hover:bg-red-700"
                  onClick={() => respondMutation.mutate({
                    reviewId: review.id,
                    establishmentId,
                    responseText: responseText.trim(),
                  })}
                  disabled={!responseText.trim() || respondMutation.isPending}
                >
                  <Send size={14} />
                  {respondMutation.isPending ? "Enviando..." : "Enviar resposta"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Avaliacoes() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "pending" | "responded">("all");
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  // Buscar estabelecimento
  const { data: establishment } = trpc.establishment.get.useQuery(undefined, {
    enabled: !!user,
  });

  const establishmentId = establishment?.id;

  // Métricas
  const { data: metrics, refetch: refetchMetrics } = trpc.reviewsAdmin.metrics.useQuery(
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

  // Marcar avaliações não lidas como lidas ao visualizar
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard
          icon={Star}
          label="Nota Média"
          value={metrics ? Number(metrics.avgRating).toFixed(1) : "—"}
          subValue="Geral"
          color="bg-amber-500"
        />
        <MetricCard
          icon={TrendingUp}
          label="Média 30 dias"
          value={metrics ? Number(metrics.avgRating30d).toFixed(1) : "—"}
          subValue="Últimos 30 dias"
          color="bg-blue-500"
        />
        <MetricCard
          icon={MessageSquare}
          label="Total"
          value={metrics?.totalReviews ?? 0}
          subValue="Avaliações"
          color="bg-emerald-500"
        />
        <MetricCard
          icon={Users}
          label="Clientes"
          value={metrics?.uniqueCustomers ?? 0}
          subValue="Que avaliaram"
          color="bg-purple-500"
        />
        <MetricCard
          icon={Clock}
          label="Pendentes"
          value={metrics?.pendingResponse ?? 0}
          subValue="Sem resposta"
          color="bg-red-500"
        />
      </div>

      {/* Filtros */}
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
          {reviewsList?.length ?? 0} avaliação(ões)
        </p>
      </div>

      {/* Lista de avaliações */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
                <div className="h-4 bg-muted rounded w-3/4 mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviewsList && reviewsList.length > 0 ? (
        <div className="space-y-3">
          {reviewsList.map((review: any) => (
            <ReviewCard
              key={review.id}
              review={review}
              establishmentId={establishmentId!}
              onResponded={handleResponded}
            />
          ))}

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
        </div>
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
    </AdminLayout>
  );
}
