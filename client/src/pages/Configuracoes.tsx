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
} from "lucide-react";
import { useState, useEffect } from "react";
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
  const [acceptsCash, setAcceptsCash] = useState(true);
  const [acceptsCard, setAcceptsCard] = useState(true);
  const [acceptsPix, setAcceptsPix] = useState(false);
  const [acceptsBoleto, setAcceptsBoleto] = useState(false);
  const [allowsDelivery, setAllowsDelivery] = useState(true);
  const [allowsPickup, setAllowsPickup] = useState(true);

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
      setAcceptsCash(establishment.acceptsCash);
      setAcceptsCard(establishment.acceptsCard);
      setAcceptsPix(establishment.acceptsPix);
      setAcceptsBoleto(establishment.acceptsBoleto);
      setAllowsDelivery(establishment.allowsDelivery);
      setAllowsPickup(establishment.allowsPickup);
    }
  }, [establishment]);

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
    onError: () => toast.error("Erro ao salvar configurações"),
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
      acceptsCash,
      acceptsCard,
      acceptsPix,
      acceptsBoleto,
      allowsDelivery,
      allowsPickup,
    });
  };

  const handleImageUpload = (type: "logo" | "cover") => {
    const url = prompt("Digite a URL da imagem:");
    if (url && url.trim()) {
      if (type === "logo") {
        setLogo(url.trim());
      } else {
        setCoverImage(url.trim());
      }
    }
  };

  const copyMenuLink = () => {
    const link = `menu.example.com/${menuSlug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <PageHeader
        title="Configurações"
        description="Gerencie as configurações do seu estabelecimento"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8 bg-muted/50 p-1.5 rounded-xl">
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
        <TabsContent value="estabelecimento" className="space-y-6">
          {/* Nome e Imagens */}
          <SectionCard title="Nome e imagens">
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-semibold">Nome do Restaurante *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Restaurante Sabor Caseiro"
                  className="max-w-md mt-2 h-11 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Logo */}
                <div>
                  <Label className="text-sm font-semibold">Logotipo</Label>
                  <div
                    onClick={() => handleImageUpload("logo")}
                    className={cn(
                      "mt-2 aspect-square max-w-[200px] rounded-2xl border-2 border-dashed cursor-pointer",
                      "flex flex-col items-center justify-center gap-3 overflow-hidden",
                      "hover:border-primary hover:bg-primary/5 transition-all duration-200",
                      logo ? "border-solid border-border/50 shadow-soft" : "border-muted-foreground/20"
                    )}
                  >
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="p-3 bg-muted/50 rounded-xl">
                          <ImagePlus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">Logotipo</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <Label className="text-sm font-semibold">Imagem de capa</Label>
                  <div
                    onClick={() => handleImageUpload("cover")}
                    className={cn(
                      "mt-2 aspect-video max-w-[300px] rounded-2xl border-2 border-dashed cursor-pointer",
                      "flex flex-col items-center justify-center gap-3 overflow-hidden",
                      "hover:border-primary hover:bg-primary/5 transition-all duration-200",
                      coverImage ? "border-solid border-border/50 shadow-soft" : "border-muted-foreground/20"
                    )}
                  >
                    {coverImage ? (
                      <img src={coverImage} alt="Capa" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="p-3 bg-muted/50 rounded-xl">
                          <ImagePlus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">Imagem de capa</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveEstablishment} disabled={isPending} className="rounded-xl shadow-sm">
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
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
                    className="mt-2 h-11 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <Label htmlFor="number" className="text-sm font-semibold">Número</Label>
                  <Input
                    id="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                    className="mt-2 h-11 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
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
                    className="mt-2 h-11 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood" className="text-sm font-semibold">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Nome do bairro"
                    className="mt-2 h-11 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
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
                    className="mt-2 h-11 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-sm font-semibold">Estado</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="UF"
                    className="mt-2 h-11 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode" className="text-sm font-semibold">CEP</Label>
                  <Input
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="00000-000"
                    className="mt-2 h-11 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
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
        <TabsContent value="atendimento" className="space-y-6">
          {/* Configurações básicas */}
          <SectionCard title="Configurações básicas de atendimento">
            <div className="space-y-5">
              <div>
                <Label htmlFor="menuSlug" className="text-sm font-semibold">Link do cardápio</Label>
                <div className="flex gap-2 mt-2">
                  <div className="flex items-center px-4 bg-muted/50 rounded-l-xl border border-r-0 border-border/50 text-sm text-muted-foreground font-medium">
                    menu.example.com/
                  </div>
                  <Input
                    id="menuSlug"
                    value={menuSlug}
                    onChange={(e) => setMenuSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="seu-restaurante"
                    className="rounded-l-none flex-1 h-11 rounded-r-xl border-border/50 focus:ring-2 focus:ring-primary/20"
                  />
                  <Button variant="outline" size="icon" onClick={copyMenuLink} title="Copiar link" className="h-11 w-11 rounded-xl border-border/50 hover:bg-accent">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" title="Testar link" className="h-11 w-11 rounded-xl border-border/50 hover:bg-accent">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
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
                    className="max-w-xs h-11 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20"
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
                  <span className="font-semibold">Dinheiro</span>
                  <Checkbox
                    checked={acceptsCash}
                    onCheckedChange={(checked) => setAcceptsCash(checked as boolean)}
                    className="h-5 w-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:bg-muted/30 cursor-pointer transition-colors">
                  <span className="font-semibold">Cartão</span>
                  <Checkbox
                    checked={acceptsCard}
                    onCheckedChange={(checked) => setAcceptsCard(checked as boolean)}
                    className="h-5 w-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:bg-muted/30 cursor-pointer transition-colors">
                  <span className="font-semibold">Pix</span>
                  <Checkbox
                    checked={acceptsPix}
                    onCheckedChange={(checked) => setAcceptsPix(checked as boolean)}
                    className="h-5 w-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:bg-muted/30 cursor-pointer transition-colors">
                  <span className="font-semibold">Boleto</span>
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
