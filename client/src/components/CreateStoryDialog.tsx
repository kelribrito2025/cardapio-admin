import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Image as ImageIcon,
  ShoppingBag,
  Tag,
  Upload,
  X,
  Search,
  ChevronDown,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type StoryType = "simple" | "product" | "promo";

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  onSuccess: () => void;
  activeStoriesCount: number;
  maxStories: number;
}

export default function CreateStoryDialog({
  open,
  onOpenChange,
  establishmentId,
  onSuccess,
  activeStoriesCount,
  maxStories,
}: CreateStoryDialogProps) {
  const [step, setStep] = useState<"type" | "image" | "details">("type");
  const [storyType, setStoryType] = useState<StoryType>("simple");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageMimeType, setImageMimeType] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product selection
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number;
    name: string;
    price: number;
    imageUrl?: string | null;
  } | null>(null);
  const [showProductList, setShowProductList] = useState(false);

  // Promo fields
  const [promoTitle, setPromoTitle] = useState("");
  const [promoText, setPromoText] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [promoHasExpiry, setPromoHasExpiry] = useState(false);
  const [promoExpiryDate, setPromoExpiryDate] = useState("");
  const [promoExpiryTime, setPromoExpiryTime] = useState("");

  // Action label
  const [actionLabel, setActionLabel] = useState("");

  // Fetch products for selection
  const { data: productsData } = trpc.products.list.useQuery(
    { establishmentId },
    { enabled: open && storyType === "product" }
  );

  const products = productsData?.products || [];
  const filteredProducts = products.filter(
    (p: any) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
      p.status === "active"
  );

  const createMutation = trpc.stories.create.useMutation({
    onSuccess: () => {
      toast.success("Story publicado com sucesso!");
      onSuccess();
      handleClose();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao publicar story");
      setUploading(false);
    },
  });

  const handleClose = () => {
    setStep("type");
    setStoryType("simple");
    setImagePreview(null);
    setImageBase64("");
    setImageMimeType("");
    setSelectedProduct(null);
    setProductSearch("");
    setPromoTitle("");
    setPromoText("");
    setPromoPrice("");
    setPromoHasExpiry(false);
    setPromoExpiryDate("");
    setPromoExpiryTime("");
    setActionLabel("");
    setUploading(false);
    setShowProductList(false);
    onOpenChange(false);
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        toast.error("Apenas imagens JPG e PNG são permitidas");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error("Imagem muito grande. Máximo 10MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        setImageBase64(dataUrl.split(",")[1]);
        setImageMimeType(file.type);
        // Avançar para detalhes se não for simple
        if (storyType === "simple") {
          setStep("details");
        } else {
          setStep("details");
        }
      };
      reader.readAsDataURL(file);

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [storyType]
  );

  const handlePublish = async () => {
    if (!imageBase64) {
      toast.error("Selecione uma imagem");
      return;
    }

    if (activeStoriesCount >= maxStories) {
      toast.error(
        "Limite de stories atingido. Exclua um antes de adicionar outro."
      );
      return;
    }

    if (storyType === "product" && !selectedProduct) {
      toast.error("Selecione um produto do cardápio");
      return;
    }

    if (storyType === "promo" && !promoTitle.trim()) {
      toast.error("Informe o título da promoção");
      return;
    }

    setUploading(true);

    const data: any = {
      establishmentId,
      base64: imageBase64,
      mimeType: imageMimeType,
      type: storyType,
    };

    if (storyType === "product") {
      data.productId = selectedProduct!.id;
      data.actionLabel = actionLabel.trim() || "Ver produto";
    }

    if (storyType === "promo") {
      data.promoTitle = promoTitle.trim();
      data.promoText = promoText.trim() || undefined;
      data.promoPrice = promoPrice.trim() || undefined;
      data.actionLabel = actionLabel.trim() || "Pedir agora";
      if (selectedProduct) {
        data.productId = selectedProduct.id;
      }
      if (promoHasExpiry && promoExpiryDate) {
        const dateStr = promoExpiryTime
          ? `${promoExpiryDate}T${promoExpiryTime}`
          : `${promoExpiryDate}T23:59`;
        data.promoExpiresAt = new Date(dateStr);
      }
    }

    createMutation.mutate(data);
  };

  const canPublish =
    imageBase64 &&
    (storyType === "simple" ||
      (storyType === "product" && selectedProduct) ||
      (storyType === "promo" && promoTitle.trim()));

  // Default action labels
  useEffect(() => {
    if (storyType === "product" && !actionLabel) {
      setActionLabel("Ver produto");
    } else if (storyType === "promo" && !actionLabel) {
      setActionLabel("Pedir agora");
    }
  }, [storyType]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <div className="p-6">
          <DialogTitle className="text-lg font-bold text-foreground mb-1">
            Novo Story
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mb-5">
            {step === "type" && "Escolha o tipo de story que deseja publicar"}
            {step === "image" && "Selecione a imagem do story"}
            {step === "details" && "Configure os detalhes do story"}
          </DialogDescription>

          {/* Step 1: Escolher tipo */}
          {step === "type" && (
            <div className="space-y-3">
              {[
                {
                  type: "simple" as StoryType,
                  icon: ImageIcon,
                  title: "Imagem simples",
                  desc: "Apenas exibe a imagem, sem botão de ação",
                  color: "text-blue-500",
                  bg: "bg-blue-50 dark:bg-blue-950/30",
                  border: "border-blue-200 dark:border-blue-800",
                },
                {
                  type: "product" as StoryType,
                  icon: ShoppingBag,
                  title: "Destacar produto",
                  desc: 'Vincula um produto do cardápio com botão "Ver produto"',
                  color: "text-emerald-500",
                  bg: "bg-emerald-50 dark:bg-emerald-950/30",
                  border: "border-emerald-200 dark:border-emerald-800",
                },
                {
                  type: "promo" as StoryType,
                  icon: Tag,
                  title: "Promoção",
                  desc: "Exibe promoção com título, preço e validade",
                  color: "text-orange-500",
                  bg: "bg-orange-50 dark:bg-orange-950/30",
                  border: "border-orange-200 dark:border-orange-800",
                },
              ].map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => {
                    setStoryType(opt.type);
                    setStep("image");
                  }}
                  className={cn(
                    "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm",
                    opt.border,
                    opt.bg
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      opt.color,
                      "bg-white dark:bg-background shadow-sm"
                    )}
                  >
                    <opt.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {opt.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Selecionar imagem */}
          {step === "image" && (
            <div className="space-y-4">
              {!imagePreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[9/16] max-h-[400px] rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-muted/30 transition-all"
                >
                  <Upload className="h-10 w-10 text-muted-foreground/50" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG ou PNG, máximo 10MB
                    </p>
                  </div>
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-[400px] object-contain rounded-xl bg-black"
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setImageBase64("");
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("type");
                    setImagePreview(null);
                    setImageBase64("");
                  }}
                  className="flex-1"
                >
                  Voltar
                </Button>
                {imagePreview && (
                  <Button
                    onClick={() => setStep("details")}
                    className="flex-1"
                  >
                    {storyType === "simple" ? "Publicar" : "Continuar"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Detalhes (tipo product ou promo) */}
          {step === "details" && (
            <div className="space-y-5">
              {/* Preview da imagem pequena */}
              {imagePreview && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-12 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {storyType === "simple" && "Imagem simples"}
                      {storyType === "product" && "Destacar produto"}
                      {storyType === "promo" && "Promoção"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Imagem selecionada
                    </p>
                  </div>
                  <button
                    onClick={() => setStep("image")}
                    className="text-xs text-primary hover:underline"
                  >
                    Trocar
                  </button>
                </div>
              )}

              {/* Seletor de produto (para tipo product e promo) */}
              {(storyType === "product" || storyType === "promo") && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {storyType === "product"
                      ? "Produto do cardápio *"
                      : "Produto vinculado (opcional)"}
                  </Label>

                  {selectedProduct ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card">
                      {selectedProduct.imageUrl && (
                        <img
                          src={selectedProduct.imageUrl}
                          alt={selectedProduct.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {selectedProduct.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          R${" "}
                          {Number(selectedProduct.price).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedProduct(null)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar produto..."
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowProductList(true);
                          }}
                          onFocus={() => setShowProductList(true)}
                          className="pl-9 pr-8"
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>

                      {showProductList && (
                        <div className="absolute z-50 w-full mt-1 max-h-[200px] overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
                          {filteredProducts.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                              Nenhum produto encontrado
                            </div>
                          ) : (
                            filteredProducts.map((p: any) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setSelectedProduct({
                                    id: p.id,
                                    name: p.name,
                                    price: p.price,
                                    imageUrl: p.imageUrl,
                                  });
                                  setShowProductList(false);
                                  setProductSearch("");
                                }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                              >
                                {p.imageUrl && (
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {p.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    R${" "}
                                    {Number(p.price).toFixed(2).replace(".", ",")}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Campos de promoção */}
              {storyType === "promo" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Título da promoção *
                    </Label>
                    <Input
                      placeholder="Ex: Promoção do dia"
                      value={promoTitle}
                      onChange={(e) => setPromoTitle(e.target.value)}
                      maxLength={120}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Texto curto (opcional)
                    </Label>
                    <Input
                      placeholder="Ex: Pizza grande + refri"
                      value={promoText}
                      onChange={(e) => setPromoText(e.target.value)}
                      maxLength={255}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Preço promocional (opcional)
                    </Label>
                    <Input
                      placeholder="Ex: R$ 59,90"
                      value={promoPrice}
                      onChange={(e) => setPromoPrice(e.target.value)}
                      maxLength={20}
                    />
                  </div>

                  {/* Validade da promoção */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Validade da promoção
                    </Label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPromoHasExpiry(false)}
                        className={cn(
                          "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all",
                          !promoHasExpiry
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        Sem limite
                      </button>
                      <button
                        onClick={() => setPromoHasExpiry(true)}
                        className={cn(
                          "flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-1.5",
                          promoHasExpiry
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Definir horário
                      </button>
                    </div>

                    {promoHasExpiry && (
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={promoExpiryDate}
                          onChange={(e) => setPromoExpiryDate(e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="time"
                          value={promoExpiryTime}
                          onChange={(e) => setPromoExpiryTime(e.target.value)}
                          className="w-28"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Texto do botão de ação */}
              {storyType !== "simple" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Texto do botão
                  </Label>
                  <Input
                    placeholder={
                      storyType === "product" ? "Ver produto" : "Pedir agora"
                    }
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                    maxLength={40}
                  />
                  <p className="text-xs text-muted-foreground">
                    Botão que aparece no story para o cliente
                  </p>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("image")}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={!canPublish || uploading}
                  className="flex-1"
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Publicando...
                    </div>
                  ) : (
                    "Publicar story"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Input file oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
