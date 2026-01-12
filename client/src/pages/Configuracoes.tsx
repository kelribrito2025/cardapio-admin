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
        <TabsList className="mb-6">
          <TabsTrigger value="estabelecimento" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Estabelecimento
          </TabsTrigger>
          <TabsTrigger value="atendimento" className="flex items-center gap-2">
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
                <Label htmlFor="name">Nome do Restaurante *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Restaurante Sabor Caseiro"
                  className="max-w-md"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Logo */}
                <div>
                  <Label>Logotipo</Label>
                  <div
                    onClick={() => handleImageUpload("logo")}
                    className={cn(
                      "mt-2 aspect-square max-w-[200px] rounded-xl border-2 border-dashed cursor-pointer",
                      "flex flex-col items-center justify-center gap-2 overflow-hidden",
                      "hover:border-primary hover:bg-primary/5 transition-colors",
                      logo ? "border-solid border-border" : "border-muted-foreground/30"
                    )}
                  >
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Logotipo</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <Label>Imagem de capa</Label>
                  <div
                    onClick={() => handleImageUpload("cover")}
                    className={cn(
                      "mt-2 aspect-video max-w-[300px] rounded-xl border-2 border-dashed cursor-pointer",
                      "flex flex-col items-center justify-center gap-2 overflow-hidden",
                      "hover:border-primary hover:bg-primary/5 transition-colors",
                      coverImage ? "border-solid border-border" : "border-muted-foreground/30"
                    )}
                  >
                    {coverImage ? (
                      <img src={coverImage} alt="Capa" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Imagem de capa</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveEstablishment} disabled={isPending}>
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Nome da rua"
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Sala, Bloco, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Nome do bairro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Nome da cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="UF"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <Button onClick={handleSaveEstablishment} disabled={isPending}>
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="menuSlug">Link do cardápio</Label>
                <div className="flex gap-2 mt-1">
                  <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 text-sm text-muted-foreground">
                    menu.example.com/
                  </div>
                  <Input
                    id="menuSlug"
                    value={menuSlug}
                    onChange={(e) => setMenuSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="seu-restaurante"
                    className="rounded-l-none flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={copyMenuLink} title="Copiar link">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" title="Testar link">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp para receber pedido</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+55 (00) 00000-0000"
                    className="max-w-xs"
                  />
                </div>
              </div>

              <Button onClick={handleSaveServiceSettings} disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </SectionCard>

          {/* Formas de pagamento */}
          <SectionCard title="Formas de pagamento">
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <span className="font-medium">Dinheiro</span>
                  <Checkbox
                    checked={acceptsCash}
                    onCheckedChange={(checked) => setAcceptsCash(checked as boolean)}
                  />
                </label>
                <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <span className="font-medium">Cartão</span>
                  <Checkbox
                    checked={acceptsCard}
                    onCheckedChange={(checked) => setAcceptsCard(checked as boolean)}
                  />
                </label>
                <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <span className="font-medium">Pix</span>
                  <Checkbox
                    checked={acceptsPix}
                    onCheckedChange={(checked) => setAcceptsPix(checked as boolean)}
                  />
                </label>
                <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <span className="font-medium">Boleto</span>
                  <Checkbox
                    checked={acceptsBoleto}
                    onCheckedChange={(checked) => setAcceptsBoleto(checked as boolean)}
                  />
                </label>
              </div>

              <Button onClick={handleSaveServiceSettings} disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </SectionCard>

          {/* Tipo de entrega */}
          <SectionCard title="Tipo de entrega">
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <label
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-colors min-w-[120px]",
                    allowsDelivery
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  <Truck className={cn("h-8 w-8", allowsDelivery ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("font-medium", allowsDelivery ? "text-primary" : "text-muted-foreground")}>
                    Entrega
                  </span>
                  <Checkbox
                    checked={allowsDelivery}
                    onCheckedChange={(checked) => setAllowsDelivery(checked as boolean)}
                    className="sr-only"
                  />
                  {allowsDelivery && (
                    <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full" />
                  )}
                </label>

                <label
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-colors min-w-[120px]",
                    allowsPickup
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  <Store className={cn("h-8 w-8", allowsPickup ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("font-medium", allowsPickup ? "text-primary" : "text-muted-foreground")}>
                    Retirada
                  </span>
                  <Checkbox
                    checked={allowsPickup}
                    onCheckedChange={(checked) => setAllowsPickup(checked as boolean)}
                    className="sr-only"
                  />
                </label>
              </div>

              <Button onClick={handleSaveServiceSettings} disabled={isPending}>
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
