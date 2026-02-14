import { useState, useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { capitalizeFirst, parsePriceInput } from "@/lib/utils";
import { toast } from "sonner";
import {
  X,
  Layers,
  UtensilsCrossed,
  ClipboardList,
  PackageOpen,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  ImagePlus,
  Loader2,
} from "lucide-react";

type CategoryType = "ingredientes" | "especificacoes" | "descartaveis";
type SubStep = "categories" | "group-config" | "group-items";

interface ComplementItem {
  uniqueId: string;
  name: string;
  price: string;
  imageUrl?: string | null;
}

interface AddGroupSheetProps {
  productId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: () => void;
}

export default function AddGroupSheet({
  productId,
  open,
  onOpenChange,
  onGroupCreated,
}: AddGroupSheetProps) {
  const utils = trpc.useUtils();

  // State
  const [subStep, setSubStep] = useState<SubStep>("categories");
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupIsRequired, setGroupIsRequired] = useState(false);
  const [groupMinQty, setGroupMinQty] = useState(0);
  const [groupMaxQty, setGroupMaxQty] = useState(4);
  const [items, setItems] = useState<ComplementItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [uploadingItemImage, setUploadingItemImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const itemFileInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const createGroupMutation = trpc.complement.createGroup.useMutation();
  const createItemMutation = trpc.complement.createItem.useMutation();

  // Price formatting
  const formatPriceInputLocal = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    const cents = parseInt(numbers || "0", 10);
    const reais = cents / 100;
    return reais.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Reset state
  const resetState = useCallback(() => {
    setSubStep("categories");
    setCategory(null);
    setGroupName("");
    setGroupIsRequired(false);
    setGroupMinQty(0);
    setGroupMaxQty(4);
    setItems([]);
    setNewItemName("");
    setNewItemPrice("");
    setNewItemImage(null);
  }, []);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetState, 300);
  };

  const handleSelectCategory = (cat: CategoryType) => {
    setCategory(cat);
    setSubStep("group-config");
  };

  const handleSaveGroupConfig = () => {
    if (!groupName.trim()) {
      toast.error("Nome do grupo é obrigatório");
      return;
    }
    setSubStep("group-items");
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      toast.error("Nome do complemento é obrigatório");
      return;
    }
    const item: ComplementItem = {
      uniqueId: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newItemName.trim(),
      price: newItemPrice || "0,00",
      imageUrl: newItemImage,
    };
    setItems((prev) => [...prev, item]);
    setNewItemName("");
    setNewItemPrice("");
    setNewItemImage(null);
  };

  const handleRemoveItem = (uniqueId: string) => {
    setItems((prev) => prev.filter((i) => i.uniqueId !== uniqueId));
  };

  const handleItemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingItemImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setNewItemImage(data.url);
      }
    } catch {
      toast.error("Erro ao fazer upload da imagem");
    } finally {
      setUploadingItemImage(false);
    }
  };

  const handleFinish = async () => {
    if (items.length === 0) {
      toast.error("Adicione pelo menos um complemento ao grupo");
      return;
    }
    setIsSaving(true);
    try {
      // Create group
      const result = await createGroupMutation.mutateAsync({
        productId,
        name: groupName.trim(),
        minQuantity: groupMinQty,
        maxQuantity: groupMaxQty,
        isRequired: groupIsRequired,
      });

      // Create items
      for (let i = 0; i < items.length; i++) {
        await createItemMutation.mutateAsync({
          groupId: result.id,
          name: items[i].name,
          price: parsePriceInput(items[i].price),
          imageUrl: items[i].imageUrl || null,
          sortOrder: i,
        });
      }

      // Invalidate queries
      utils.complement.listGroups.invalidate();
      utils.product.list.invalidate();

      toast.success(`Grupo "${groupName}" criado com ${items.length} complemento(s)`);
      onGroupCreated();
      handleClose();
    } catch {
      toast.error("Erro ao criar grupo de complementos");
    } finally {
      setIsSaving(false);
    }
  };

  // ---- Render: Categories ----
  const renderCategories = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Grupo de complementos</h2>
              <p className="text-sm text-white/80">Escolha o tipo de complemento</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-card">
        <p className="text-sm text-muted-foreground text-center mb-2">
          Escolha o tipo de complemento que deseja adicionar
        </p>

        {/* Ingredientes */}
        <button
          onClick={() => handleSelectCategory("ingredientes")}
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
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>

        {/* Especificações */}
        <button
          onClick={() => handleSelectCategory("especificacoes")}
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
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>

        {/* Descartáveis */}
        <button
          onClick={() => handleSelectCategory("descartaveis")}
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
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-card">
        <Button
          variant="outline"
          onClick={handleClose}
          className="w-full rounded-xl h-11"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );

  // ---- Render: Group Config ----
  const renderGroupConfig = () => (
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
                {category === "ingredientes" && "Ingredientes — "}
                {category === "especificacoes" && "Especificações — "}
                {category === "descartaveis" && "Descartáveis — "}
                Defina as regras do grupo
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
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
              category === "ingredientes"
                ? "Ex: Adicionais, Molhos, Extras..."
                : category === "especificacoes"
                ? "Ex: Ponto da carne, Tamanho, Tipo de pão..."
                : category === "descartaveis"
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
            onClick={() => {
              setCategory(null);
              setSubStep("categories");
            }}
            className="flex-1 rounded-xl h-11"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={handleSaveGroupConfig}
            disabled={!groupName.trim()}
            className="flex-1 rounded-xl h-11"
            style={{ backgroundColor: "#db262f", color: "white" }}
          >
            Avançar
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  // ---- Render: Group Items ----
  const renderGroupItems = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-red-500 to-red-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{groupName || "Grupo"}</h2>
              <p className="text-sm text-white/80">Adicione os complementos</p>
            </div>
          </div>
          <button
            onClick={handleClose}
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
              className="h-14 w-14 rounded-xl border-2 border-dashed flex items-center justify-center flex-shrink-0 transition-colors border-muted-foreground/20 hover:border-primary hover:bg-primary/5"
            >
              {uploadingItemImage ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : newItemImage ? (
                <img
                  src={newItemImage}
                  alt=""
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <input
              ref={itemFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleItemImageUpload}
            />

            <div className="flex-1 space-y-2">
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(capitalizeFirst(e.target.value))}
                placeholder="Nome do complemento"
                className="h-9 rounded-lg border-border/50 text-sm"
              />
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                  R$
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={newItemPrice}
                  onChange={(e) =>
                    setNewItemPrice(formatPriceInputLocal(e.target.value))
                  }
                  placeholder="0,00"
                  className="h-9 rounded-lg border-border/50 text-sm pl-8 text-right"
                />
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleAddItem}
              disabled={!newItemName.trim()}
              className="h-9 rounded-lg"
              style={{ backgroundColor: "#db262f", color: "white" }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              {items.length} complemento(s) adicionado(s)
            </h4>
            {items.map((item) => (
              <div
                key={item.uniqueId}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/10"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                    <ImagePlus className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    R${" "}
                    {parseFloat(item.price.replace(",", ".") || "0")
                      .toFixed(2)
                      .replace(".", ",")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveItem(item.uniqueId)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum complemento adicionado ainda</p>
            <p className="text-xs mt-1">
              Use o formulário acima para adicionar complementos
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-card">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setSubStep("group-config")}
            className="flex-1 rounded-xl h-11"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={handleFinish}
            disabled={items.length === 0 || isSaving}
            className="flex-1 rounded-xl h-11"
            style={{ backgroundColor: "#db262f", color: "white" }}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                Concluir
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col [&>button]:hidden"
      >
        <VisuallyHidden><SheetTitle>Grupo de complementos</SheetTitle></VisuallyHidden>
        {subStep === "categories" && renderCategories()}
        {subStep === "group-config" && renderGroupConfig()}
        {subStep === "group-items" && renderGroupItems()}
      </SheetContent>
    </Sheet>
  );
}
