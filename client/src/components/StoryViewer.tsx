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
  onStoryViewed?: (storyId: number) => void;
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

const STORY_DURATION = 5000;
// No mobile, toques rápidos podem levar 100-300ms, então usamos 500ms como threshold
const LONG_PRESS_THRESHOLD = 500;

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

  // Touch/press tracking
  const pressStartTimeRef = useRef<number>(0);
  const pressStartXRef = useRef<number>(0);
  const pressStartYRef = useRef<number>(0);
  const isPressActiveRef = useRef(false);

  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const recordViewMutation = trpc.publicStories.recordView.useMutation();

  // Registar view quando o story muda
  useEffect(() => {
    const story = stories[currentIndex];
    if (story && !viewedStoriesRef.current.has(story.id)) {
      viewedStoriesRef.current.add(story.id);
      recordViewMutation.mutate({ storyId: story.id, sessionId });
      if (onStoryViewed) {
        onStoryViewed(story.id);
      }
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

  // ==========================================
  // TOUCH HANDLING — Abordagem simplificada
  // Usa onTouchStart/onTouchEnd no container
  // Tap rápido (<500ms) = navegar
  // Long press (>=500ms) = pausar, ao soltar retoma sem navegar
  // ==========================================

  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    pressStartTimeRef.current = Date.now();
    pressStartXRef.current = touch.clientX;
    pressStartYRef.current = touch.clientY;
    isPressActiveRef.current = true;
    setPaused(true);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isPressActiveRef.current) return;
    isPressActiveRef.current = false;
    
    const pressDuration = Date.now() - pressStartTimeRef.current;
    setPaused(false);

    // Long press — apenas retoma, não navega
    if (pressDuration >= LONG_PRESS_THRESHOLD) {
      return;
    }

    // Tap rápido — navegar
    const touch = e.changedTouches[0];
    if (!touch) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const tapX = touch.clientX - rect.left;
    const halfWidth = rect.width / 2;

    if (tapX < halfWidth) {
      goPrev();
    } else {
      goNext();
    }
  }, [goNext, goPrev]);

  const handleTouchCancel = useCallback(() => {
    isPressActiveRef.current = false;
    setPaused(false);
  }, []);

  // MOUSE HANDLING (desktop) — separado do touch
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    pressStartTimeRef.current = Date.now();
    pressStartXRef.current = e.clientX;
    isPressActiveRef.current = true;
    setPaused(true);
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isPressActiveRef.current) return;
    isPressActiveRef.current = false;
    
    const pressDuration = Date.now() - pressStartTimeRef.current;
    setPaused(false);

    if (pressDuration >= LONG_PRESS_THRESHOLD) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const halfWidth = rect.width / 2;

    if (tapX < halfWidth) {
      goPrev();
    } else {
      goNext();
    }
  }, [goNext, goPrev]);

  const handleMouseLeave = useCallback(() => {
    if (isPressActiveRef.current) {
      isPressActiveRef.current = false;
      setPaused(false);
    }
  }, []);

  // Determinar se o story tem ação
  const hasAction = currentStory && (currentStory.type === "product" || currentStory.type === "promo") && currentStory.productId;
  const actionButtonLabel = currentStory?.actionLabel || (currentStory?.type === "product" ? "Ver produto" : "Pedir agora");

  // Promo countdown
  const promoCountdown = currentStory?.type === "promo" && currentStory.promoExpiresAt
    ? promoTimeRemaining(currentStory.promoExpiresAt)
    : null;

  const handleActionClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Cancelar qualquer press ativo
    isPressActiveRef.current = false;
    setPaused(false);
    if (currentStory?.productId && onProductAction) {
      onProductAction(currentStory.productId);
    }
  }, [currentStory, onProductAction]);

  const handleCloseClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isPressActiveRef.current = false;
    setPaused(false);
    onClose();
  }, [onClose]);

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {/* Container principal — recebe TODOS os eventos de toque/mouse */}
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-[480px] mx-auto flex flex-col select-none touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
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

        {/* Overlay superior — pointer-events-none para não bloquear toques */}
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

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-white text-sm font-semibold truncate">
                {restaurantName}
              </span>
              <span className="text-white/60 text-xs flex-shrink-0">
                {timeAgo(currentStory.createdAt)}
              </span>
            </div>

            {/* Botão fechar */}
            <button
              onTouchEnd={handleCloseClick}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={handleCloseClick}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 pointer-events-auto"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Overlay inferior — Promoção e/ou Botão de ação */}
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

            {/* Botão de ação */}
            {hasAction && (
              <button
                onTouchEnd={handleActionClick}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={handleActionClick}
                onMouseDown={(e) => e.stopPropagation()}
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
