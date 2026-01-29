import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Store, 
  Phone, 
  Instagram, 
  Target, 
  Users,
  ArrowRight, 
  ArrowLeft,
  Loader2, 
  UtensilsCrossed,
  CheckCircle2,
  X,
  Truck,
  ShoppingBag,
  Check,
  Utensils,
  Smartphone,
  BarChart3,
  Clock,
  MapPin,
  CreditCard,
  Banknote,
  QrCode,
  Timer,
  DollarSign,
  Info,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Opções de objetivos
const OBJECTIVES = [
  { id: "sell_online", label: "Vender online" },
  { id: "digital_menu", label: "Ter um cardápio digital" },
  { id: "table_orders", label: "Receber pedidos na mesa" },
  { id: "organize_orders", label: "Organizar pedidos" },
  { id: "reduce_marketplaces", label: "Reduzir uso de marketplaces" },
  { id: "others", label: "Outros" },
];

// Opções de como conheceu
const HOW_FOUND = [
  { id: "referral", label: "Por indicação" },
  { id: "google", label: "Pelo Google" },
  { id: "other_menu", label: "Vi em outro estabelecimento" },
  { id: "social_media", label: "Pelas redes sociais" },
];

// Opções de tipo de entrega
const DELIVERY_TYPES = [
  { id: "delivery", label: "Delivery", icon: Truck, description: "Entrega no endereço do cliente" },
  { id: "pickup", label: "Retirada", icon: ShoppingBag, description: "Cliente retira no local" },
  { id: "both", label: "Ambos", icon: Check, description: "Delivery e retirada" },
];

// Opções de forma de pagamento
const PAYMENT_METHODS = [
  { id: "pix", label: "Pix", icon: QrCode },
  { id: "cash", label: "Dinheiro", icon: Banknote },
  { id: "card", label: "Cartão", icon: CreditCard },
];

// Opções de taxa de entrega
const DELIVERY_FEE_TYPES = [
  { id: "free", label: "Grátis" },
  { id: "fixed", label: "Taxa fixa" },
  { id: "neighborhood", label: "Por bairros" },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [showSuccessBadge, setShowSuccessBadge] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const utils = trpc.useUtils();
  
  // Form state - Step 1 (Dados do estabelecimento)
  const [name, setName] = useState("");
  const [menuSlug, setMenuSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  
  // Form state - Step 2 (Configurações de Atendimento)
  const [address, setAddress] = useState("");
  const [openingTime, setOpeningTime] = useState("18:00");
  const [closingTime, setClosingTime] = useState("23:00");
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>(["pix"]);
  const [minDeliveryTime, setMinDeliveryTime] = useState("20");
  const [maxDeliveryTime, setMaxDeliveryTime] = useState("50");
  const [hasMinOrder, setHasMinOrder] = useState(false);
  const [minOrderValue, setMinOrderValue] = useState("");
  const [deliveryFeeType, setDeliveryFeeType] = useState("free");
  const [fixedDeliveryFee, setFixedDeliveryFee] = useState("");
  
  // Form state - Step 3 (Objetivos)
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [otherObjective, setOtherObjective] = useState("");
  const [howFound, setHowFound] = useState("");
  const [otherHowFound, setOtherHowFound] = useState("");

  const createEstablishmentMutation = trpc.establishment.create.useMutation({
    onSuccess: async () => {
      toast.success("Restaurante cadastrado com sucesso!");
      await utils.establishment.get.invalidate();
      await utils.auth.me.invalidate();
      window.location.href = "/";
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao cadastrar restaurante. Tente novamente.");
    },
  });

  // Format WhatsApp number
  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Format currency
  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // Generate slug from name
  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!menuSlug || menuSlug === generateSlug(name)) {
      setMenuSlug(generateSlug(value));
    }
  };

  const handleObjectiveToggle = (objectiveId: string) => {
    setSelectedObjectives(prev => 
      prev.includes(objectiveId) 
        ? prev.filter(id => id !== objectiveId)
        : [...prev, objectiveId]
    );
  };

  const handlePaymentMethodToggle = (methodId: string) => {
    setSelectedPaymentMethods(prev => 
      prev.includes(methodId) 
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        toast.error("Por favor, informe o nome do estabelecimento.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createEstablishmentMutation.mutate({
      name: name.trim(),
      menuSlug: menuSlug.trim() || undefined,
      whatsapp: whatsapp.replace(/\D/g, "") || undefined,
    });
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {/* Step 1 */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
          currentStep >= 1 
            ? "bg-primary text-white" 
            : "bg-gray-200 text-gray-500"
        }`}>
          {currentStep > 1 ? <Check className="h-4 w-4" /> : "1"}
        </div>
        <span className={`text-xs font-medium hidden sm:block ${
          currentStep >= 1 ? "text-gray-900" : "text-gray-500"
        }`}>
          Dados
        </span>
      </div>

      {/* Connector 1-2 */}
      <div className={`w-8 h-0.5 transition-all ${
        currentStep > 1 ? "bg-primary" : "bg-gray-200"
      }`} />

      {/* Step 2 */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
          currentStep >= 2 
            ? "bg-primary text-white" 
            : "bg-gray-200 text-gray-500"
        }`}>
          {currentStep > 2 ? <Check className="h-4 w-4" /> : "2"}
        </div>
        <span className={`text-xs font-medium hidden sm:block ${
          currentStep >= 2 ? "text-gray-900" : "text-gray-500"
        }`}>
          Atendimento
        </span>
      </div>

      {/* Connector 2-3 */}
      <div className={`w-8 h-0.5 transition-all ${
        currentStep > 2 ? "bg-primary" : "bg-gray-200"
      }`} />

      {/* Step 3 */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
          currentStep >= 3 
            ? "bg-primary text-white" 
            : "bg-gray-200 text-gray-500"
        }`}>
          3
        </div>
        <span className={`text-xs font-medium hidden sm:block ${
          currentStep >= 3 ? "text-gray-900" : "text-gray-500"
        }`}>
          Objetivos
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left side - Background with promotional content */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-red-600 via-red-700 to-red-900 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        
        {/* Decorative icons */}
        <div className="absolute top-1/4 right-1/4 text-white/10">
          <Utensils className="w-32 h-32" />
        </div>
        <div className="absolute bottom-1/3 left-1/4 text-white/10">
          <Smartphone className="w-24 h-24" />
        </div>
        <div className="absolute top-2/3 right-1/3 text-white/10">
          <BarChart3 className="w-20 h-20" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">Mindi</span>
          </div>
          
          {/* Main headline */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Gerencie seu restaurante de um jeito simples e inteligente.
          </h1>
          
          <p className="text-lg text-white/80 mb-8 max-w-lg">
            Cardápio digital, gestão de pedidos, controle de estoque e muito mais — tudo em uma única plataforma pensada para o seu negócio crescer.
          </p>
          
          {/* Features list */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Smartphone className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">Cardápio Digital</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <BarChart3 className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">Relatórios Completos</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Clock className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">Gestão de Pedidos</span>
            </div>
          </div>
          
          {/* Social proof */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">JM</div>
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">AS</div>
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">PL</div>
              <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold">RC</div>
            </div>
            <span className="text-white/80 text-sm">
              Junte-se a mais de <strong className="text-white">500+</strong> restaurantes satisfeitos
            </span>
          </div>
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 bg-gray-50 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Success Badge - Only show on Step 1 */}
          {showSuccessBadge && currentStep === 1 && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 relative">
              <button
                onClick={() => setShowSuccessBadge(false)}
                className="absolute top-3 right-3 text-green-600 hover:text-green-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 text-base">Conta criada com sucesso!</h3>
                  <p className="text-sm text-green-700">
                    Agora vamos cadastrar seu restaurante
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Logo - Mobile only */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Mindi</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentStep === 1 && "Cadastre seu Restaurante"}
              {currentStep === 2 && "Configurações de Atendimento"}
              {currentStep === 3 && "Seus Objetivos"}
            </h2>
            <p className="text-gray-600">
              {currentStep === 1 && "Preencha os dados básicos do seu estabelecimento"}
              {currentStep === 2 && "Configure como seu restaurante vai atender"}
              {currentStep === 3 && "Conte-nos mais sobre seus objetivos"}
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator />

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Step 1: Dados do estabelecimento */}
            {currentStep === 1 && (
              <div className="space-y-5">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-900">
                    Nome do estabelecimento <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ex: Pizzaria do João"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="h-14 pl-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-base"
                    />
                  </div>
                </div>

                {/* Link público */}
                <div className="space-y-2">
                  <Label htmlFor="menuSlug" className="text-sm font-semibold text-gray-900">
                    Link público do cardápio
                  </Label>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 bg-gray-100 px-4 h-14 flex items-center rounded-l-xl border border-r-0 border-gray-200">
                      mindi.com.br/
                    </span>
                    <div className="relative flex-1">
                      <Input
                        id="menuSlug"
                        type="text"
                        placeholder="seu-restaurante"
                        value={menuSlug}
                        onChange={(e) => setMenuSlug(generateSlug(e.target.value))}
                        className="h-14 rounded-l-none rounded-r-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp e Instagram lado a lado */}
                <div className="grid grid-cols-2 gap-4">
                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-sm font-semibold text-gray-900">
                      WhatsApp
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                        className="h-14 pl-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-base"
                      />
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="text-sm font-semibold text-gray-900">
                      Instagram
                    </Label>
                    <div className="relative">
                      <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="instagram"
                        type="text"
                        placeholder="@seu_restaurante"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        className="h-14 pl-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Tipo de entrega */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">
                    Tipo de entrega
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {DELIVERY_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = deliveryType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setDeliveryType(type.id)}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            isSelected 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-gray-200 hover:border-gray-300 text-gray-600"
                          }`}
                        >
                          <Icon className={`h-6 w-6 ${isSelected ? "text-primary" : "text-gray-400"}`} />
                          <span className="text-sm font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Next button */}
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200 text-base"
                >
                  Continuar
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Configurações de Atendimento */}
            {currentStep === 2 && (
              <div className="space-y-5">
                {/* Endereço */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-gray-900">
                    Endereço do estabelecimento
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="address"
                      type="text"
                      placeholder="Rua, número, bairro - Cidade/UF"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-14 pl-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-base"
                    />
                  </div>
                </div>

                {/* Horário de atendimento */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">
                    Horário de atendimento
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="time"
                        value={openingTime}
                        onChange={(e) => setOpeningTime(e.target.value)}
                        className="h-14 pl-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-base"
                      />
                    </div>
                    <span className="text-gray-500 font-medium">às</span>
                    <div className="relative flex-1">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="time"
                        value={closingTime}
                        onChange={(e) => setClosingTime(e.target.value)}
                        className="h-14 pl-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Formas de pagamento */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">
                    Formas de pagamento aceitas
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const isSelected = selectedPaymentMethods.includes(method.id);
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => handlePaymentMethodToggle(method.id)}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            isSelected 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-gray-200 hover:border-gray-300 text-gray-600"
                          }`}
                        >
                          <Icon className={`h-6 w-6 ${isSelected ? "text-primary" : "text-gray-400"}`} />
                          <span className="text-sm font-medium">{method.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tempo de entrega */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">
                    Tempo de entrega
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Timer className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="20"
                        value={minDeliveryTime}
                        onChange={(e) => setMinDeliveryTime(e.target.value)}
                        className="h-14 pl-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-base"
                      />
                    </div>
                    <span className="text-gray-500 font-medium">até</span>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        placeholder="50"
                        value={maxDeliveryTime}
                        onChange={(e) => setMaxDeliveryTime(e.target.value)}
                        className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-base"
                      />
                    </div>
                    <span className="text-gray-500 font-medium text-sm">min</span>
                  </div>
                </div>

                {/* Pedido mínimo */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-900">
                      Pedido mínimo
                    </Label>
                    <Switch
                      checked={hasMinOrder}
                      onCheckedChange={setHasMinOrder}
                    />
                  </div>
                  {hasMinOrder && (
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="R$ 0,00"
                        value={minOrderValue}
                        onChange={(e) => setMinOrderValue(formatCurrency(e.target.value))}
                        className="h-14 pl-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-base"
                      />
                    </div>
                  )}
                </div>

                {/* Taxa de entrega */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-900">
                    Taxa de entrega
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {DELIVERY_FEE_TYPES.map((type) => {
                      const isSelected = deliveryFeeType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setDeliveryFeeType(type.id)}
                          className={`p-3 rounded-xl border-2 transition-all text-center ${
                            isSelected 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-gray-200 hover:border-gray-300 text-gray-600"
                          }`}
                        >
                          <span className="text-sm font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Campo de taxa fixa */}
                  {deliveryFeeType === "fixed" && (
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="R$ 0,00"
                        value={fixedDeliveryFee}
                        onChange={(e) => setFixedDeliveryFee(formatCurrency(e.target.value))}
                        className="h-14 pl-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-base"
                      />
                    </div>
                  )}

                  {/* Aviso para taxa por bairros */}
                  {deliveryFeeType === "neighborhood" && (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800">
                        Você poderá configurar as taxas por bairro nas <strong>Configurações do Estabelecimento</strong>.
                      </p>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="flex-1 h-14 rounded-xl border-gray-200 text-gray-700 font-semibold text-base"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200 text-base"
                  >
                    Continuar
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Objetivos */}
            {currentStep === 3 && (
              <div className="space-y-5">
                {/* Objetivos */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Target className="h-5 w-5 text-primary" />
                    Quais são seus objetivos com a nossa plataforma? <span className="text-red-500">*</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {OBJECTIVES.map((objective) => {
                      const isSelected = selectedObjectives.includes(objective.id);
                      return (
                        <button
                          key={objective.id}
                          type="button"
                          onClick={() => handleObjectiveToggle(objective.id)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected 
                                ? "border-primary bg-primary" 
                                : "border-gray-300"
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                              {objective.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Campo condicional para "Outros" */}
                  {selectedObjectives.includes("others") && (
                    <Textarea
                      placeholder="Descreva brevemente seu objetivo"
                      value={otherObjective}
                      onChange={(e) => setOtherObjective(e.target.value)}
                      className="rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-base"
                      rows={2}
                    />
                  )}
                </div>

                {/* Como conheceu */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Users className="h-5 w-5 text-primary" />
                    Como você conheceu nossa plataforma? <span className="text-red-500">*</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {HOW_FOUND.map((option) => {
                      const isSelected = howFound === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setHowFound(option.id)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected 
                                ? "border-primary" 
                                : "border-gray-300"
                            }`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                              {option.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="flex-1 h-14 rounded-xl border-gray-200 text-gray-700 font-semibold text-base"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEstablishmentMutation.isPending}
                    className="flex-1 h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200 text-base"
                  >
                    {createEstablishmentMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      <>
                        Finalizar
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-sm text-center text-gray-500">
                  Você poderá editar todas essas informações depois
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
