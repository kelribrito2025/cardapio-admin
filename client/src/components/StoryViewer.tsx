import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { X, ChevronUp, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Story {
  id: number;
  imageUrl: string;
  createdAt: string | Date;
  expiresAt: string | Date;
  type?: "simple" | "product" | "promo";
  productId?: number | null;
  promoTitle?: string | null;
  promoText?: string | null;
  promoPrice?: string | null;
  promoExpiresAt?: string | Date | null;
  actionLabel?: string | null;
}

interface StoryViewerProps {
  stories: Story[];
  restaurantName: string;
  restaurantLogo?: string | null;
  initialIndex?: number;
  onClose: () => void;
  onAllViewed?: () => void;
  /** Chamado cada vez que um story individual é visto, com o ID do story */
  onStoryViewed?: (storyId: number) => void;
  /** Chamado quando o utilizador clica no botão de ação (ver produto / pedir agora) */
  onProductAction?: (productId: number) => void;
}

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

function promoTimeRemaining(expiresAt: Date | string): string | null {
  const now = new Date();
  const exp = new Date(expiresAt);
  const diffMs = exp.getTime() - now.getTime();
  if (diffMs <= 0) return "Expirada";
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `Termina em ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Termina em ${diffH}h`;
  return `Válida até ${exp.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
}

const STORY_DURATION = 5000; // 5 segundos
const LONG_PRESS_THRESHOLD = 200; // ms

// Gerar ou recuperar sessionId para analytics de views
function getOrCreateSessionId(): string {
  const key = "mindi_story_session";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

export default function StoryViewer({
  stories,
  restaurantName,
  restaurantLogo,
  initialIndex = 0,
  onClose,
  onAllViewed,
  onStoryViewed,
  onProductAction,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const viewedStoriesRef = useRef<Set<number>>(new Set());
  const allViewedCalledRef = useRef(false);

  // Long press detection refs
  const pressStartTimeRef = useRef<number>(0);
  const pressStartXRef = useRef<number>(0);
  const isLongPressRef = useRef(false);

  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const recordViewMutation = trpc.publicStories.recordView.useMutation();

  // Registar view quando o story muda
  useEffect(() => {
    const story = stories[currentIndex];
    if (story && !viewedStoriesRef.current.has(story.id)) {
      viewedStoriesRef.current.add(story.id);
      recordViewMutation.mutate({ storyId: story.id, sessionId });
      
      // Notificar que este story individual foi visto
      if (onStoryViewed) {
        onStoryViewed(story.id);
      }
      
      // Verificar se todos os stories foram vistos
      if (viewedStoriesRef.current.size === stories.length && onAllViewed && !allViewedCalledRef.current) {
        allViewedCalledRef.current = true;
        onAllViewed();
      }
    }
  }, [currentIndex, stories, sessionId, onAllViewed, onStoryViewed]);

  const currentStory = stories[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      setImageLoaded(false);
      elapsedRef.current = 0;
    } else {
      // Último story — garantir que onAllViewed é chamado antes de fechar
      const story = stories[currentIndex];
      if (story && !viewedStoriesRef.current.has(story.id)) {
        viewedStoriesRef.current.add(story.id);
        recordViewMutation.mutate({ storyId: story.id, sessionId });
        if (onStoryViewed) {
          onStoryViewed(story.id);
        }
      }
      if (viewedStoriesRef.current.size === stories.length && onAllViewed && !allViewedCalledRef.current) {
        allViewedCalledRef.current = true;
        onAllViewed();
      }
      onClose();
    }
  }, [currentIndex, stories.length, stories, onClose, onAllViewed, onStoryViewed, sessionId]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      setImageLoaded(false);
      elapsedRef.current = 0;
    }
  }, [currentIndex]);

  // Timer de progresso
  useEffect(() => {
    if (!imageLoaded || paused) return;

    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current);
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        goNext();
      }
    }, 30);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      elapsedRef.current += Date.now() - startTimeRef.current;
    };
  }, [imageLoaded, paused, currentIndex, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  // Bloquear scroll do body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // --- Lógica de interação: Long Press = Pausar, Tap Rápido = Navegar ---
  const getClientX = (e: React.MouseEvent | React.TouchEvent): number => {
    if ("touches" in e) {
      return e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
    }
    return e.clientX;
  };

  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    pressStartTimeRef.current = Date.now();
    pressStartXRef.current = getClientX(e);
    isLongPressRef.current = false;
    setPaused(true);
  };

  const handlePressEnd = (e: React.MouseEvent | React.TouchEvent) => {
    const pressDuration = Date.now() - pressStartTimeRef.current;
    setPaused(false);

    // Se foi long press (>200ms), apenas retoma — não navega
    if (pressDuration >= LONG_PRESS_THRESHOLD) {
      isLongPressRef.current = true;
      return;
    }

    // Tap rápido — navegar baseado na posição do toque
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const endX = "changedTouches" in e ? e.changedTouches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX;
    const tapX = endX - rect.left;
    const halfWidth = rect.width / 2;

    if (tapX < halfWidth) {
      goPrev();
    } else {
      goNext();
    }
  };

  // Prevenir onClick nativo para evitar dupla navegação
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Determinar se o story tem ação
  const hasAction = currentStory && (currentStory.type === "product" || currentStory.type === "promo") && currentStory.productId;
  const actionButtonLabel = currentStory?.actionLabel || (currentStory?.type === "product" ? "Ver produto" : "Pedir agora");

  // Promo countdown
  const promoCountdown = currentStory?.type === "promo" && currentStory.promoExpiresAt
    ? promoTimeRemaining(currentStory.promoExpiresAt)
    : null;

  const handleActionClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (currentStory?.productId && onProductAction) {
      onProductAction(currentStory.productId);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {/* Container do story — recebe TODOS os eventos de toque/mouse */}
      <div
        className="relative w-full h-full max-w-[480px] mx-auto flex flex-col select-none"
        onClick={handleClick}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={() => {
          if (paused) setPaused(false);
        }}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={() => {
          if (paused) setPaused(false);
        }}
      >
        {/* Imagem de fundo */}
        <div className="absolute inset-0 flex items-center justify-center bg-black pointer-events-none">
          {!imageLoaded && (
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          <img
            src={currentStory.imageUrl}
            alt="Story"
            className={`w-full h-full object-contain transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
          />
        </div>

        {/* Overlay superior com gradiente — pointer-events-none para não bloquear toques */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 via-black/20 to-transparent pt-2 px-3 pb-12 pointer-events-none">
          {/* Barras de progresso */}
          <div className="flex gap-1 mb-3">
            {stories.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-[2.5px] rounded-full bg-white/30 overflow-hidden"
              >
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{
                    width:
                      idx < currentIndex
                        ? "100%"
                        : idx === currentIndex
                        ? `${progress}%`
                        : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header: logo + nome + tempo + fechar */}
          <div className="flex items-center gap-3">
            {/* Logo do restaurante */}
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
              {restaurantLogo ? (
                <img
                  src={restaurantLogo}
                  alt={restaurantName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                  {restaurantName.charAt(0)}
                </div>
              )}
            </div>

            {/* Nome e tempo */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-white text-sm font-semibold truncate">
                {restaurantName}
              </span>
              <span className="text-white/60 text-xs flex-shrink-0">
                {timeAgo(currentStory.createdAt)}
              </span>
            </div>

            {/* Botão fechar — pointer-events-auto para ser clicável */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 pointer-events-auto"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Overlay inferior — Promoção e/ou Botão de ação */}
        {/* pointer-events-none no container, pointer-events-auto apenas nos botões */}
        {(currentStory.type === "promo" || hasAction) && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-6 pt-20 px-4 pointer-events-none">
            {/* Dados da promoção */}
            {currentStory.type === "promo" && (
              <div className="mb-4 text-center">
                {currentStory.promoTitle && (
                  <h3 className="text-white text-xl font-bold drop-shadow-lg mb-1">
                    {currentStory.promoTitle}
                  </h3>
                )}
                {currentStory.promoText && (
                  <p className="text-white/90 text-sm drop-shadow-md mb-2">
                    {currentStory.promoText}
                  </p>
                )}
                {currentStory.promoPrice && (
                  <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-2">
                    <span className="text-white text-lg font-bold">
                      {currentStory.promoPrice}
                    </span>
                  </div>
                )}
                {promoCountdown && (
                  <div className="flex items-center justify-center gap-1.5 text-white/70 text-xs mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{promoCountdown}</span>
                  </div>
                )}
              </div>
            )}

            {/* Botão de ação — pointer-events-auto para ser clicável */}
            {hasAction && (
              <button
                onClick={handleActionClick}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (currentStory?.productId && onProductAction) {
                    onProductAction(currentStory.productId);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black font-semibold text-sm shadow-lg active:scale-[0.98] transition-transform pointer-events-auto"
              >
                <ChevronUp className="h-4 w-4" />
                {actionButtonLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
