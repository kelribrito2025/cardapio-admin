import { useState, useEffect } from "react";
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
  Building2,
  Crown,
  Zap,
  Gift
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

// Opções de planos
const PLANS = [
  { 
    id: "free", 
    name: "Gratuito", 
    price: "R$ 0",
    period: "15 dias de teste",
    icon: Gift,
    features: [
      "Cardápio digital ilimitado",
      "Gestão de pedidos",
      "Relatórios básicos",
    ],
    highlight: false,
    badge: "Teste grátis"
  },
  { 
    id: "lite", 
    name: "Lite", 
    price: "R$ 49,90",
    period: "/mês",
    icon: Zap,
    features: [
      "Tudo do Gratuito +",
      "WhatsApp integrado",
      "Cupons de desconto",
      "Suporte prioritário",
    ],
    highlight: false,
    badge: null
  },
  { 
    id: "pro", 
    name: "Pro", 
    price: "R$ 99,90",
    period: "/mês",
    icon: Crown,
    features: [
      "Tudo do Lite +",
      "Múltiplas impressoras",
      "Programa de fidelidade",
      "Relatórios avançados",
      "API personalizada",
    ],
    highlight: true,
    badge: "Mais popular"
  },
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
  
  // Form state - Step 4 (Planos)
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [slugToCheck, setSlugToCheck] = useState("");

  // Debounce slug check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (menuSlug.trim().length >= 3) {
        setSlugToCheck(menuSlug.trim());
      } else {
        setSlugToCheck("");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [menuSlug]);

  // Check slug availability
  const slugAvailabilityQuery = trpc.establishment.checkSlugAvailability.useQuery(
    { slug: slugToCheck },
    { enabled: slugToCheck.length >= 3 }
  );

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

  // Format Instagram with @ prefix
  const formatInstagram = (value: string) => {
    // Remove any existing @ and spaces
    let cleaned = value.replace(/^@+/, "").replace(/\s/g, "");
    // If empty, return empty
    if (!cleaned) return "";
    // Always add @ prefix
    return "@" + cleaned;
  };

  // Validation for Step 1 - includes slug availability check, Instagram and WhatsApp
  const isSlugAvailable = menuSlug.length >= 3 && slugAvailabilityQuery.data?.available === true;
  const isInstagramValid = instagram.trim() !== "" && instagram.trim() !== "@";
  const isWhatsAppValid = whatsapp.replace(/\D/g, "").length >= 10; // At least 10 digits (DDD + number)
  const isStep1Valid = name.trim() !== "" && menuSlug.trim() !== "" && deliveryType !== "" && isSlugAvailable && isInstagramValid && isWhatsAppValid;

  // Validation for Step 2
  const isStep2Valid = address.trim() !== "" && openingTime !== "" && closingTime !== "" && selectedPaymentMethods.length > 0;

  // Validation for Step 3
  const isStep3Valid = selectedObjectives.length > 0 && howFound !== "";

  // Validation for Step 4
  const isStep4Valid = selectedPlan !== "";

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
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mapear deliveryFeeType para o formato do banco
    const mappedDeliveryFeeType = deliveryFeeType === "neighborhood" ? "byNeighborhood" : deliveryFeeType as "free" | "fixed" | "byNeighborhood";

    createEstablishmentMutation.mutate({
      // Step 1 - Dados do estabelecimento
      name: name.trim(),
      menuSlug: menuSlug.trim() || undefined,
      whatsapp: whatsapp.replace(/\D/g, "") || undefined,
      instagram: instagram.trim() || undefined,
      allowsDelivery: deliveryType === "delivery" || deliveryType === "both",
      allowsPickup: deliveryType === "pickup" || deliveryType === "both",
      
      // Step 2 - Configurações de Atendimento
      address: address.trim() || undefined,
      openingTime: openingTime || undefined,
      closingTime: closingTime || undefined,
      acceptsPix: selectedPaymentMethods.includes("pix"),
      acceptsCash: selectedPaymentMethods.includes("cash"),
      acceptsCard: selectedPaymentMethods.includes("card"),
      deliveryTimeEnabled: true,
      deliveryTimeMin: parseInt(minDeliveryTime) || 20,
      deliveryTimeMax: parseInt(maxDeliveryTime) || 50,
      minimumOrderEnabled: hasMinOrder,
      minimumOrderValue: hasMinOrder && minOrderValue ? minOrderValue.replace(/[^\d,]/g, "").replace(",", ".") : "0",
      deliveryFeeType: mappedDeliveryFeeType,
      deliveryFeeFixed: deliveryFeeType === "fixed" && fixedDeliveryFee ? fixedDeliveryFee.replace(/[^\d,]/g, "").replace(",", ".") : "0",
    });
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-0.5 sm:gap-1 xl:gap-2 mb-2 lg:mb-4 xl:mb-5 2xl:mb-6 flex-wrap">
      {/* Step 1 */}
      <div className="flex items-center gap-1">
        <div className={`w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 2xl:w-8 2xl:h-8 rounded-full flex items-center justify-center text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-semibold transition-all ${
          currentStep >= 1 
            ? "bg-primary text-white" 
            : "bg-gray-200 text-gray-500"
        }`}>
          {currentStep > 1 ? <Check className="h-3 w-3" /> : "1"}
        </div>
        <span className={`text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-medium hidden sm:block ${
          currentStep >= 1 ? "text-gray-900" : "text-gray-500"
        }`}>
          Dados
        </span>
      </div>

      {/* Connector 1-2 */}
      <div className={`w-3 sm:w-4 lg:w-6 xl:w-8 2xl:w-10 h-0.5 transition-all ${
        currentStep > 1 ? "bg-primary" : "bg-gray-200"
      }`} />

      {/* Step 2 */}
      <div className="flex items-center gap-1">
        <div className={`w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 2xl:w-8 2xl:h-8 rounded-full flex items-center justify-center text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-semibold transition-all ${
          currentStep >= 2 
            ? "bg-primary text-white" 
            : "bg-gray-200 text-gray-500"
        }`}>
          {currentStep > 2 ? <Check className="h-3 w-3" /> : "2"}
        </div>
        <span className={`text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-medium hidden sm:block ${
          currentStep >= 2 ? "text-gray-900" : "text-gray-500"
        }`}>
          Atendimento
        </span>
      </div>

      {/* Connector 2-3 */}
      <div className={`w-3 sm:w-4 lg:w-6 xl:w-8 2xl:w-10 h-0.5 transition-all ${
        currentStep > 2 ? "bg-primary" : "bg-gray-200"
      }`} />

      {/* Step 3 */}
      <div className="flex items-center gap-1">
        <div className={`w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 2xl:w-8 2xl:h-8 rounded-full flex items-center justify-center text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-semibold transition-all ${
          currentStep >= 3 
            ? "bg-primary text-white" 
            : "bg-gray-200 text-gray-500"
        }`}>
          {currentStep > 3 ? <Check className="h-3 w-3" /> : "3"}
        </div>
        <span className={`text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-medium hidden sm:block ${
          currentStep >= 3 ? "text-gray-900" : "text-gray-500"
        }`}>
          Objetivos
        </span>
      </div>

      {/* Connector 3-4 */}
      <div className={`w-3 sm:w-4 lg:w-6 xl:w-8 2xl:w-10 h-0.5 transition-all ${
        currentStep > 3 ? "bg-primary" : "bg-gray-200"
      }`} />

      {/* Step 4 */}
      <div className="flex items-center gap-1">
        <div className={`w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 2xl:w-8 2xl:h-8 rounded-full flex items-center justify-center text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-semibold transition-all ${
          currentStep >= 4 
            ? "bg-primary text-white" 
            : "bg-gray-200 text-gray-500"
        }`}>
          4
        </div>
        <span className={`text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-medium hidden sm:block ${
          currentStep >= 4 ? "text-gray-900" : "text-gray-500"
        }`}>
          Plano
        </span>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] flex overflow-hidden">
      {/* Left side - Background with promotional content */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/gerente-restaurante.png)' }}
        />
        {/* Red overlay with 60% opacity (40% transparency) */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/60 via-red-700/60 to-red-900/60" />
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        
        {/* Logo - Fixed at top */}
        <div className="absolute top-12 left-12 z-20 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <Utensils className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-white text-2xl font-bold">Mindi</span>
        </div>
        
        {/* Content - Bottom aligned */}
        <div className="relative z-10 flex flex-col justify-end p-12 w-full h-full">
          {/* Main text */}
          <div className="max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6" style={{marginRight: '-130px'}}>
              Gerencie seu restaurante de um jeito simples e inteligente.
            </h1>
            <p className="text-white/80 text-lg mb-8" style={{marginRight: '-130px'}}>
              Cardápio digital, gestão de pedidos, controle de estoque e muito mais — tudo em uma única plataforma pensada para o seu negócio crescer.
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap gap-3" style={{marginRight: '-123px'}}>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <Smartphone className="w-4 h-4" />
                <span>Cardápio Digital</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <BarChart3 className="w-4 h-4" />
                <span>Relatórios Completos</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <Clock className="w-4 h-4" />
                <span>Gestão de Pedidos</span>
              </div>
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
      <div className="w-full lg:w-1/2 xl:w-[45%] bg-gray-50 h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6 xl:p-8 2xl:p-10 flex items-start xl:items-center justify-center">
          <div className="w-full max-w-md xl:max-w-lg 2xl:max-w-xl py-4 xl:py-6 2xl:py-8">
          {/* Success Badge - Only show on Step 1 */}
          {showSuccessBadge && currentStep === 1 && (
            <div className="mb-2 lg:mb-4 bg-green-50 border border-green-200 rounded-lg p-2 lg:p-3 relative">
              <button
                onClick={() => setShowSuccessBadge(false)}
                className="absolute top-1.5 right-1.5 lg:top-2 lg:right-2 text-green-600 hover:text-green-800 transition-colors"
              >
                <X className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 lg:w-8 lg:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 text-xs lg:text-sm">Conta criada com sucesso!</h3>
                  <p className="text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-green-700">
                    Agora vamos cadastrar seu restaurante
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Logo - Mobile only */}
          <div className="flex items-center gap-2 mb-2 lg:mb-4 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md shadow-red-500/30">
              <UtensilsCrossed className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Mindi</span>
          </div>

          {/* Header */}
          <div className="mb-2 lg:mb-4 xl:mb-5 2xl:mb-6">
            <h2 className="text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-gray-900 mb-0.5 lg:mb-1 xl:mb-2">
              {currentStep === 1 && "Cadastre seu Restaurante"}
              {currentStep === 2 && "Configurações de Atendimento"}
              {currentStep === 3 && "Seus Objetivos"}
              {currentStep === 4 && "Escolha seu Plano"}
            </h2>
            <p className="text-xs lg:text-sm xl:text-base 2xl:text-lg text-gray-600">
              {currentStep === 1 && "Preencha os dados básicos do seu estabelecimento"}
              {currentStep === 2 && "Configure como seu restaurante vai atender"}
              {currentStep === 3 && "Conte-nos mais sobre seus objetivos"}
              {currentStep === 4 && "Comece gratuitamente e faça upgrade quando quiser"}
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator />

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Step 1: Dados do estabelecimento */}
            {currentStep === 1 && (
              <div className="space-y-2 lg:space-y-4 xl:space-y-5 2xl:space-y-6">
                {/* Nome */}
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs lg:text-sm xl:text-base 2xl:text-lg font-semibold text-gray-900">
                    Nome do estabelecimento <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ex: Pizzaria do João"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="h-10 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm lg:text-base xl:text-lg"
                    />
                  </div>
                </div>

                {/* Link público */}
                <div className="space-y-1">
                  <Label htmlFor="menuSlug" className="text-xs lg:text-sm xl:text-base 2xl:text-lg font-semibold text-gray-900">
                    Link público do cardápio
                  </Label>
                  <div className="flex items-center">
                    <span className="text-xs lg:text-sm text-gray-500 bg-gray-100 px-3 h-10 lg:h-12 xl:h-13 2xl:h-14 flex items-center rounded-l-lg border border-r-0 border-gray-200">
                      mindi.com.br/
                    </span>
                    <div className="relative flex-1">
                      <Input
                        id="menuSlug"
                        type="text"
                        placeholder="seu-restaurante"
                        value={menuSlug}
                        onChange={(e) => setMenuSlug(generateSlug(e.target.value))}
                        className={`h-10 lg:h-12 xl:h-13 2xl:h-14 rounded-l-none rounded-r-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm lg:text-base xl:text-lg pr-10 ${
                          menuSlug.length >= 3 && slugAvailabilityQuery.data?.available === false ? 'border-red-300 focus:border-red-500' : ''
                        } ${
                          menuSlug.length >= 3 && slugAvailabilityQuery.data?.available === true ? 'border-green-300 focus:border-green-500' : ''
                        }`}
                      />
                      {/* Slug availability indicator */}
                      {menuSlug.length >= 3 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {slugAvailabilityQuery.isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          ) : slugAvailabilityQuery.data?.available ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {menuSlug.length >= 3 && slugAvailabilityQuery.data?.available === false && (
                    <p className="text-xs text-red-500 mt-1">Este link já está em uso. Escolha outro.</p>
                  )}
                  {menuSlug.length >= 3 && slugAvailabilityQuery.data?.available === true && (
                    <p className="text-xs text-green-500 mt-1">Link disponível!</p>
                  )}
                </div>

                {/* WhatsApp e Instagram lado a lado */}
                <div className="grid grid-cols-2 gap-2 lg:gap-3">
                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <Label htmlFor="whatsapp" className="text-xs lg:text-sm xl:text-base 2xl:text-lg font-semibold text-gray-900">
                      WhatsApp
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                        className="h-10 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm lg:text-base xl:text-lg"
                      />
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="space-y-1">
                    <Label htmlFor="instagram" className="text-xs lg:text-sm xl:text-base 2xl:text-lg font-semibold text-gray-900">
                      Instagram
                    </Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="instagram"
                        type="text"
                        placeholder="@seu_restaurante"
                        value={instagram}
                        onChange={(e) => setInstagram(formatInstagram(e.target.value))}
                        className="h-10 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm lg:text-base xl:text-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Tipo de entrega */}
                <div className="space-y-1">
                  <Label className="text-xs lg:text-sm xl:text-base 2xl:text-lg font-semibold text-gray-900">
                    Tipo de entrega
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
                    {DELIVERY_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = deliveryType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setDeliveryType(type.id)}
                          className={`p-2 lg:p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                            isSelected 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-gray-200 hover:border-gray-300 text-gray-600"
                          }`}
                        >
                          <Icon className={`h-4 w-4 lg:h-5 lg:w-5 ${isSelected ? "text-primary" : "text-gray-400"}`} />
                          <span className="text-xs lg:text-sm font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Next button */}
                <div className="pt-2 lg:pt-4">
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!isStep1Valid}
                    className="w-full h-10 lg:h-12 xl:h-13 2xl:h-14 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200 text-sm lg:text-base xl:text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 ml-2" />
                  </Button>
                  
                  {/* Link para voltar ao login */}
                  <a
                    href="/login"
                    className="flex items-center justify-center gap-1.5 text-xs lg:text-sm xl:text-base text-gray-500 hover:text-gray-700 transition-colors mt-3 lg:mt-4"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    Voltar
                  </a>
                </div>
              </div>
            )}

            {/* Step 2: Configurações de Atendimento */}
            {currentStep === 2 && (
              <div className="space-y-2 lg:space-y-3">
                {/* Endereço */}
                <div className="space-y-1">
                  <Label htmlFor="address" className="text-xs lg:text-sm xl:text-base 2xl:text-lg font-semibold text-gray-900">
                    Endereço do estabelecimento
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="address"
                      type="text"
                      placeholder="Rua, número, bairro - Cidade/UF"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-10 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm lg:text-base xl:text-lg"
                    />
                  </div>
                </div>

                {/* Horário de atendimento */}
                <div className="space-y-1">
                  <Label className="text-xs lg:text-sm xl:text-base 2xl:text-lg font-semibold text-gray-900">
                    Horário de atendimento
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="time"
                        value={openingTime}
                        onChange={(e) => setOpeningTime(e.target.value)}
                        className="h-10 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm lg:text-base xl:text-lg"
                      />
                    </div>
                    <span className="text-gray-500 font-medium text-xs lg:text-sm">às</span>
                    <div className="relative flex-1">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="time"
                        value={closingTime}
                        onChange={(e) => setClosingTime(e.target.value)}
                        className="h-10 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm lg:text-base xl:text-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Formas de pagamento */}
                <div className="space-y-1">
                  <Label className="text-xs lg:text-sm xl:text-base 2xl:text-lg font-semibold text-gray-900">
                    Formas de pagamento aceitas
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const isSelected = selectedPaymentMethods.includes(method.id);
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => handlePaymentMethodToggle(method.id)}
                          className={`p-2 lg:p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                            isSelected 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-gray-200 hover:border-gray-300 text-gray-600"
                          }`}
                        >
                          <Icon className={`h-4 w-4 lg:h-5 lg:w-5 ${isSelected ? "text-primary" : "text-gray-400"}`} />
                          <span className="text-xs lg:text-sm font-medium">{method.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tempo de entrega */}
                <div className="space-y-1">
                  <Label className="text-xs lg:text-sm xl:text-base 2xl:text-lg font-semibold text-gray-900">
                    Tempo de entrega
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Timer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="20"
                        value={minDeliveryTime}
                        onChange={(e) => setMinDeliveryTime(e.target.value)}
                        className="h-10 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm lg:text-base xl:text-lg"
                      />
                    </div>
                    <span className="text-gray-500 font-medium text-xs lg:text-sm">até</span>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        placeholder="50"
                        value={maxDeliveryTime}
                        onChange={(e) => setMaxDeliveryTime(e.target.value)}
                        className="h-10 lg:h-12 xl:h-13 2xl:h-14 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm lg:text-base xl:text-lg"
                      />
                    </div>
                    <span className="text-gray-500 font-medium text-xs">min</span>
                  </div>
                </div>

                {/* Pedido mínimo */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs lg:text-sm xl:text-base 2xl:text-lg font-semibold text-gray-900">
                      Pedido mínimo
                    </Label>
                    <Switch
                      checked={hasMinOrder}
                      onCheckedChange={setHasMinOrder}
                    />
                  </div>
                  {hasMinOrder && (
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="R$ 0,00"
                        value={minOrderValue}
                        onChange={(e) => setMinOrderValue(formatCurrency(e.target.value))}
                        className="h-10 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm lg:text-base xl:text-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Taxa de entrega */}
                <div className="space-y-1">
                  <Label className="text-xs lg:text-sm xl:text-base 2xl:text-lg font-semibold text-gray-900">
                    Taxa de entrega
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
                    {DELIVERY_FEE_TYPES.map((type) => {
                      const isSelected = deliveryFeeType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setDeliveryFeeType(type.id)}
                          className={`p-2 lg:p-3 rounded-lg border-2 transition-all text-center ${
                            isSelected 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-gray-200 hover:border-gray-300 text-gray-600"
                          }`}
                        >
                          <span className="text-xs lg:text-sm font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Campo de taxa fixa */}
                  {deliveryFeeType === "fixed" && (
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="R$ 0,00"
                        value={fixedDeliveryFee}
                        onChange={(e) => setFixedDeliveryFee(formatCurrency(e.target.value))}
                        className="h-10 lg:h-12 xl:h-13 2xl:h-14 pl-10 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm lg:text-base xl:text-lg"
                      />
                    </div>
                  )}

                  {/* Aviso para taxa por bairros */}
                  {deliveryFeeType === "neighborhood" && (
                    <div className="flex items-start gap-2 p-2 lg:p-3 bg-blue-50 border border-blue-200 rounded-lg mt-1">
                      <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs lg:text-sm text-blue-800">
                        Você poderá configurar as taxas por bairro nas <strong>Configurações</strong>.
                      </p>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2 lg:gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="flex-1 h-10 lg:h-12 xl:h-13 2xl:h-14 rounded-lg border-gray-200 text-gray-700 font-semibold text-sm lg:text-base xl:text-lg"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Voltar
                  </Button>
<Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!isStep1Valid}
                    className="w-full h-10 lg:h-12 xl:h-13 2xl:h-14 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200 text-sm lg:text-base xl:text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 ml-2" />
                  </Button>
                  
                  {/* Link para voltar ao login */}
                  <a
                    href="/login"
                    className="flex items-center justify-center gap-1.5 text-xs lg:text-sm xl:text-base text-gray-500 hover:text-gray-700 transition-colors mt-3 lg:mt-4"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    Voltar ao login
                  </a>
                </div>
              </div>
            )}

            {/* Step 3: Objetivos */}
            {currentStep === 3 && (
              <div className="space-y-2 lg:space-y-3">
                {/* Objetivos */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs lg:text-sm font-semibold text-gray-900">
                    <Target className="h-4 w-4 text-primary" />
                    Quais são seus objetivos? <span className="text-red-500">*</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
                    {OBJECTIVES.map((objective) => {
                      const isSelected = selectedObjectives.includes(objective.id);
                      return (
                        <button
                          key={objective.id}
                          type="button"
                          onClick={() => handleObjectiveToggle(objective.id)}
                          className={`p-2 lg:p-3 rounded-lg border-2 transition-all text-left ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                              isSelected 
                                ? "border-primary bg-primary" 
                                : "border-gray-300"
                            }`}>
                              {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <span className={`text-xs lg:text-sm font-medium ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
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
                      className="rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm"
                      rows={2}
                    />
                  )}
                </div>

                {/* Como conheceu */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs lg:text-sm font-semibold text-gray-900">
                    <Users className="h-4 w-4 text-primary" />
                    Como conheceu a plataforma? <span className="text-red-500">*</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
                    {HOW_FOUND.map((option) => {
                      const isSelected = howFound === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setHowFound(option.id)}
                          className={`p-2 lg:p-3 rounded-lg border-2 transition-all text-left ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                              isSelected 
                                ? "border-primary" 
                                : "border-gray-300"
                            }`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <span className={`text-xs lg:text-sm font-medium ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                              {option.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                </div>

                {/* Buttons */}
                <div className="flex gap-2 lg:gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="flex-1 h-10 lg:h-12 xl:h-13 2xl:h-14 rounded-lg border-gray-200 text-gray-700 font-semibold text-sm lg:text-base xl:text-lg"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!isStep3Valid}
                    className="flex-1 h-10 lg:h-12 xl:h-13 2xl:h-14 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200 text-sm lg:text-base xl:text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Planos */}
            {currentStep === 4 && (
              <div className="space-y-2 lg:space-y-3">
                {/* Plans */}
                <div className="space-y-2">
                  {PLANS.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    const Icon = plan.icon;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`w-full p-2 lg:p-3 rounded-lg border-2 transition-all text-left relative ${
                          isSelected 
                            ? "border-primary bg-primary/5" 
                            : plan.highlight
                              ? "border-amber-300 bg-amber-50/50 hover:border-amber-400"
                              : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {/* Badge */}
                        {plan.badge && (
                          <span className={`absolute -top-2 right-3 px-1.5 py-0.5 text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-semibold rounded-full ${
                            plan.id === "pro" 
                              ? "bg-amber-500 text-white" 
                              : "bg-emerald-500 text-white"
                          }`}>
                            {plan.badge}
                          </span>
                        )}

                        <div className="flex items-start gap-2 lg:gap-3">
                          {/* Radio */}
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            isSelected 
                              ? "border-primary" 
                              : "border-gray-300"
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>

                          {/* Icon */}
                          <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            plan.id === "pro" 
                              ? "bg-amber-100 text-amber-600" 
                              : plan.id === "lite"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-emerald-100 text-emerald-600"
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5 mb-0.5">
                              <span className="font-semibold text-gray-900 text-xs lg:text-sm">{plan.name}</span>
                              <span className="text-sm lg:text-base xl:text-lg font-bold text-gray-900">{plan.price}</span>
                              <span className="text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-gray-500">{plan.period}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                              {plan.features.map((feature, idx) => (
                                <span key={idx} className="text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-gray-600 flex items-center gap-0.5">
                                  <Check className="h-2.5 w-2.5 text-emerald-500" />
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Buttons */}
                <div className="flex gap-2 lg:gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="flex-1 h-10 lg:h-12 xl:h-13 2xl:h-14 rounded-lg border-gray-200 text-gray-700 font-semibold text-sm lg:text-base xl:text-lg"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEstablishmentMutation.isPending || !isStep4Valid}
                    className="flex-1 h-10 lg:h-12 xl:h-13 2xl:h-14 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200 text-sm lg:text-base xl:text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {createEstablishmentMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      <>
                        Finalizar
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-center text-gray-500">
                  Você poderá alterar seu plano a qualquer momento
                </p>
              </div>
            )}
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
