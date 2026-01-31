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
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  uniqueId: string; // ID único para drag & drop
  name: string;
  price: string;
  imageUrl?: string | null;
}

// Sortable Complement Group Component
function SortableComplementGroup({
  groupIndex,
  children,
}: {
  groupIndex: number;
  children: React.ReactNode | ((props: { attributes: Record<string, unknown>; listeners: Record<string, unknown> | undefined }) => React.ReactNode);
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group-${groupIndex}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border border-border/50 rounded-xl p-4 bg-muted/20 overflow-x-auto",
        isDragging && "shadow-xl ring-2 ring-primary/30"
      )}
    >
      {typeof children === 'function' ? children({ attributes, listeners }) : children}
    </div>
  );
}

// Sortable Complement Item Component
function SortableComplementItem({
  item,
  itemIndex,
  groupIndex,
  onUpdate,
  onRemove,
  displayPrice,
  handlePriceChange,
  onImageUpload,
  uploadingImage,
}: {
  item: ComplementItem;
  itemIndex: number;
  groupIndex: number;
  onUpdate: (groupIndex: number, itemIndex: number, updates: Partial<ComplementItem>) => void;
  onRemove: (groupIndex: number, itemIndex: number) => void;
  displayPrice: (value: string) => string;
  handlePriceChange: (groupIndex: number, itemIndex: number, value: string) => void;
  onImageUpload: (groupIndex: number, itemIndex: number, file: File) => void;
  uploadingImage: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.uniqueId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploading = uploadingImage === item.uniqueId;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(groupIndex, itemIndex, file);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 bg-card rounded-lg border border-border/50 overflow-x-auto",
        isDragging && "shadow-lg"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded-md touch-none"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
      </button>
      
      {/* Indicador minimalista de foto */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "h-8 w-8 rounded-md border border-dashed flex items-center justify-center transition-colors",
              item.imageUrl 
                ? "border-green-500 bg-green-50 text-green-600 hover:bg-green-100" 
                : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50",
              isUploading && "opacity-50 cursor-wait"
            )}
          >
            {isUploading ? (
              <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : item.imageUrl ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {item.imageUrl ? "Foto adicionada - Clique para trocar" : "Adicionar foto"}
        </TooltipContent>
      </Tooltip>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Input
        value={item.name}
        onChange={(e) =>
          onUpdate(groupIndex, itemIndex, {
            name: capitalizeFirst(e.target.value),
          })
        }
        placeholder="Nome do item"
        className="flex-1 min-w-[120px] h-8 text-sm rounded-md border-border/50"
      />
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">R$</span>
        <Input
          type="text"
          inputMode="numeric"
          value={displayPrice(item.price)}
          onChange={(e) =>
            handlePriceChange(groupIndex, itemIndex, e.target.value)
          }
          placeholder="0,00"
          className="w-24 h-8 text-sm rounded-md border-border/50 text-right pl-7"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(groupIndex, itemIndex)}
        className="h-8 w-8 rounded-md hover:bg-destructive/10"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}

export default function ProductForm() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const isEditing = !!params.id;
  const utils = trpc.useUtils();

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
  const [printerId, setPrinterId] = useState<string>("none"); // Setor/Impressora para este produto
  const [complementGroups, setComplementGroups] = useState<ComplementGroup[]>([]);

  // Preview selections state - para simular seleção do cliente
  const [previewSelections, setPreviewSelections] = useState<Record<number, number[]>>({});

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Image upload
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Complement image upload
  const [uploadingComplementImage, setUploadingComplementImage] = useState<string | null>(null);
  
  // Flag para controlar se os dados já foram carregados inicialmente
  // Evita que o useEffect sobrescreva as alterações do usuário ao trocar de aba
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [initialComplementsLoaded, setInitialComplementsLoaded] = useState(false);

  // Drag & Drop sensors for complement items
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for complement items
  const handleDragEnd = useCallback((event: DragEndEvent, groupIndex: number) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setComplementGroups((groups) => {
        const newGroups = [...groups];
        const items = newGroups[groupIndex].items;
        
        // Find indices by uniqueId
        const activeIndex = items.findIndex(item => item.uniqueId === active.id);
        const overIndex = items.findIndex(item => item.uniqueId === over.id);
        
        if (activeIndex !== -1 && overIndex !== -1) {
          newGroups[groupIndex] = {
            ...newGroups[groupIndex],
            items: arrayMove(items, activeIndex, overIndex),
          };
        }
        return newGroups;
      });
    }
  }, []);

  // Handle drag end for complement groups
  const handleGroupDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setComplementGroups((groups) => {
        // Extract group index from id (format: "group-0", "group-1", etc.)
        const activeIndex = parseInt(String(active.id).replace('group-', ''));
        const overIndex = parseInt(String(over.id).replace('group-', ''));
        
        if (!isNaN(activeIndex) && !isNaN(overIndex)) {
          return arrayMove(groups, activeIndex, overIndex);
        }
        return groups;
      });
    }
  }, []);

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

  // Buscar impressoras/setores para seleção
  const { data: printers } = trpc.printer.list.useQuery(
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
      // Permanecer na página de edição em vez de redirecionar
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

      // Mapa para armazenar os novos IDs dos grupos criados
      const newGroupIds: Map<number, number> = new Map();

      // Criar ou atualizar grupos
      for (let groupIndex = 0; groupIndex < complementGroups.length; groupIndex++) {
        const group = complementGroups[groupIndex];
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
          // Armazenar o novo ID para atualizar o estado local depois
          newGroupIds.set(groupIndex, groupId);
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

          // Criar ou atualizar itens com sortOrder baseado na posição no array
          for (let itemIndex = 0; itemIndex < group.items.length; itemIndex++) {
            const item = group.items[itemIndex];
            if (item.id) {
              // Atualizar item existente com sortOrder
              await updateItemMutation.mutateAsync({
                id: item.id,
                name: item.name,
                price: parsePriceInput(item.price),
                imageUrl: item.imageUrl,
                sortOrder: itemIndex,
              });
            } else {
              // Criar novo item com sortOrder
              await createItemMutation.mutateAsync({
                groupId,
                name: item.name,
                price: parsePriceInput(item.price),
                imageUrl: item.imageUrl,
                sortOrder: itemIndex,
              });
            }
          }
        }
      }

      // Atualizar o estado local com os novos IDs dos grupos criados
      if (newGroupIds.size > 0) {
        setComplementGroups(prevGroups => 
          prevGroups.map((group, index) => {
            const newId = newGroupIds.get(index);
            if (newId) {
              return { ...group, id: newId };
            }
            return group;
          })
        );
      }

      // Invalidar a query para recarregar os dados do servidor
      await utils.complement.listGroups.invalidate({ productId });
    } catch (error) {
      console.error("Erro ao salvar complementos:", error);
      toast.error("Erro ao salvar complementos");
    }
  };

  // Load product data when editing - apenas na primeira vez
  useEffect(() => {
    if (product && !initialDataLoaded) {
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
      // Carregar setor/impressora do produto
      if ((product as any).printerId) {
        setPrinterId(String((product as any).printerId));
      } else {
        setPrinterId("none");
      }
      setInitialDataLoaded(true);
    }
  }, [product, initialDataLoaded]);

  // Load existing complement groups when editing - apenas na primeira vez
  useEffect(() => {
    if (existingGroups && existingGroups.length > 0 && !initialComplementsLoaded) {
      const formattedGroups = existingGroups.map((group: any) => ({
        id: group.id,
        name: group.name,
        minQuantity: group.minQuantity,
        maxQuantity: group.maxQuantity,
        isRequired: group.isRequired,
        items: group.items?.map((item: any) => ({
          id: item.id,
          uniqueId: `existing-${item.id}`, // ID único para drag & drop
          name: item.name,
          price: String(item.price),
          imageUrl: item.imageUrl || null,
        })) || [],
      }));
      setComplementGroups(formattedGroups);
      setInitialComplementsLoaded(true);
    }
  }, [existingGroups, initialComplementsLoaded]);

  // Nota: Removido bloqueio para usuários sem estabelecimento - agora a página de ProductForm mostra normalmente

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
      printerId: printerId && printerId !== "none" ? Number(printerId) : null, // Setor/Impressora
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

  // Upload de imagem de complemento
  const handleComplementImageUpload = async (groupIndex: number, itemIndex: number, file: File) => {
    const item = complementGroups[groupIndex]?.items[itemIndex];
    if (!item) return;
    
    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }
    
    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB");
      return;
    }
    
    setUploadingComplementImage(item.uniqueId);
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate(
        {
          base64,
          mimeType: file.type,
          folder: "complements",
        },
        {
          onSuccess: (data) => {
            updateComplementItem(groupIndex, itemIndex, { imageUrl: data.url });
            toast.success("Foto do complemento adicionada");
          },
          onError: () => {
            toast.error("Erro ao enviar foto do complemento");
          },
          onSettled: () => {
            setUploadingComplementImage(null);
          },
        }
      );
    };
    reader.onerror = () => {
      toast.error("Erro ao ler arquivo");
      setUploadingComplementImage(null);
    };
    reader.readAsDataURL(file);
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
    newGroups[groupIndex].items.push({ 
      uniqueId: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "", 
      price: "0" 
    });
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
    // Ajustar maxQuantity se for maior que a quantidade de itens restantes
    const remainingItems = newGroups[groupIndex].items.length;
    if (newGroups[groupIndex].maxQuantity > remainingItems && remainingItems > 0) {
      newGroups[groupIndex].maxQuantity = remainingItems;
    }
    // Ajustar minQuantity se for maior que maxQuantity
    if (newGroups[groupIndex].minQuantity > newGroups[groupIndex].maxQuantity) {
      newGroups[groupIndex].minQuantity = newGroups[groupIndex].maxQuantity;
    }
    setComplementGroups(newGroups);
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0);
  };

  // Formata preço em centavos (500 -> 5,00)
  const formatPriceInputLocal = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    // Converte para centavos e formata
    const cents = parseInt(numbers || "0", 10);
    const reais = cents / 100;
    // Retorna com vírgula como separador decimal (formato brasileiro)
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Formata para exibição no input (5.00 -> 5,00 ou 5,00 -> 5,00)
  const displayPrice = (value: string): string => {
    // Detecta se o valor já está no formato brasileiro (tem vírgula como separador decimal)
    // ou no formato americano (tem ponto como separador decimal)
    let num: number;
    if (value.includes(',')) {
      // Formato brasileiro: remove pontos de milhar, troca vírgula por ponto
      const normalized = value.replace(/\./g, '').replace(',', '.');
      num = parseFloat(normalized || '0');
    } else {
      // Formato americano ou número puro
      num = parseFloat(value || '0');
    }
    return num.toFixed(2).replace(".", ",");
  };

  // Handler para input de preço com formatação em centavos
  const handlePriceChange = (
    groupIndex: number,
    itemIndex: number,
    inputValue: string
  ) => {
    const formatted = formatPriceInputLocal(inputValue);
    updateComplementItem(groupIndex, itemIndex, { price: formatted });
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
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="price" className="text-sm font-semibold">Preço *</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-center">
                          <p>Se este item não for vendido individualmente e servir apenas como uma opção dentro de outro item, deixe o preço como R$ 0,00. Assim, o valor deste item não será somado ao preço final junto com os complementos.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                      <Input
                        id="price"
                        type="text"
                        inputMode="numeric"
                        value={price}
                        onChange={(e) => {
                          const formatted = formatPriceInputLocal(e.target.value);
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

                {/* Setor de Impressão */}
                {printers && printers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="printer" className="text-sm font-semibold">Setor de Preparo (Impressora)</Label>
                      <Select key={`printer-${printerId}`} value={printerId} onValueChange={setPrinterId}>
                        <SelectTrigger className="mt-1.5 h-9 text-sm rounded-lg border-border/50">
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="none" className="rounded text-sm text-muted-foreground">
                            Todas as impressoras
                          </SelectItem>
                          {printers.map((printer: any) => (
                            <SelectItem key={printer.id} value={String(printer.id)} className="rounded text-sm">
                              {printer.name} ({printer.ipAddress})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">Selecione qual impressora/setor deve receber este item ao imprimir o pedido</p>
                    </div>
                  </div>
                )}



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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleGroupDragEnd}
                >
                  <SortableContext
                    items={complementGroups.map((_, idx) => `group-${idx}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {complementGroups.map((group, groupIndex) => (
                        <SortableComplementGroup
                          key={`group-${groupIndex}`}
                          groupIndex={groupIndex}
                        >
                          {({ attributes, listeners }: { attributes: Record<string, unknown>; listeners: Record<string, unknown> | undefined }) => (
                          <>
                          <div className="flex items-start justify-between gap-3 flex-1">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  {...attributes}
                                  {...listeners}
                                  className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded-md touch-none"
                                >
                                  <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                </button>
                                <Input
                                  value={group.name}
                                  onChange={(e) =>
                                    updateComplementGroup(groupIndex, { name: capitalizeFirst(e.target.value) })
                                  }
                                  placeholder="Nome do grupo (ex: Adicionais)"
                                  className="h-9 text-sm rounded-lg border-border/50 focus:ring-2 focus:ring-primary/20 flex-1"
                                />
                              </div>
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
                                    max={group.items.length || 1}
                                    value={group.maxQuantity}
                                    onChange={(e) => {
                                      const value = Number(e.target.value);
                                      const maxAllowed = group.items.length || 1;
                                      updateComplementGroup(groupIndex, {
                                        maxQuantity: Math.min(value, maxAllowed),
                                      });
                                    }}
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
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, groupIndex)}
                      >
                        <SortableContext
                          items={group.items.map((item) => item.uniqueId)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2 min-w-[400px]">
                            {group.items.map((item, itemIndex) => (
                              <SortableComplementItem
                                key={item.uniqueId}
                                item={item}
                                itemIndex={itemIndex}
                                groupIndex={groupIndex}
                                onUpdate={updateComplementItem}
                                onRemove={removeComplementItem}
                                displayPrice={displayPrice}
                                handlePriceChange={handlePriceChange}
                                onImageUpload={handleComplementImageUpload}
                                uploadingImage={uploadingComplementImage}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                          <div className="mt-2">
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
                          </>
                          )}
                        </SortableComplementGroup>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
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
                    {(parseFloat(price.replace(',', '.')) || 0) > 0 && (
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(parseFloat(price.replace(',', '.')) || 0)}
                      </p>
                    )}

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
