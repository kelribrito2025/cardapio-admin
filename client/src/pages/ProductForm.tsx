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
import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { cn, capitalizeFirst, formatPriceInput, parsePriceInput } from "@/lib/utils";

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

  const { data: establishment, isLoading: establishmentLoading } = trpc.establishment.get.useQuery();
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "paused">("active");
  const [hasStock, setHasStock] = useState(true);
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [complementGroups, setComplementGroups] = useState<ComplementGroup[]>([]);

  // Preview selections state - para simular seleção do cliente
  const [previewSelections, setPreviewSelections] = useState<Record<number, number[]>>({});

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Image upload
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (establishment) {
      setEstablishmentId(establishment.id);
    }
  }, [establishment]);

  // All hooks MUST be called before any early return
  const { data: categories } = trpc.category.list.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId }
  );

  const { data: product, isLoading: productLoading } = trpc.product.get.useQuery(
    { id: Number(params.id) },
    { enabled: isEditing && !!params.id }
  );

  const { data: existingGroups } = trpc.complement.listGroups.useQuery(
    { productId: Number(params.id) },
    { enabled: isEditing && !!params.id }
  );

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
    onSuccess: async (_, variables) => {
      // Salvar complementos após atualizar o produto
      await saveComplementGroups(variables.id);
      toast.success("Produto atualizado com sucesso");
      navigate("/catalogo");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar produto");
      console.error(error);
    },
  });

  // Mutations para complementos
  const createGroupMutation = trpc.complement.createGroup.useMutation();
  const updateGroupMutation = trpc.complement.updateGroup.useMutation();
  const deleteGroupMutation = trpc.complement.deleteGroup.useMutation();
  const createItemMutation = trpc.complement.createItem.useMutation();
  const updateItemMutation = trpc.complement.updateItem.useMutation();
  const deleteItemMutation = trpc.complement.deleteItem.useMutation();

  // Função para salvar todos os grupos de complementos
  const saveComplementGroups = async (productId: number) => {
    try {
      // Obter grupos existentes do servidor
      const existingGroupIds = existingGroups?.map((g: any) => g.id) || [];
      const currentGroupIds = complementGroups.filter(g => g.id).map(g => g.id!);
      
      // Deletar grupos que foram removidos
      const groupsToDelete = existingGroupIds.filter((id: number) => !currentGroupIds.includes(id));
      for (const groupId of groupsToDelete) {
        await deleteGroupMutation.mutateAsync({ id: groupId });
      }

      // Criar ou atualizar grupos
      for (const group of complementGroups) {
        let groupId = group.id;
        
        if (group.id) {
          // Atualizar grupo existente
          await updateGroupMutation.mutateAsync({
            id: group.id,
            name: group.name,
            minQuantity: group.minQuantity,
            maxQuantity: group.maxQuantity,
            isRequired: group.isRequired,
          });
        } else {
          // Criar novo grupo
          const result = await createGroupMutation.mutateAsync({
            productId,
            name: group.name,
            minQuantity: group.minQuantity,
            maxQuantity: group.maxQuantity,
            isRequired: group.isRequired,
          });
          groupId = result.id;
        }

        if (groupId) {
          // Obter itens existentes do grupo
          const existingGroup = existingGroups?.find((g: any) => g.id === group.id);
          const existingItemIds = existingGroup?.items?.map((i: any) => i.id) || [];
          const currentItemIds = group.items.filter(i => i.id).map(i => i.id!);
          
          // Deletar itens que foram removidos
          const itemsToDelete = existingItemIds.filter((id: number) => !currentItemIds.includes(id));
          for (const itemId of itemsToDelete) {
            await deleteItemMutation.mutateAsync({ id: itemId });
          }

          // Criar ou atualizar itens
          for (const item of group.items) {
            if (item.id) {
              // Atualizar item existente
              await updateItemMutation.mutateAsync({
                id: item.id,
                name: item.name,
                price: item.price,
              });
            } else {
              // Criar novo item
              await createItemMutation.mutateAsync({
                groupId,
                name: item.name,
                price: item.price,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Erro ao salvar complementos:", error);
      toast.error("Erro ao salvar complementos");
    }
  };

  // Load product data when editing
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      // Garantir que categoryId seja convertido corretamente
      // product.categoryId pode ser number, null ou undefined
      if (product.categoryId !== null && product.categoryId !== undefined && product.categoryId !== 0) {
        setCategoryId(String(product.categoryId));
      } else {
        setCategoryId("none");
      }
      // Formatar preço para exibição (ex: "10,50")
      const priceValue = parseFloat(String(product.price));
      setPrice(priceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setImages(product.images || []);
      setStatus(product.status === "archived" ? "paused" : product.status);
      setHasStock(product.hasStock);
      setStockQuantity(product.stockQuantity ? String(product.stockQuantity) : "");
    }
  }, [product]);

  // Load existing complement groups when editing
  useEffect(() => {
    if (existingGroups && existingGroups.length > 0) {
      const formattedGroups = existingGroups.map((group: any) => ({
        id: group.id,
        name: group.name,
        minQuantity: group.minQuantity,
        maxQuantity: group.maxQuantity,
        isRequired: group.isRequired,
        items: group.items?.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: String(item.price),
        })) || [],
      }));
      setComplementGroups(formattedGroups);
    }
  }, [existingGroups]);

  // Se não há estabelecimento, redirecionar para configurações
  if (!establishmentLoading && !establishment) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-6 bg-muted/30 rounded-3xl mb-6">
            <ImagePlus className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Configure seu estabelecimento</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Antes de adicionar produtos, você precisa configurar as informações do seu estabelecimento.
          </p>
          <Button onClick={() => navigate("/configuracoes")} className="rounded-xl">
            Ir para Configurações
          </Button>
        </div>
      </AdminLayout>
    );
  }

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
      categoryId: categoryId && categoryId !== "none" ? Number(categoryId) : null,
      price: parsePriceInput(price),
      images: images.length > 0 ? images : undefined,
      status,
      hasStock,
      stockQuantity: stockQuantity ? Number(stockQuantity) : null,
    };

    if (isEditing) {
      updateMutation.mutate({ id: Number(params.id), ...productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  // Upload mutation
  const uploadMutation = trpc.upload.image.useMutation({
    onSuccess: (data) => {
      setImages([...images, data.url]);
      toast.success("Imagem enviada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao enviar imagem");
      console.error(error);
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const handleImageAdd = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setUploading(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({
        base64,
        mimeType: file.type,
        folder: "products",
      });
    };
    reader.onerror = () => {
      toast.error("Erro ao ler arquivo");
      setUploading(false);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
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
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between mb-9">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate("/catalogo")}
              className="rounded-lg hover:bg-accent h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isEditing ? "Editar Produto" : "Novo Produto"}
              </h1>
              <p className="text-base text-muted-foreground">
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
              <div className="space-y-5">
                {/* Nome, Preço e Categoria na mesma linha */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                  <div className="md:col-span-2 lg:col-span-6">
                    <Label htmlFor="name" className="text-sm font-semibold">Nome do produto *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(capitalizeFirst(e.target.value))}
                      placeholder="Ex: X-Burger Especial"
                      className={cn(
                        "mt-1.5 h-9 text-sm rounded-lg border-border/50 focus:ring-2 focus:ring-primary/20",
                        errors.name && "border-destructive focus:ring-destructive/20"
                      )}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive mt-1.5">{errors.name}</p>
                    )}
                  </div>

                  <div className="lg:col-span-3">
                    <Label htmlFor="price" className="text-sm font-semibold">Preço *</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                      <Input
                        id="price"
                        type="text"
                        inputMode="numeric"
                        value={price}
                        onChange={(e) => {
                          const formatted = formatPriceInput(e.target.value);
                          setPrice(formatted);
                        }}
                        placeholder="0,00"
                        className={cn(
                          "h-9 text-sm rounded-lg border-border/50 focus:ring-2 focus:ring-primary/20 pl-10",
                          errors.price && "border-destructive focus:ring-destructive/20"
                        )}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-xs text-destructive mt-1.5">{errors.price}</p>
                    )}
                  </div>

                  <div className="lg:col-span-3">
                    <Label htmlFor="category" className="text-sm font-semibold">Categoria</Label>
                    <Select key={`category-${categoryId}`} value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="mt-1.5 h-9 text-sm rounded-lg border-border/50">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="none" className="rounded text-sm text-muted-foreground">
                          Sem categoria
                        </SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)} className="rounded text-sm">
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>


                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-semibold">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(capitalizeFirst(e.target.value))}
                    placeholder="Descreva os ingredientes e características do produto"
                    rows={2}
                    className="mt-2 text-sm rounded-lg border-border/50 focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>
            </SectionCard>

            {/* Images */}
            <SectionCard title="Imagens">
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted group shadow-soft"
                    >
                      <img
                        src={img}
                        alt={`Imagem ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute top-1.5 right-1.5 p-1 bg-destructive text-destructive-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleImageAdd}
                    disabled={uploading}
                    className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="p-2 bg-muted/50 rounded-lg">
                          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">Enviando...</span>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-muted/50 rounded-lg">
                          <ImagePlus className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">Adicionar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </SectionCard>

            {/* Stock & Availability */}
            <SectionCard title="Disponibilidade">
              <div className="space-y-5">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs font-semibold">Status do produto</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Produtos pausados não aparecem no cardápio
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-md",
                      status === "active" 
                        ? "text-emerald-700 bg-emerald-50" 
                        : "text-amber-700 bg-amber-50"
                    )}>
                      {status === "active" ? "Ativo" : "Pausado"}
                    </span>
                    <Switch
                      checked={status === "active"}
                      onCheckedChange={(checked) => setStatus(checked ? "active" : "paused")}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs font-semibold">Controle de estoque</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ative para controlar a quantidade disponível
                    </p>
                  </div>
                  <Switch
                    checked={hasStock}
                    onCheckedChange={(checked) => setHasStock(checked)}
                  />
                </div>

                {hasStock && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <Label htmlFor="stockQuantity" className="text-xs font-semibold">Quantidade em estoque</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        min="0"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                        placeholder="0"
                        className="mt-2 h-10 text-base rounded-lg border-border/50 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                )}

                </div>
            </SectionCard>

            {/* Complements */}
            <SectionCard 
              title="Complementos / Adicionais"
              actions={
                <Button type="button" variant="outline" size="sm" onClick={addComplementGroup} className="rounded-lg border-border/50 hover:bg-accent text-xs h-8">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Grupo
                </Button>
              }
            >
              {complementGroups.length === 0 ? (
                <div className="text-center py-6">
                  <div className="p-3 bg-muted/30 rounded-xl inline-block mb-2">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nenhum grupo de complementos adicionado
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complementGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="border border-border/50 rounded-xl p-4 bg-muted/20">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 space-y-3">
                          <Input
                            value={group.name}
                            onChange={(e) =>
                              updateComplementGroup(groupIndex, { name: capitalizeFirst(e.target.value) })
                            }
                            placeholder="Nome do grupo (ex: Adicionais)"
                            className="h-9 text-sm rounded-lg border-border/50 focus:ring-2 focus:ring-primary/20"
                          />
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <Label className="text-[10px] font-semibold text-muted-foreground">Mín:</Label>
                              <Input
                                type="number"
                                min="0"
                                value={group.minQuantity}
                                onChange={(e) =>
                                  updateComplementGroup(groupIndex, {
                                    minQuantity: Number(e.target.value),
                                  })
                                }
                                className="w-14 h-8 text-sm rounded-md border-border/50"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Label className="text-[10px] font-semibold text-muted-foreground">Máx:</Label>
                              <Input
                                type="number"
                                min="1"
                                value={group.maxQuantity}
                                onChange={(e) =>
                                  updateComplementGroup(groupIndex, {
                                    maxQuantity: Number(e.target.value),
                                  })
                                }
                                className="w-14 h-8 text-sm rounded-md border-border/50"
                              />
                            </div>
                            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                              <input
                                type="checkbox"
                                checked={group.isRequired}
                                onChange={(e) =>
                                  updateComplementGroup(groupIndex, {
                                    isRequired: e.target.checked,
                                  })
                                }
                                className="rounded h-3.5 w-3.5 border-border/50"
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
                          className="rounded-lg h-8 w-8 hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {group.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center gap-2 p-2 bg-card rounded-lg border border-border/50">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
                            <Input
                              value={item.name}
                              onChange={(e) =>
                                updateComplementItem(groupIndex, itemIndex, {
                                  name: capitalizeFirst(e.target.value),
                                })
                              }
                              placeholder="Nome do item"
                              className="flex-1 h-8 text-sm rounded-md border-border/50"
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
                              className="w-24 h-8 text-sm rounded-md border-border/50"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeComplementItem(groupIndex, itemIndex)}
                              className="h-8 w-8 rounded-md hover:bg-destructive/10"
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addComplementItem(groupIndex)}
                          className="w-full h-8 text-xs rounded-lg border border-dashed border-border/50 hover:border-primary hover:bg-primary/5"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
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
            <div className="sticky top-20">
              <SectionCard title="Preview">
                {/* Product Image */}
                <div className="aspect-video bg-muted/50 flex items-center justify-center rounded-xl overflow-hidden -mx-4 -mt-2">
                    {images.length > 0 ? (
                      <img
                        src={images[0]}
                        alt={name || "Produto"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-xl">
                        <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="mt-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-base">
                        {name || "Nome do produto"}
                      </h4>
                      <StatusBadge variant={status === "active" ? "success" : "warning"}>
                        {status === "active" ? "Ativo" : "Pausado"}
                      </StatusBadge>
                    </div>
                    {description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {description}
                      </p>
                    )}
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(parseFloat(price.replace(',', '.')) || 0)}
                    </p>

                    {/* Preview dos Complementos com Interação */}
                    {complementGroups.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/50 space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {complementGroups.map((group, groupIndex) => {
                          const selectedItems = previewSelections[groupIndex] || [];
                          const isRadio = group.maxQuantity === 1;
                          
                          const handleItemClick = (itemIndex: number) => {
                            setPreviewSelections(prev => {
                              const current = prev[groupIndex] || [];
                              if (isRadio) {
                                // Radio: seleciona apenas um
                                return { ...prev, [groupIndex]: [itemIndex] };
                              } else {
                                // Checkbox: toggle
                                if (current.includes(itemIndex)) {
                                  return { ...prev, [groupIndex]: current.filter(i => i !== itemIndex) };
                                } else if (current.length < group.maxQuantity) {
                                  return { ...prev, [groupIndex]: [...current, itemIndex] };
                                }
                                return prev;
                              }
                            });
                          };
                          
                          return (
                            <div key={groupIndex} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h5 className="font-semibold text-sm">
                                  {group.name || "Grupo sem nome"}
                                </h5>
                                {group.isRequired && (
                                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                    Obrigatório
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {group.isRequired 
                                  ? `Escolha ${group.minQuantity === group.maxQuantity ? group.minQuantity : `${group.minQuantity} a ${group.maxQuantity}`}` 
                                  : `Máx: ${group.maxQuantity}`}
                                {selectedItems.length > 0 && ` • ${selectedItems.length} selecionado(s)`}
                              </p>
                              <div className="space-y-1">
                                {group.items.map((item, itemIndex) => {
                                  const isSelected = selectedItems.includes(itemIndex);
                                  return (
                                    <div
                                      key={itemIndex}
                                      onClick={() => handleItemClick(itemIndex)}
                                      className={`flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer transition-all ${
                                        isSelected 
                                          ? 'bg-primary/10 border border-primary/30' 
                                          : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-${isRadio ? 'full' : 'sm'} border-2 flex items-center justify-center transition-colors ${
                                          isSelected 
                                            ? 'border-primary bg-primary' 
                                            : 'border-muted-foreground/30'
                                        }`}>
                                          {isSelected && (
                                            <div className={`${isRadio ? 'w-2 h-2 rounded-full' : 'w-2.5 h-2.5'} bg-white`} 
                                              style={!isRadio ? { clipPath: 'polygon(20% 50%, 40% 70%, 80% 30%, 85% 35%, 40% 80%, 15% 55%)' } : {}}
                                            />
                                          )}
                                        </div>
                                        <span className={`text-xs ${isSelected ? 'font-medium' : ''}`}>
                                          {item.name || "Item sem nome"}
                                        </span>
                                      </div>
                                      {parseFloat(item.price || "0") > 0 && (
                                        <span className={`text-xs ${isSelected ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                          + R$ {parseFloat(item.price).toFixed(2).replace('.', ',')}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                                {group.items.length === 0 && (
                                  <p className="text-[10px] text-muted-foreground/50 italic py-1">
                                    Nenhum item adicionado
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Total Dinâmico */}
                    {complementGroups.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Total estimado:</span>
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(
                              (parseFloat(price.replace(',', '.')) || 0) + 
                              Object.entries(previewSelections).reduce((total, [groupIdx, itemIndices]) => {
                                const group = complementGroups[parseInt(groupIdx)];
                                if (!group) return total;
                                return total + itemIndices.reduce((sum, itemIdx) => {
                                  const item = group.items[itemIdx];
                                  return sum + (item ? parseFloat(item.price || "0") : 0);
                                }, 0);
                              }, 0)
                            )}
                          </span>
                        </div>
                        {Object.keys(previewSelections).length > 0 && (
                          <button
                            type="button"
                            onClick={() => setPreviewSelections({})}
                            className="text-[10px] text-muted-foreground hover:text-primary mt-1 underline"
                          >
                            Limpar seleções
                          </button>
                        )}
                      </div>
                    )}

                </div>
              </SectionCard>

              {/* Save Button */}
              <div className="mt-4">
                <Button
                  type="submit"
                  className="w-full h-10 rounded-lg shadow-sm text-sm font-semibold"
                  size="default"
                  disabled={isPending}
                >
                  <Save className="h-4 w-4 mr-1.5" />
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
