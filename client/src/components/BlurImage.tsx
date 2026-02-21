import { useState, useCallback, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BlurImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "onLoad" | "onError"> {
  /** URL da imagem principal */
  src: string;
  /** Placeholder blur em base64 data URI (data:image/webp;base64,...) */
  blurDataUrl?: string | null;
  /** Alt text para acessibilidade */
  alt: string;
  /** Classes CSS adicionais para o container */
  containerClassName?: string;
  /** Fallback quando não há imagem */
  fallback?: React.ReactNode;
}

/**
 * Componente de imagem com lazy loading e placeholder blur.
 * 
 * Mostra o placeholder blur (~20px base64 inline) enquanto a imagem
 * principal carrega, com transição suave de opacidade.
 * Se não houver blurDataUrl, mostra um fundo cinza com pulse animation.
 */
export function BlurImage({
  src,
  blurDataUrl,
  alt,
  className,
  containerClassName,
  fallback,
  ...imgProps
}: BlurImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (!src || hasError) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className={cn("bg-muted animate-pulse", containerClassName)} />
    );
  }

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Blur placeholder — sempre visível até a imagem carregar */}
      {blurDataUrl && !isLoaded && (
        <img
          src={blurDataUrl}
          alt=""
          aria-hidden="true"
          className={cn(
            "absolute inset-0 w-full h-full object-cover scale-110",
            className
          )}
          style={{ filter: "blur(8px)" }}
        />
      )}

      {/* Placeholder genérico quando não há blur */}
      {!blurDataUrl && !isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Imagem principal com lazy loading */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...imgProps}
      />
    </div>
  );
}

export default BlurImage;
