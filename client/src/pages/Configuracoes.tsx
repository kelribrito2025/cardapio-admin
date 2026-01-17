import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Store,
  MapPin,
  Settings2,
  Link as LinkIcon,
  Phone,
  CreditCard,
  Truck,
  ImagePlus,
  Save,
  Copy,
  ExternalLink,
  UtensilsCrossed,
  Info,
  Camera,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Configuracoes() {
  const { data: establishment, refetch } = trpc.establishment.get.useQuery();
  const [activeTab, setActiveTab] = useState("estabelecimento");

  // Establishment form state
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Service settings form state
  const [menuSlug, setMenuSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [acceptsCash, setAcceptsCash] = useState(true);
  const [acceptsCard, setAcceptsCard] = useState(true);
  const [acceptsPix, setAcceptsPix] = useState(false);
  const [acceptsBoleto, setAcceptsBoleto] = useState(false);
  const [allowsDelivery, setAllowsDelivery] = useState(true);
  const [allowsPickup, setAllowsPickup] = useState(true);

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Inline editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [originalName, setOriginalName] = useState("");

  // Load establishment data
  useEffect(() => {
    if (establishment) {
      setName(establishment.name || "");
      setLogo(establishment.logo || "");
      setCoverImage(establishment.coverImage || "");
      setStreet(establishment.street || "");
      setNumber(establishment.number || "");
      setComplement(establishment.complement || "");
      setNeighborhood(establishment.neighborhood || "");
      setCity(establishment.city || "");
      setState(establishment.state || "");
      setZipCode(establishment.zipCode || "");
      setMenuSlug(establishment.menuSlug || "");
      setWhatsapp(establishment.whatsapp || "");
      setInstagram(establishment.instagram || "");
      setAcceptsCash(establishment.acceptsCash);
      setAcceptsCard(establishment.acceptsCard);
      setAcceptsPix(establishment.acceptsPix);
      setAcceptsBoleto(establishment.acceptsBoleto);
      setAllowsDelivery(establishment.allowsDelivery);
      setAllowsPickup(establishment.allowsPickup);
    }
  }, [establishment]);

  // Upload mutation
  const uploadMutation = trpc.upload.image.useMutation();

  // Mutations
  const createMutation = trpc.establishment.create.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Estabelecimento criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar estabelecimento"),
  });

  const updateMutation = trpc.establishment.update.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Configurações salvas com sucesso");
    },
    onError: (error) => {
      if (error.message.includes("link já está em uso")) {
        toast.error("Este link já está em uso por outro restaurante. Escolha outro.");
      } else {
        toast.error("Erro ao salvar configurações");
      }
    },
  });

  const handleSaveEstablishment = () => {
    if (!name.trim()) {
      toast.error("Nome do estabelecimento é obrigatório");
      return;
    }

    const data = {
      name: name.trim(),
      logo: logo || undefined,
      coverImage: coverImage || undefined,
      street: street || undefined,
      number: number || undefined,
      complement: complement || undefined,
      neighborhood: neighborhood || undefined,
      city: city || undefined,
      state: state || undefined,
      zipCode: zipCode || undefined,
    };

    if (establishment) {
      updateMutation.mutate({ id: establishment.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSaveServiceSettings = () => {
    if (!establishment) {
      toast.error("Crie o estabelecimento primeiro");
      return;
    }

    updateMutation.mutate({
      id: establishment.id,
      menuSlug: menuSlug || null,
      whatsapp: whatsapp || null,
      instagram: instagram || null,
      acceptsCash,
      acceptsCard,
      acceptsPix,
      acceptsBoleto,
      allowsDelivery,
      allowsPickup,
    });
  };

  const handleFileUpload = async (file: File, type: "logo" | "cover") => {
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

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        
        toast.loading("Enviando imagem...", { id: "upload" });
        
        const result = await uploadMutation.mutateAsync({
          base64,
          mimeType: file.type,
          folder: "establishments",
        });

        toast.dismiss("upload");
        toast.success("Imagem enviada com sucesso!");

        if (type === "logo") {
          setLogo(result.url);
        } else {
          setCoverImage(result.url);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.dismiss("upload");
      toast.error("Erro ao enviar imagem");
    }
  };

  const copyMenuLink = () => {
    const link = `${window.location.origin}/menu/${menuSlug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const openMenuPreview = () => {
    if (menuSlug) {
      window.open(`/menu/${menuSlug}`, "_blank");
    } else {
      toast.error("Configure o link do cardápio primeiro");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Get full address
  const fullAddress = [street, number].filter(Boolean).join(", ");

  // Get delivery types
  const deliveryTypes = [];
  if (allowsDelivery) deliveryTypes.push("Entrega");
  if (allowsPickup) deliveryTypes.push("Retirada");

  return (
    <AdminLayout>
      <PageHeader
        title="Configurações"
        description="Gerencie as configurações do seu estabelecimento"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-muted/50 p-1.5 rounded-xl">
          <TabsTrigger value="estabelecimento" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Store className="h-4 w-4" />
            Estabelecimento
          </TabsTrigger>
          <TabsTrigger value="atendimento" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Settings2 className="h-4 w-4" />
            Atendimento
          </TabsTrigger>
        </TabsList>

        {/* Estabelecimento Tab */}
        <TabsContent value="estabelecimento" className="space-y-5">
          {/* Preview do Perfil Público */}
          <SectionCard title="Preview do Perfil Público" description="Veja como seu restaurante aparecerá para os clientes">
            <div className="bg-white rounded-2xl overflow-hidden border border-border/30 shadow-sm">
              {/* Cover Image */}
              <div className="relative h-48 bg-gradient-to-br from-red-100 to-red-50">
                {coverImage ? (
                  <img 
                    src={coverImage} 
                    alt="Capa" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UtensilsCrossed className="h-16 w-16 text-red-200" />
                  </div>
                )}
                
                {/* Edit Cover Button */}
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  title="Alterar capa"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "cover");
                  }}
                />
              </div>

              {/* Profile Info Section */}
              <div className="relative px-6 pb-6">
                {/* Logo - positioned to overlap cover */}
                <div className="absolute -top-16 left-6">
                  <div className="relative">
                    <div className={cn(
                      "w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden",
                      "bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center"
                    )}>
                      {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <UtensilsCrossed className="h-12 w-12 text-white" />
                      )}
                    </div>
                    
                    {/* Edit Logo Button */}
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute bottom-1 right-1 p-2 bg-white hover:bg-gray-100 rounded-full shadow-md transition-colors"
                      title="Alterar logo"
                    >
                      <Pencil className="h-3.5 w-3.5 text-gray-600" />
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "logo");
                      }}
                    />
                  </div>
                </div>

                {/* Restaurant Info */}
                <div className="pt-20 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    {/* Restaurant Name and Rating */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {isEditingName ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            ref={nameInputRef}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-8 w-56 font-bold text-lg"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && name.trim()) {
                                setIsEditingName(false);
                              } else if (e.key === "Escape") {
                                setName(originalName);
                                setIsEditingName(false);
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                            onClick={() => {
                              if (name.trim()) {
                                setIsEditingName(false);
                              }
                            }}
                            disabled={!name.trim()}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-100"
                            onClick={() => {
                              setName(originalName);
                              setIsEditingName(false);
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="group flex items-center gap-1.5 px-2 py-1 -mx-2 -my-1 rounded-md cursor-pointer hover:bg-muted/50 transition-all duration-200"
                          onClick={() => {
                            setOriginalName(name);
                            setIsEditingName(true);
                            setTimeout(() => nameInputRef.current?.focus(), 0);
                          }}
                        >
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                            {name || "Nome do Restaurante"}
                          </h3>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                      )}
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-800">
                          {establishment?.rating ? Number(establishment.rating).toFixed(1).replace('.', ',') : '0,0'}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({establishment?.reviewCount || 0} avaliações)
                        </span>
                      </div>
                    </div>

                    {/* Address and More Info */}
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      {fullAddress && (
                        <>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-gray-500" />
                            {fullAddress}
                          </span>
                          <span className="text-gray-400">•</span>
                        </>
                      )}
                      <button className="flex items-center gap-1 text-gray-600 hover:text-red-500 font-medium transition-colors">
                        <Info className="h-3.5 w-3.5" />
                        Informações
                      </button>
                    </div>
                    
                    {/* Status and Delivery Types */}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {/* Open Status with Pulsing Icon */}
                      <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        Aberto agora
                      </span>
                      {deliveryTypes.length > 0 && (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                          {deliveryTypes.join(" e ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Social Media Icons - canto superior direito */}
                  <div className="flex items-center gap-1">
                    {/* Botão Compartilhar */}
                    <button 
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="Compartilhar"
                    >
                      <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"/>
                        <circle cx="6" cy="12" r="3"/>
                        <circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                    </button>
                    {/* WhatsApp */}
                    {whatsapp && (
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="WhatsApp"
                      >
                        <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </button>
                    )}
                    {/* Instagram */}
                    {instagram && (
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Instagram"
                      >
                        <svg className="h-5 w-5 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Botão Salvar */}
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleSaveEstablishment} disabled={isPending} className="rounded-xl shadow-sm">
                    <Save className="h-4 w-4 mr-2" />
                    {isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </div>
            </div>
          </SectionCard>



          {/* Endereço */}
          <SectionCard 
            title="Endereço do Estabelecimento"
            description="Usado como endereço de retirada"
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="street" className="text-sm font-semibold">Rua</Label>
                  <Input
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Nome da rua"
                    className="mt-2 h-10 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <Label htmlFor="number" className="text-sm font-semibold">Número</Label>
                  <Input
                    id="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                    className="mt-2 h-10 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="complement" className="text-sm font-semibold">Complemento</Label>
                  <Input
                    id="complement"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Sala, Bloco, etc."
                    className="mt-2 h-10 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood" className="text-sm font-semibold">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Nome do bairro"
                    className="mt-2 h-10 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city" className="text-sm font-semibold">Cidade</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Nome da cidade"
                    className="mt-2 h-10 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-sm font-semibold">Estado</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="UF"
                    className="mt-2 h-10 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode" className="text-sm font-semibold">CEP</Label>
                  <Input
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="00000-000"
                    className="mt-2 h-10 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <Button onClick={handleSaveEstablishment} disabled={isPending} className="rounded-xl shadow-sm">
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Atendimento Tab */}
        <TabsContent value="atendimento" className="space-y-5">
          {/* Configurações básicas */}
          <SectionCard title="Configurações básicas de atendimento">
            <div className="space-y-5">
              <div>
                <Label htmlFor="menuSlug" className="text-sm font-semibold">Link do cardápio</Label>
                <div className="flex gap-2 mt-2">
                  <div className="flex items-center px-4 bg-muted/50 rounded-l-xl border border-r-0 border-border/50 text-sm text-muted-foreground font-medium">
                    {window.location.host}/menu/
                  </div>
                  <Input
                    id="menuSlug"
                    value={menuSlug}
                    onChange={(e) => setMenuSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="seu-restaurante"
                    className="rounded-l-none flex-1 h-10 rounded-r-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                  />
                  <Button variant="outline" size="icon" onClick={copyMenuLink} title="Copiar link" className="h-10 w-10 rounded-xl border-border/50 hover:bg-accent" disabled={!menuSlug}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={openMenuPreview} title="Visualizar cardápio" className="h-10 w-10 rounded-xl border-border/50 hover:bg-accent" disabled={!menuSlug}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Este será o link público do seu cardápio. Use apenas letras minúsculas, números e hífens.
                </p>
              </div>

              <div>
                <Label htmlFor="whatsapp" className="text-sm font-semibold">WhatsApp para receber pedido</Label>
                <div className="flex items-center gap-3 mt-2">
                  <div className="p-2.5 bg-emerald-50 rounded-xl">
                    <Phone className="h-5 w-5 text-emerald-600" />
                  </div>
                  <Input
                    id="whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+55 (00) 00000-0000"
                    className="max-w-xs h-10 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="instagram" className="text-sm font-semibold">Instagram</Label>
                <div className="flex items-center gap-3 mt-2">
                  <div className="p-2.5 bg-pink-50 rounded-xl">
                    <svg className="h-5 w-5 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <Input
                    id="instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@seurestaurante"
                    className="max-w-xs h-10 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <Button onClick={handleSaveServiceSettings} disabled={isPending} className="rounded-xl shadow-sm">
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </SectionCard>

          {/* Formas de pagamento */}
          <SectionCard title="Formas de pagamento">
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:bg-muted/30 cursor-pointer transition-colors">
                  <span className="font-semibold text-sm">Dinheiro</span>
                  <Checkbox
                    checked={acceptsCash}
                    onCheckedChange={(checked) => setAcceptsCash(checked as boolean)}
                    className="h-5 w-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:bg-muted/30 cursor-pointer transition-colors">
                  <span className="font-semibold text-sm">Cartão</span>
                  <Checkbox
                    checked={acceptsCard}
                    onCheckedChange={(checked) => setAcceptsCard(checked as boolean)}
                    className="h-5 w-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:bg-muted/30 cursor-pointer transition-colors">
                  <span className="font-semibold text-sm">Pix</span>
                  <Checkbox
                    checked={acceptsPix}
                    onCheckedChange={(checked) => setAcceptsPix(checked as boolean)}
                    className="h-5 w-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:bg-muted/30 cursor-pointer transition-colors">
                  <span className="font-semibold text-sm">Boleto</span>
                  <Checkbox
                    checked={acceptsBoleto}
                    onCheckedChange={(checked) => setAcceptsBoleto(checked as boolean)}
                    className="h-5 w-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </label>
              </div>

              <Button onClick={handleSaveServiceSettings} disabled={isPending} className="rounded-xl shadow-sm">
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </SectionCard>

          {/* Tipo de entrega */}
          <SectionCard title="Tipo de entrega">
            <div className="space-y-5">
              <div className="flex gap-5 flex-wrap">
                <label
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 min-w-[140px]",
                    allowsDelivery
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border/50 hover:border-muted-foreground/30 hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-xl",
                    allowsDelivery ? "bg-primary/10" : "bg-muted/50"
                  )}>
                    <Truck className={cn("h-7 w-7", allowsDelivery ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <span className={cn("font-semibold", allowsDelivery ? "text-primary" : "text-muted-foreground")}>
                    Entrega
                  </span>
                  <Checkbox
                    checked={allowsDelivery}
                    onCheckedChange={(checked) => setAllowsDelivery(checked as boolean)}
                    className="sr-only"
                  />
                  {allowsDelivery && (
                    <span className="absolute top-3 right-3 h-3 w-3 bg-primary rounded-full ring-2 ring-white" />
                  )}
                </label>

                <label
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 min-w-[140px]",
                    allowsPickup
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border/50 hover:border-muted-foreground/30 hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-xl",
                    allowsPickup ? "bg-primary/10" : "bg-muted/50"
                  )}>
                    <Store className={cn("h-7 w-7", allowsPickup ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <span className={cn("font-semibold", allowsPickup ? "text-primary" : "text-muted-foreground")}>
                    Retirada
                  </span>
                  <Checkbox
                    checked={allowsPickup}
                    onCheckedChange={(checked) => setAllowsPickup(checked as boolean)}
                    className="sr-only"
                  />
                  {allowsPickup && (
                    <span className="absolute top-3 right-3 h-3 w-3 bg-primary rounded-full ring-2 ring-white" />
                  )}
                </label>
              </div>

              <Button onClick={handleSaveServiceSettings} disabled={isPending} className="rounded-xl shadow-sm">
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
