import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { X } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Story {
  id: number;
  imageUrl: string;
  createdAt: string | Date;
  expiresAt: string | Date;
}

interface StoryViewerProps {
  stories: Story[];
  restaurantName: string;
  restaurantLogo?: string | null;
  initialIndex?: number;
  onClose: () => void;
  onAllViewed?: () => void;
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

const STORY_DURATION = 5000; // 5 segundos

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
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const viewedStoriesRef = useRef<Set<number>>(new Set());

  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const recordViewMutation = trpc.publicStories.recordView.useMutation();

  // Registar view quando o story muda
  useEffect(() => {
    const story = stories[currentIndex];
    if (story && !viewedStoriesRef.current.has(story.id)) {
      viewedStoriesRef.current.add(story.id);
      recordViewMutation.mutate({ storyId: story.id, sessionId });
      
      // Verificar se todos os stories foram vistos
      if (viewedStoriesRef.current.size === stories.length && onAllViewed) {
        onAllViewed();
      }
    }
  }, [currentIndex, stories, sessionId, onAllViewed]);

  const currentStory = stories[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      setImageLoaded(false);
      elapsedRef.current = 0;
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

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

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = "touches" in e ? e.changedTouches[0].clientX : e.clientX;
    const tapX = clientX - rect.left;
    const halfWidth = rect.width / 2;

    if (tapX < halfWidth) {
      goPrev();
    } else {
      goNext();
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {/* Container do story */}
      <div
        className="relative w-full h-full max-w-[480px] mx-auto flex flex-col"
        onClick={handleTap}
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Imagem de fundo */}
        <div className="absolute inset-0 flex items-center justify-center bg-black">
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

        {/* Overlay superior com gradiente */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 via-black/20 to-transparent pt-2 px-3 pb-12">
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

            {/* Botão fechar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
