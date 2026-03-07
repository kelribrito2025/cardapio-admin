import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/shared";
import { Plus, Trash2, Clock, ImageIcon, AlertCircle, Eye, Clapperboard, ShoppingBag, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import StoryViewer from "@/components/StoryViewer";
import CreateStoryDialog from "@/components/CreateStoryDialog";

const MAX_STORIES = 5;

function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return `${Math.floor(diffH / 24)}d`;
}

function timeRemaining(expiresAt: Date | string): string {
  const now = new Date();
  const exp = new Date(expiresAt);
  const diffMs = exp.getTime() - now.getTime();
  if (diffMs <= 0) return "Expirado";
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}min restantes`;
  const diffH = Math.floor(diffMin / 60);
  return `${diffH}h restantes`;
}

function storyTypeLabel(type: string): { label: string; icon: typeof ImageIcon; color: string } {
  switch (type) {
    case "product":
      return { label: "Produto", icon: ShoppingBag, color: "text-emerald-600" };
    case "promo":
      return { label: "Promoção", icon: Tag, color: "text-orange-600" };
    default:
      return { label: "Imagem", icon: ImageIcon, color: "text-blue-600" };
  }
}

export default function Stories() {
  const { data: establishment } = trpc.establishment.get.useQuery();
  const establishmentId = establishment?.id;
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: storiesList, isLoading, refetch } = trpc.stories.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Analytics de views
  const { data: viewsData } = trpc.stories.viewsAnalytics.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId, refetchInterval: 30000 }
  );

  const deleteMutation = trpc.stories.delete.useMutation({
    onSuccess: () => {
      toast.success("Story excluído");
      refetch();
      setDeleteConfirm(null);
      setShowStoryViewer(false);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao excluir story");
    },
  });

  // Filtrar apenas stories ativos (não expirados)
  const activeStories = (storiesList || []).filter(
    (s) => new Date(s.expiresAt).getTime() > Date.now()
  );

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="mb-6">
          <PageHeader 
            title="Stories" 
            description="Divulgue promoções e novidades no cardápio público"
            icon={<Clapperboard className="h-6 w-6 text-blue-600" />}
          />
        </div>

        {/* Stories Grid - Estilo Instagram */}
        <div className="flex items-start gap-5 overflow-x-auto pb-4">
          {/* Botão Adicionar Story */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowCreateDialog(true)}
              disabled={activeStories.length >= MAX_STORIES}
              className={cn(
                "relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all",
                activeStories.length >= MAX_STORIES
                  ? "bg-muted/50 cursor-not-allowed"
                  : "bg-muted/30 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
              )}
            >
              <Plus className={cn(
                "h-7 w-7",
                activeStories.length >= MAX_STORIES ? "text-muted-foreground/30" : "text-muted-foreground/60"
              )} />
              {/* Badge + azul estilo Instagram */}
              {activeStories.length < MAX_STORIES && (
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center border-2 border-background">
                  <Plus className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </button>
            <span className="text-xs text-muted-foreground font-medium">Novo story</span>
          </div>

          {/* Stories existentes */}
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted animate-pulse" />
                <div className="w-12 h-3 bg-muted rounded animate-pulse" />
              </div>
            ))
          ) : (
            activeStories.map((story) => {
              const typeInfo = storyTypeLabel(story.type);
              return (
                <div key={story.id} className="flex flex-col items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      const idx = activeStories.findIndex(s => s.id === story.id);
                      setStoryViewerIndex(idx >= 0 ? idx : 0);
                      setShowStoryViewer(true);
                    }}
                    className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden group"
                  >
                    {/* Borda degradê Instagram */}
                    <div className="absolute inset-0 rounded-full p-[3px]" style={{
                      background: story.type === "promo" 
                        ? "linear-gradient(45deg, #f97316, #ef4444, #f97316)"
                        : story.type === "product"
                        ? "linear-gradient(45deg, #10b981, #059669, #10b981)"
                        : "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)"
                    }}>
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                        <img
                          src={story.imageUrl}
                          alt="Story"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    {/* Badge de tipo */}
                    {story.type !== "simple" && (
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-background",
                        story.type === "product" ? "bg-emerald-500" : "bg-orange-500"
                      )}>
                        <typeInfo.icon className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {/* Overlay hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-white" />
                    </div>
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] text-muted-foreground">{timeAgo(story.createdAt)}</span>
                    {viewsData && viewsData[story.id] !== undefined && (
                      <span className="text-[10px] text-muted-foreground/70 flex items-center gap-0.5">
                        <Eye className="h-2.5 w-2.5" />
                        {viewsData[story.id]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info do limite */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{activeStories.length}/{MAX_STORIES} stories ativos</span>
          {activeStories.length >= MAX_STORIES && (
            <span className="text-amber-500 font-medium">— Limite atingido</span>
          )}
        </div>

        {/* Lista detalhada dos stories */}
        {activeStories.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-4">Stories ativos</h2>
            <div className="space-y-3">
              {activeStories.map((story) => {
                const typeInfo = storyTypeLabel(story.type);
                const TypeIcon = typeInfo.icon;
                return (
                  <div
                    key={story.id}
                    className="flex items-center gap-4 p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={story.imageUrl}
                        alt="Story"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <TypeIcon className={cn("h-3.5 w-3.5", typeInfo.color)} />
                        <span className={cn("text-xs font-medium", typeInfo.color)}>
                          {typeInfo.label}
                        </span>
                        {story.type === "promo" && story.promoTitle && (
                          <span className="text-xs text-foreground font-medium truncate">
                            — {story.promoTitle}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Publicado {timeAgo(story.createdAt)}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {timeRemaining(story.expiresAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {viewsData?.[story.id] ?? 0} {(viewsData?.[story.id] ?? 0) === 1 ? "view" : "views"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <button
                      onClick={() => setDeleteConfirm(story.id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {!isLoading && activeStories.length === 0 && (
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">Nenhum story ativo</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Publique stories para divulgar promoções, combos e novidades diretamente no seu cardápio público.
            </p>
          </div>
        )}

        {/* Dialog de criação de story */}
        {establishmentId && (
          <CreateStoryDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            establishmentId={establishmentId}
            onSuccess={() => refetch()}
            activeStoriesCount={activeStories.length}
            maxStories={MAX_STORIES}
          />
        )}

        {/* StoryViewer fullscreen (mesmo do menu público) */}
        {showStoryViewer && activeStories.length > 0 && (
          <StoryViewer
            stories={activeStories.map(s => ({
              id: s.id,
              imageUrl: s.imageUrl,
              createdAt: s.createdAt,
              expiresAt: s.expiresAt,
            }))}
            restaurantName={establishment?.name || "Meu Restaurante"}
            restaurantLogo={establishment?.logo}
            initialIndex={storyViewerIndex}
            onClose={() => setShowStoryViewer(false)}
          />
        )}

        {/* Modal de confirmação de exclusão */}
        <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-[340px] rounded-2xl">
            <DialogTitle className="text-base font-bold text-foreground">Excluir story?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita. O story será removido do seu cardápio público.
            </DialogDescription>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-10 rounded-xl border border-border/60 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
