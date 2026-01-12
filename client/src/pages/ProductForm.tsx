import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, SectionCard, StatusBadge } from "@/components/shared";
import { trpc } from "@/lib/trpc";
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
  ArrowLeft,
  Save,
  ImagePlus,
  X,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ComplementGroup {
  id?: number;
  name: string;
  minQuantity: number;
  maxQuantity: number;
  isRequired: boolean;
  items: ComplementItem[];
}

interface ComplementItem {
  id?: number;
  name: string;
  price: string;
}

export default function ProductForm() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const isEditing = !!params.id;

  const { data: establishment } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "paused">("active");
  const [hasStock, setHasStock] = useState(true);
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [prepTime, setPrepTime] = useState<string>("");
  const [complementGroups, setComplementGroups] = useState<ComplementGroup[]>([]);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // Fetch categories
  const { data: categories } = trpc.category.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  // Fetch product if editing
  const { data: product, isLoading: productLoading } = trpc.product.get.useQuery(
    { id: Number(params.id) },
    { enabled: isEditing && !!params.id }
  );

  // Fetch complement groups if editing
  const { data: existingGroups } = trpc.complement.listGroups.useQuery(
    { productId: Number(params.id) },
    { enabled: isEditing && !!params.id }
  );

  // Load product data when editing
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setCategoryId(product.categoryId ? String(product.categoryId) : "");
      setPrice(String(product.price));
      setImages(product.images || []);
      setStatus(product.status === "archived" ? "paused" : product.status);
      setHasStock(product.hasStock);
      setStockQuantity(product.stockQuantity ? String(product.stockQuantity) : "");
      setPrepTime(product.prepTime ? String(product.prepTime) : "");
    }
  }, [product]);

  // Mutations
  const createMutation = trpc.product.create.useMutation({
    onSuccess: () => {
      toast.success("Produto criado com sucesso");
      navigate("/catalogo");
    },
    onError: (error) => {
      toast.error("Erro ao criar produto");
      console.error(error);
    },
  });

  const updateMutation = trpc.product.update.useMutation({
    onSuccess: () => {
      toast.success("Produto atualizado com sucesso");
      navigate("/catalogo");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar produto");
      console.error(error);
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!price || Number(price) < 0) {
      newErrors.price = "Preço inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !establishmentId) return;

    const productData = {
      establishmentId,
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId: categoryId ? Number(categoryId) : null,
      price,
      images: images.length > 0 ? images : undefined,
      status,
      hasStock,
      stockQuantity: stockQuantity ? Number(stockQuantity) : null,
      prepTime: prepTime ? Number(prepTime) : null,
    };

    if (isEditing) {
      updateMutation.mutate({ id: Number(params.id), ...productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  const handleImageAdd = () => {
    const url = prompt("Digite a URL da imagem:");
    if (url && url.trim()) {
      setImages([...images, url.trim()]);
    }
  };

  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addComplementGroup = () => {
    setComplementGroups([
      ...complementGroups,
      {
        name: "",
        minQuantity: 0,
        maxQuantity: 1,
        isRequired: false,
        items: [],
      },
    ]);
  };

  const updateComplementGroup = (index: number, updates: Partial<ComplementGroup>) => {
    const newGroups = [...complementGroups];
    newGroups[index] = { ...newGroups[index], ...updates };
    setComplementGroups(newGroups);
  };

  const removeComplementGroup = (index: number) => {
    setComplementGroups(complementGroups.filter((_, i) => i !== index));
  };

  const addComplementItem = (groupIndex: number) => {
    const newGroups = [...complementGroups];
    newGroups[groupIndex].items.push({ name: "", price: "0" });
    setComplementGroups(newGroups);
  };

  const updateComplementItem = (
    groupIndex: number,
    itemIndex: number,
    updates: Partial<ComplementItem>
  ) => {
    const newGroups = [...complementGroups];
    newGroups[groupIndex].items[itemIndex] = {
      ...newGroups[groupIndex].items[itemIndex],
      ...updates,
    };
    setComplementGroups(newGroups);
  };

  const removeComplementItem = (groupIndex: number, itemIndex: number) => {
    const newGroups = [...complementGroups];
    newGroups[groupIndex].items = newGroups[groupIndex].items.filter(
      (_, i) => i !== itemIndex
    );
    setComplementGroups(newGroups);
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && productLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate("/catalogo")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isEditing ? "Editar Produto" : "Novo Produto"}
              </h1>
              <p className="text-muted-foreground">
                {isEditing ? "Atualize as informações do produto" : "Preencha as informações do produto"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <SectionCard title="Informações Básicas">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do produto *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: X-Burger Especial"
                    className={cn(errors.name && "border-destructive")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva os ingredientes e características do produto"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="price">Preço *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0,00"
                      className={cn(errors.price && "border-destructive")}
                    />
                    {errors.price && (
                      <p className="text-sm text-destructive mt-1">{errors.price}</p>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Images */}
            <SectionCard title="Imagens">
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
                    >
                      <img
                        src={img}
                        alt={`Imagem ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleImageAdd}
                    className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Adicionar</span>
                  </button>
                </div>
              </div>
            </SectionCard>

            {/* Stock & Availability */}
            <SectionCard title="Disponibilidade">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Status do produto</Label>
                    <p className="text-sm text-muted-foreground">
                      Produtos pausados não aparecem no cardápio
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-medium",
                      status === "active" ? "text-green-600" : "text-muted-foreground"
                    )}>
                      {status === "active" ? "Ativo" : "Pausado"}
                    </span>
                    <Switch
                      checked={status === "active"}
                      onCheckedChange={(checked) => setStatus(checked ? "active" : "paused")}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Controle de estoque</Label>
                    <p className="text-sm text-muted-foreground">
                      Ative para controlar a quantidade disponível
                    </p>
                  </div>
                  <Switch
                    checked={!hasStock}
                    onCheckedChange={(checked) => setHasStock(!checked)}
                  />
                </div>

                {!hasStock && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <Label htmlFor="stockQuantity">Quantidade em estoque</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        min="0"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="prepTime">Tempo de preparo (minutos)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    min="0"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    placeholder="Ex: 30"
                    className="max-w-[200px]"
                  />
                </div>
              </div>
            </SectionCard>

            {/* Complements */}
            <SectionCard 
              title="Complementos / Adicionais"
              description="Configure opções extras para o produto"
              actions={
                <Button type="button" variant="outline" size="sm" onClick={addComplementGroup}>
                  <Plus className="h-4 w-4 mr-1" />
                  Grupo
                </Button>
              }
            >
              {complementGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum grupo de complementos adicionado
                </p>
              ) : (
                <div className="space-y-4">
                  {complementGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 space-y-3">
                          <Input
                            value={group.name}
                            onChange={(e) =>
                              updateComplementGroup(groupIndex, { name: e.target.value })
                            }
                            placeholder="Nome do grupo (ex: Adicionais)"
                          />
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Mín:</Label>
                              <Input
                                type="number"
                                min="0"
                                value={group.minQuantity}
                                onChange={(e) =>
                                  updateComplementGroup(groupIndex, {
                                    minQuantity: Number(e.target.value),
                                  })
                                }
                                className="w-16 h-8"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Máx:</Label>
                              <Input
                                type="number"
                                min="1"
                                value={group.maxQuantity}
                                onChange={(e) =>
                                  updateComplementGroup(groupIndex, {
                                    maxQuantity: Number(e.target.value),
                                  })
                                }
                                className="w-16 h-8"
                              />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={group.isRequired}
                                onChange={(e) =>
                                  updateComplementGroup(groupIndex, {
                                    isRequired: e.target.checked,
                                  })
                                }
                                className="rounded"
                              />
                              Obrigatório
                            </label>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeComplementGroup(groupIndex)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {group.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <Input
                              value={item.name}
                              onChange={(e) =>
                                updateComplementItem(groupIndex, itemIndex, {
                                  name: e.target.value,
                                })
                              }
                              placeholder="Nome do item"
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.price}
                              onChange={(e) =>
                                updateComplementItem(groupIndex, itemIndex, {
                                  price: e.target.value,
                                })
                              }
                              placeholder="Preço"
                              className="w-24"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeComplementItem(groupIndex, itemIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addComplementItem(groupIndex)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar item
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <SectionCard title="Preview">
                <div className="border rounded-lg overflow-hidden">
                  {/* Product Image */}
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {images.length > 0 ? (
                      <img
                        src={images[0]}
                        alt={name || "Produto"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold">
                        {name || "Nome do produto"}
                      </h4>
                      <StatusBadge variant={status === "active" ? "success" : "warning"}>
                        {status === "active" ? "Ativo" : "Pausado"}
                      </StatusBadge>
                    </div>
                    {description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {description}
                      </p>
                    )}
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(price)}
                    </p>
                    {prepTime && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tempo de preparo: {prepTime} min
                      </p>
                    )}
                  </div>
                </div>
              </SectionCard>

              {/* Save Button */}
              <div className="mt-4">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isPending ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Produto"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
