import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  Copy,
  ChevronRight,
  Package,
  Layers,
  Clock,
  GripVertical,
  UtensilsCrossed,
  ClipboardList,
  PackageOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn, capitalizeFirst, parsePriceInput } from "@/lib/utils";

// Types
interface ComplementItem {
  uniqueId: string;
  name: string;
  description?: string;
  price: string;
  imageUrl?: string | null;
}

type GroupCategory = "ingredientes" | "especificacoes" | "descartaveis";

interface ComplementGroup {
  name: string;
  isRequired: boolean;
  minQuantity: number;
  maxQuantity: number;
  items: ComplementItem[];
  category: GroupCategory;
}

type Step = 1 | 2 | 3;

// Sub-steps for step 2
type Step2Sub = "groups-list" | "group-config" | "group-items" | "copy-group";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: number;
  onSuccess: () => void;
}

export default function CreateProductSheet({ open, onOpenChange, establishmentId, onSuccess }: Props) {
  // Step state
  const [step, setStep] = useState<Step>(1);
  const [step2Sub, setStep2Sub] = useState<Step2Sub>("groups-list");

  // Step 1: Basic info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [status, setStatus] = useState<"active" | "paused">("active");
  const [hasStock, setHasStock] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Complement groups
  const [complementGroups, setComplementGroups] = useState<ComplementGroup[]>([]);
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
  const [activeGroupCategory, setActiveGroupCategory] = useState<GroupCategory | null>(null);
  // Group config form
  const [groupName, setGroupName] = useState("");
  const [groupIsRequired, setGroupIsRequired] = useState(false);
  const [groupMinQty, setGroupMinQty] = useState(0);
  const [groupMaxQty, setGroupMaxQty] = useState(1);
  // New item form
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [uploadingItemImage, setUploadingItemImage] = useState(false);
  const itemFileInputRef = useRef<HTMLInputElement>(null);
  // Copy group
  const [copyProductId, setCopyProductId] = useState<number | null>(null);

  // Step 3: Price & availability
  const [price, setPrice] = useState("");
  const [availabilityType, setAvailabilityType] = useState<"always" | "scheduled">("always");
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [scheduleStartTime, setScheduleStartTime] = useState("08:00");
  const [scheduleEndTime, setScheduleEndTime] = useState("23:00");
  const [printerId, setPrinterId] = useState<string>("none");

  // Queries
  const { data: categories } = trpc.category.list.useQuery(
    { establishmentId },
    { enabled: open && !!establishmentId }
  );

  const { data: printers } = trpc.printer.list.useQuery(
    { establishmentId },
    { enabled: open && !!establishmentId }
  );

  // Products for copy group feature
  const { data: allProducts } = trpc.product.list.useQuery(
    { establishmentId },
    { enabled: open && !!establishmentId && step2Sub === "copy-group" }
  );

  // Complement groups for copy
  const { data: copyGroups } = trpc.complement.listGroups.useQuery(
    { productId: copyProductId! },
    { enabled: !!copyProductId }
  );

  // Mutations
  const uploadMutation = trpc.upload.image.useMutation();

  const createMutation = trpc.product.create.useMutation({
    onSuccess: async (data) => {
      // Save complement groups
      if (complementGroups.length > 0) {
        await saveComplementGroups(data.id);
      }
      toast.success("Produto criado com sucesso!");
      resetState();
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao criar produto");
      console.error(error);
    },
  });

  const createGroupMutation = trpc.complement.createGroup.useMutation();
  const createItemMutation = trpc.complement.createItem.useMutation();

  // Save complement groups after product creation
  const saveComplementGroups = async (productId: number) => {
    try {
      for (const group of complementGroups) {
        const result = await createGroupMutation.mutateAsync({
          productId,
          name: group.name,
          minQuantity: group.minQuantity,
          maxQuantity: group.maxQuantity,
          isRequired: group.isRequired,
        });

        for (let i = 0; i < group.items.length; i++) {
          const item = group.items[i];
          await createItemMutation.mutateAsync({
            groupId: result.id,
            name: item.name,
            price: parsePriceInput(item.price),
            imageUrl: item.imageUrl || null,
            sortOrder: i,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao salvar complementos:", error);
      toast.error("Produto criado, mas houve erro ao salvar complementos");
    }
  };

  // Reset all state
  const resetState = useCallback(() => {
    setStep(1);
    setStep2Sub("groups-list");
    setName("");
    setDescription("");
    setCategoryId("none");
    setStatus("active");
    setHasStock(false);
    setStockQuantity("");
    setImages([]);
    setComplementGroups([]);
    setEditingGroupIndex(null);
    setGroupName("");
    setGroupIsRequired(false);
    setGroupMinQty(0);
    setGroupMaxQty(1);
    setNewItemName("");
    setNewItemDescription("");
    setNewItemPrice("");
    setNewItemImage(null);
    setPrice("");
    setAvailabilityType("always");
    setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
    setScheduleStartTime("08:00");
    setScheduleEndTime("23:00");
    setPrinterId("none");
    setCopyProductId(null);
    setActiveGroupCategory(null);
  }, []);

  useEffect(() => {
    if (!open) resetState();
  }, [open, resetState]);

  // Image upload handler
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate(
        { base64, mimeType: file.type, folder: "products" },
        {
          onSuccess: (data) => {
            setImages(prev => [...prev, data.url]);
            toast.success("Imagem enviada");
          },
          onError: () => toast.error("Erro ao enviar imagem"),
          onSettled: () => setUploading(false),
        }
      );
    };
    reader.onerror = () => {
      toast.error("Erro ao ler arquivo");
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [uploadMutation]);

  // Complement item image upload
  const handleItemImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }
    setUploadingItemImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate(
        { base64, mimeType: file.type, folder: "complements" },
        {
          onSuccess: (data) => {
            setNewItemImage(data.url);
            toast.success("Imagem enviada");
          },
          onError: () => toast.error("Erro ao enviar imagem"),
          onSettled: () => setUploadingItemImage(false),
        }
      );
    };
    reader.onerror = () => {
      toast.error("Erro ao ler arquivo");
      setUploadingItemImage(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [uploadMutation]);

  // Price formatting
  const formatPriceInputLocal = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    const cents = parseInt(numbers || "0", 10);
    const reais = cents / 100;
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Add complement item to current group
  const handleAddItem = () => {
    if (!newItemName.trim()) {
      toast.error("Nome do complemento é obrigatório");
      return;
    }
    const groupIdx = editingGroupIndex ?? complementGroups.length - 1;
    if (groupIdx < 0) return;

    const newItem: ComplementItem = {
      uniqueId: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newItemName.trim(),
      description: newItemDescription.trim() || undefined,
      price: newItemPrice || "0,00",
      imageUrl: newItemImage,
    };

    setComplementGroups(prev => {
      const updated = [...prev];
      updated[groupIdx] = {
        ...updated[groupIdx],
        items: [...updated[groupIdx].items, newItem],
      };
      return updated;
    });

    // Reset item form
    setNewItemName("");
    setNewItemDescription("");
    setNewItemPrice("");
    setNewItemImage(null);
    toast.success("Complemento adicionado");
  };

  // Remove complement item
  const handleRemoveItem = (groupIdx: number, itemIdx: number) => {
    setComplementGroups(prev => {
      const updated = [...prev];
      updated[groupIdx] = {
        ...updated[groupIdx],
        items: updated[groupIdx].items.filter((_, i) => i !== itemIdx),
      };
      return updated;
    });
  };

  // Save group config and go to items
  const handleSaveGroupConfig = () => {
    if (!groupName.trim()) {
      toast.error("Nome do grupo é obrigatório");
      return;
    }

    if (editingGroupIndex !== null) {
      // Update existing group
      setComplementGroups(prev => {
        const updated = [...prev];
        updated[editingGroupIndex] = {
          ...updated[editingGroupIndex],
          name: groupName.trim(),
          isRequired: groupIsRequired,
          minQuantity: groupMinQty,
          maxQuantity: groupMaxQty,
        };
        return updated;
      });
    } else {
      // Create new group
      setComplementGroups(prev => [
        ...prev,
        {
          name: groupName.trim(),
          isRequired: groupIsRequired,
          minQuantity: groupMinQty,
          maxQuantity: groupMaxQty,
          items: [],
          category: activeGroupCategory || "ingredientes",
        },
      ]);
      setEditingGroupIndex(complementGroups.length);
    }

    setStep2Sub("group-items");
  };

  // Finish group and go back to list
  const handleFinishGroup = () => {
    setEditingGroupIndex(null);
    setGroupName("");
    setGroupIsRequired(false);
    setGroupMinQty(0);
    setGroupMaxQty(1);
    setNewItemName("");
    setNewItemDescription("");
    setNewItemPrice("");
    setNewItemImage(null);
    setStep2Sub("groups-list");
  };

  // Start editing a group
  const handleEditGroup = (index: number) => {
    const group = complementGroups[index];
    setEditingGroupIndex(index);
    setGroupName(group.name);
    setGroupIsRequired(group.isRequired);
    setGroupMinQty(group.minQuantity);
    setGroupMaxQty(group.maxQuantity);
    setStep2Sub("group-items");
  };

  // Remove a group
  const handleRemoveGroup = (index: number) => {
    setComplementGroups(prev => prev.filter((_, i) => i !== index));
  };

  // Copy groups from another product
  const handleCopyGroups = () => {
    if (!copyGroups || copyGroups.length === 0) {
      toast.error("Nenhum grupo de complemento encontrado neste produto");
      return;
    }

    const copied: ComplementGroup[] = copyGroups.map((g: any) => ({
      name: g.name,
      isRequired: g.isRequired,
      minQuantity: g.minQuantity,
      maxQuantity: g.maxQuantity,
      items: (g.items || []).map((item: any) => ({
        uniqueId: `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        price: parseFloat(String(item.price || "0")).toFixed(2).replace('.', ','),
        imageUrl: item.imageUrl || null,
      })),
      category: activeGroupCategory || "ingredientes",
    }));

    setComplementGroups(prev => [...prev, ...copied]);
    setCopyProductId(null);
    setStep2Sub("groups-list");
    toast.success(`${copied.length} grupo(s) copiado(s)`);
  };

  // Submit product
  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Nome do produto é obrigatório");
      setStep(1);
      return;
    }
    if (!price || parsePriceInput(price) === "0") {
      toast.error("Defina o preço do produto");
      return;
    }

    createMutation.mutate({
      establishmentId,
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId: categoryId && categoryId !== "none" ? Number(categoryId) : null,
      price: parsePriceInput(price),
      images: images.length > 0 ? images : [],
      status,
      hasStock,
      stockQuantity: stockQuantity ? Number(stockQuantity) : null,
      printerId: printerId && printerId !== "none" ? Number(printerId) : null,
    });
  };

  const stepTitles = ["Informações", "Complementos", "Preço e Disponibilidade"];

  // ============ RENDER STEP 1: Basic Info ============
  const renderStep1 = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Novo Produto</h2>
              <p className="text-sm text-white/80">Passo 1 de 3 — Informações básicas</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="flex gap-1.5 mt-3">
          <div className="flex-1 h-1 rounded-full bg-white" />
          <div className="flex-1 h-1 rounded-full bg-white/30" />
          <div className="flex-1 h-1 rounded-full bg-white/30" />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-card">
        {/* Product image */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Imagem do produto</Label>
          <div className="flex items-center gap-3">
            {images.length > 0 ? (
              <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-border/50 group">
                <img src={images[0]} alt="Produto" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages([])}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="h-20 w-20 rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-all"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground">Adicionar</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {images.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-lg text-xs h-8"
              >
                {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ImagePlus className="h-3 w-3 mr-1" />}
                Trocar
              </Button>
            )}
          </div>
        </div>

        {/* Name */}
        <div>
          <Label className="text-sm font-semibold">Nome do produto *</Label>
          <Input
            value={name}
            onChange={(e) => setName(capitalizeFirst(e.target.value))}
            placeholder="Ex: X-Burger Especial"
            className="mt-1.5 h-10 rounded-xl border-border/50"
          />
        </div>

        {/* Description */}
        <div>
          <Label className="text-sm font-semibold">Descrição</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(capitalizeFirst(e.target.value))}
            placeholder="Descreva os ingredientes e características"
            rows={2}
            className="mt-1.5 rounded-xl border-border/50 resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <Label className="text-sm font-semibold">Categoria</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="mt-1.5 h-10 rounded-xl border-border/50">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="none" className="rounded-lg text-muted-foreground">
                Sem categoria
              </SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)} className="rounded-lg">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
          <div>
            <Label className="text-sm font-semibold">Status</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Produtos pausados não aparecem no cardápio
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-md",
              status === "active"
                ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30"
                : "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30"
            )}>
              {status === "active" ? "Ativo" : "Pausado"}
            </span>
            <Switch
              checked={status === "active"}
              onCheckedChange={(checked) => setStatus(checked ? "active" : "paused")}
            />
          </div>
        </div>

        {/* Stock */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
            <div>
              <Label className="text-sm font-semibold">Controle de estoque</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ative para controlar quantidade disponível
              </p>
            </div>
            <Switch checked={hasStock} onCheckedChange={setHasStock} />
          </div>
          {hasStock && (
            <div className="pl-3">
              <Label className="text-sm font-semibold">Quantidade em estoque</Label>
              <Input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="0"
                className="mt-1.5 h-10 rounded-xl border-border/50 w-32"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-card">
        <Button
          onClick={() => {
            if (!name.trim()) {
              toast.error("Nome do produto é obrigatório");
              return;
            }
            setStep(2);
          }}
          className="w-full rounded-xl h-11"
          style={{ backgroundColor: '#db262f', color: 'white' }}
        >
          Avançar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  // ============ RENDER STEP 2: Complement Groups ============
  const renderStep2 = () => {
    // Sub-step: Groups list
    if (step2Sub === "groups-list") {
      return (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Complementos</h2>
                  <p className="text-sm text-white/80">Passo 2 de 3 — Grupos de complementos</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="flex gap-1.5 mt-3">
              <div className="flex-1 h-1 rounded-full bg-white" />
              <div className="flex-1 h-1 rounded-full bg-white" />
              <div className="flex-1 h-1 rounded-full bg-white/30" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card">
            {/* Category tabs when no category is selected */}
            {!activeGroupCategory ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center mb-2">
                  Escolha o tipo de complemento que deseja adicionar
                </p>

                {/* Ingredientes */}
                <button
                  onClick={() => setActiveGroupCategory("ingredientes")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-all group"
                >
                  <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-950/30 group-hover:bg-orange-200 dark:group-hover:bg-orange-950/50 transition-colors">
                    <UtensilsCrossed className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold text-sm">Ingredientes</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Adicionais, molhos, acompanhamentos e extras
                    </p>
                  </div>
                  {complementGroups.filter(g => g.category === "ingredientes").length > 0 && (
                    <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 px-2 py-0.5 rounded-full">
                      {complementGroups.filter(g => g.category === "ingredientes").length}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>

                {/* Especificações */}
                <button
                  onClick={() => setActiveGroupCategory("especificacoes")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-all group"
                >
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-950/50 transition-colors">
                    <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold text-sm">Especificações</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Perguntas sobre preparo, tamanho, ponto, etc.
                    </p>
                  </div>
                  {complementGroups.filter(g => g.category === "especificacoes").length > 0 && (
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      {complementGroups.filter(g => g.category === "especificacoes").length}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>

                {/* Descartáveis */}
                <button
                  onClick={() => setActiveGroupCategory("descartaveis")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-all group"
                >
                  <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-950/50 transition-colors">
                    <PackageOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold text-sm">Descartáveis</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Embalagens, talheres, guardanapos, etc.
                    </p>
                  </div>
                  {complementGroups.filter(g => g.category === "descartaveis").length > 0 && (
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      {complementGroups.filter(g => g.category === "descartaveis").length}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>

                {/* Summary of all groups */}
                {complementGroups.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {complementGroups.length} grupo(s) adicionado(s) no total
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Category selected - show groups for this category */
              <>
                {/* Groups for this category */}
                {complementGroups.filter(g => g.category === activeGroupCategory).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-4 bg-muted/30 rounded-2xl inline-block mb-3">
                      <Layers className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Nenhum grupo adicionado
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeGroupCategory === "ingredientes" && 'Adicione grupos como "Adicionais", "Molhos", etc.'}
                      {activeGroupCategory === "especificacoes" && 'Adicione perguntas como "Ponto da carne", "Tamanho", etc.'}
                      {activeGroupCategory === "descartaveis" && 'Adicione grupos como "Embalagens", "Talheres", etc.'}
                    </p>
                  </div>
                ) : (
                  complementGroups.map((group, idx) => {
                    if (group.category !== activeGroupCategory) return null;
                    return (
                      <div
                        key={idx}
                        className="border border-border/50 rounded-xl p-3 bg-muted/20 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{group.name}</span>
                            {group.isRequired && (
                              <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">
                                Obrigatório
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditGroup(idx)}
                              className="h-7 w-7 rounded-lg"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveGroup(idx)}
                              className="h-7 w-7 rounded-lg hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {group.items.length} {group.items.length === 1 ? "item" : "itens"} • Mín: {group.minQuantity} / Máx: {group.maxQuantity}
                        </p>
                        {group.items.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {group.items.slice(0, 5).map((item, i) => (
                              <span key={i} className="text-[10px] bg-card px-2 py-0.5 rounded-md border border-border/50">
                                {item.name}
                              </span>
                            ))}
                            {group.items.length > 5 && (
                              <span className="text-[10px] text-muted-foreground px-1">
                                +{group.items.length - 5} mais
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Action buttons */}
                <div className="space-y-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingGroupIndex(null);
                      setGroupName("");
                      setGroupIsRequired(false);
                      setGroupMinQty(0);
                      setGroupMaxQty(1);
                      setStep2Sub("group-config");
                    }}
                    className="w-full rounded-xl h-10 border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar novo grupo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCopyProductId(null);
                      setStep2Sub("copy-group");
                    }}
                    className="w-full rounded-xl h-10 border-dashed"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar grupo existente
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-card">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (activeGroupCategory) {
                    setActiveGroupCategory(null);
                  } else {
                    setStep(1);
                  }
                }}
                className="flex-1 rounded-xl h-11"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1 rounded-xl h-11"
                style={{ backgroundColor: '#db262f', color: 'white' }}
              >
                Avançar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Sub-step: Group config
    if (step2Sub === "group-config") {
      return (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Configurar grupo</h2>
                  <p className="text-sm text-white/80">
                    {activeGroupCategory === "ingredientes" && "Ingredientes — "}
                    {activeGroupCategory === "especificacoes" && "Especificações — "}
                    {activeGroupCategory === "descartaveis" && "Descartáveis — "}
                    Defina as regras do grupo
                  </p>
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-card">
            <div>
              <Label className="text-sm font-semibold">Nome do grupo *</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(capitalizeFirst(e.target.value))}
                placeholder={
                  activeGroupCategory === "ingredientes"
                    ? "Ex: Adicionais, Molhos, Extras..."
                    : activeGroupCategory === "especificacoes"
                    ? "Ex: Ponto da carne, Tamanho, Tipo de pão..."
                    : activeGroupCategory === "descartaveis"
                    ? "Ex: Deseja descartáveis?, Talheres, Guardanapos..."
                    : "Ex: Adicionais, Molhos, Tamanho..."
                }
                className="mt-1.5 h-10 rounded-xl border-border/50"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div>
                <Label className="text-sm font-semibold">Obrigatório</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  O cliente precisa escolher ao menos uma opção
                </p>
              </div>
              <Switch checked={groupIsRequired} onCheckedChange={setGroupIsRequired} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Quantidade mínima</Label>
                <Input
                  type="number"
                  min="0"
                  value={groupMinQty || ""}
                  onChange={(e) => setGroupMinQty(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="mt-1.5 h-10 rounded-xl border-border/50"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Quantidade máxima</Label>
                <Input
                  type="number"
                  min="1"
                  value={groupMaxQty || ""}
                  onChange={(e) => setGroupMaxQty(parseInt(e.target.value) || 1)}
                  placeholder="1"
                  className="mt-1.5 h-10 rounded-xl border-border/50"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-card">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep2Sub("groups-list")}
                className="flex-1 rounded-xl h-11"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleSaveGroupConfig}
                disabled={!groupName.trim()}
                className="flex-1 rounded-xl h-11"
                style={{ backgroundColor: '#db262f', color: 'white' }}
              >
                Avançar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Sub-step: Group items
    if (step2Sub === "group-items") {
      const groupIdx = editingGroupIndex ?? complementGroups.length - 1;
      const currentGroup = complementGroups[groupIdx];

      return (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{currentGroup?.name || "Grupo"}</h2>
                  <p className="text-sm text-white/80">Adicione os complementos</p>
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card">
            {/* New item form */}
            <div className="border border-border/50 rounded-xl p-4 bg-muted/10 space-y-3">
              <h4 className="text-sm font-semibold">Novo complemento</h4>

              <div className="flex items-center gap-3">
                {/* Item image */}
                <button
                  type="button"
                  onClick={() => itemFileInputRef.current?.click()}
                  disabled={uploadingItemImage}
                  className={cn(
                    "h-14 w-14 rounded-xl border-2 border-dashed flex items-center justify-center flex-shrink-0 transition-colors",
                    newItemImage
                      ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                      : "border-muted-foreground/20 hover:border-primary hover:bg-primary/5"
                  )}
                >
                  {uploadingItemImage ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : newItemImage ? (
                    <img src={newItemImage} alt="" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <ImagePlus className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <input
                  ref={itemFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleItemImageUpload}
                  className="hidden"
                />

                <div className="flex-1 space-y-2">
                  <Input
                    value={newItemName}
                    onChange={(e) => setNewItemName(capitalizeFirst(e.target.value))}
                    placeholder="Nome do complemento *"
                    className="h-9 rounded-lg border-border/50 text-sm"
                  />
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">R$</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(formatPriceInputLocal(e.target.value))}
                      placeholder="0,00"
                      className="h-9 rounded-lg border-border/50 text-sm pl-8 text-right"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAddItem}
                disabled={!newItemName.trim()}
                variant="outline"
                className="w-full rounded-xl h-9 text-sm border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Adicionar ao grupo
              </Button>
            </div>

            {/* Items list */}
            {currentGroup && currentGroup.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Itens adicionados ({currentGroup.items.length})
                </h4>
                {currentGroup.items.map((item, itemIdx) => (
                  <div
                    key={item.uniqueId}
                    className="flex items-center gap-3 p-2.5 bg-card rounded-xl border border-border/50"
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {parseFloat(item.price.replace(',', '.') || "0").toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(groupIdx, itemIdx)}
                      className="h-8 w-8 rounded-lg hover:bg-destructive/10 flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-card">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep2Sub("group-config")}
                className="flex-1 rounded-xl h-11"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleFinishGroup}
                className="flex-1 rounded-xl h-11"
                style={{ backgroundColor: '#db262f', color: 'white' }}
              >
                <Check className="h-4 w-4 mr-2" />
                Concluir grupo
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Sub-step: Copy group
    if (step2Sub === "copy-group") {
      const productsList = allProducts && 'products' in allProducts ? allProducts.products : (allProducts || []) as any[];
      const productsWithComplements = productsList.filter(
        (p: any) => p.complementCount > 0 && !p.isCombo
      );

      return (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Copy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Copiar grupo</h2>
                  <p className="text-sm text-white/80">Selecione um produto para copiar</p>
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-card">
            {productsWithComplements.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground">
                  Nenhum produto com complementos encontrado
                </p>
              </div>
            ) : (
              productsWithComplements.map((product: any) => (
                <div
                  key={product.id}
                  onClick={() => setCopyProductId(product.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                    copyProductId === product.id
                      ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                      : "bg-card border-border/50 hover:bg-muted/50"
                  )}
                >
                  <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.images && (product.images as string[]).length > 0 ? (
                      <img src={(product.images as string[])[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.complementCount} complemento(s)
                    </p>
                  </div>
                  {copyProductId === product.id && (
                    <Check className="h-5 w-5 text-red-500 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-card">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setCopyProductId(null); setStep2Sub("groups-list"); }}
                className="flex-1 rounded-xl h-11"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleCopyGroups}
                disabled={!copyProductId || !copyGroups}
                className="flex-1 rounded-xl h-11"
                style={{ backgroundColor: '#db262f', color: 'white' }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar complementos
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // ============ RENDER STEP 3: Price & Availability ============
  const renderStep3 = () => {
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Finalizar</h2>
                <p className="text-sm text-white/80">Passo 3 de 3 — Preço e disponibilidade</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          <div className="flex gap-1.5 mt-3">
            <div className="flex-1 h-1 rounded-full bg-white" />
            <div className="flex-1 h-1 rounded-full bg-white" />
            <div className="flex-1 h-1 rounded-full bg-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-card">
          {/* Price */}
          <div>
            <Label className="text-sm font-semibold">Preço do produto *</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
              <Input
                type="text"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(formatPriceInputLocal(e.target.value))}
                placeholder="0,00"
                className="h-12 text-lg rounded-xl border-border/50 pl-10 font-semibold"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Se o item não é vendido individualmente, deixe R$ 0,00
            </p>
          </div>

          {/* Printer/Sector */}
          {printers && printers.length > 0 && (
            <div>
              <Label className="text-sm font-semibold">Setor de Preparo (Impressora)</Label>
              <Select value={printerId} onValueChange={setPrinterId}>
                <SelectTrigger className="mt-1.5 h-10 rounded-xl border-border/50">
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none" className="rounded-lg text-muted-foreground">
                    Todas as impressoras
                  </SelectItem>
                  {printers.map((printer: any) => (
                    <SelectItem key={printer.id} value={String(printer.id)} className="rounded-lg">
                      {printer.name} ({printer.ipAddress})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Availability */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Disponibilidade</Label>

            <div className="space-y-2">
              <div
                onClick={() => setAvailabilityType("always")}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all",
                  availabilityType === "always"
                    ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                    : "bg-card border-border/50 hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  availabilityType === "always" ? "border-red-500" : "border-muted-foreground/30"
                )}>
                  {availabilityType === "always" && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium">Sempre disponível</p>
                  <p className="text-xs text-muted-foreground">Disponível em todos os horários</p>
                </div>
              </div>

              <div
                onClick={() => setAvailabilityType("scheduled")}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all",
                  availabilityType === "scheduled"
                    ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                    : "bg-card border-border/50 hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  availabilityType === "scheduled" ? "border-red-500" : "border-muted-foreground/30"
                )}>
                  {availabilityType === "scheduled" && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium">Dias e horários específicos</p>
                  <p className="text-xs text-muted-foreground">Defina quando o produto fica disponível</p>
                </div>
              </div>
            </div>

            {availabilityType === "scheduled" && (
              <div className="space-y-4 pt-2 pl-2">
                {/* Days */}
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Dias da semana</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {dayNames.map((day, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setScheduleDays(prev =>
                            prev.includes(idx)
                              ? prev.filter(d => d !== idx)
                              : [...prev, idx]
                          );
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                          scheduleDays.includes(idx)
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-card text-muted-foreground border-border/50 hover:bg-muted/50"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Início</Label>
                    <Input
                      type="time"
                      value={scheduleStartTime}
                      onChange={(e) => setScheduleStartTime(e.target.value)}
                      className="mt-1 h-10 rounded-xl border-border/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Fim</Label>
                    <Input
                      type="time"
                      value={scheduleEndTime}
                      onChange={(e) => setScheduleEndTime(e.target.value)}
                      className="mt-1 h-10 rounded-xl border-border/50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="border border-border/50 rounded-xl p-4 bg-muted/10 space-y-2">
            <h4 className="text-sm font-semibold">Resumo do produto</h4>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium">{name || "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Categoria</span>
                <span className="font-medium">
                  {categoryId !== "none" ? categories?.find(c => String(c.id) === categoryId)?.name || "—" : "Sem categoria"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Preço</span>
                <span className="font-medium">R$ {price || "0,00"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Complementos</span>
                <span className="font-medium">{complementGroups.length} grupo(s)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Status</span>
                <span className={cn(
                  "font-medium",
                  status === "active" ? "text-emerald-600" : "text-amber-600"
                )}>
                  {status === "active" ? "Ativo" : "Pausado"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-card">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="flex-1 rounded-xl h-11"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !price}
              className="flex-1 rounded-xl h-11"
              style={{ backgroundColor: '#db262f', color: 'white' }}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Criar produto
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] !p-0 !gap-0 !h-dvh" hideCloseButton>
        <SheetTitle className="sr-only">Criar produto</SheetTitle>
        <SheetDescription className="sr-only">Crie um novo produto para o cardápio</SheetDescription>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </SheetContent>
    </Sheet>
  );
}
