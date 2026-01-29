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
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  { id: "others", label: "Outros" },
];

// Opções de tipo de entrega
const DELIVERY_TYPES = [
  { id: "delivery", label: "Delivery", icon: Truck, description: "Entrega no endereço do cliente" },
  { id: "pickup", label: "Retirada", icon: ShoppingBag, description: "Cliente retira no local" },
  { id: "both", label: "Ambos", icon: Check, description: "Delivery e retirada" },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [showSuccessBadge, setShowSuccessBadge] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const utils = trpc.useUtils();
  
  // Form state - Step 1
  const [name, setName] = useState("");
  const [menuSlug, setMenuSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  
  // Form state - Step 2
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

  const handleNextStep = () => {
    if (!name.trim()) {
      toast.error("Por favor, informe o nome do estabelecimento.");
      return;
    }
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
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
    <div className="flex items-center justify-center gap-3 mb-6">
      {/* Step 1 */}
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
          currentStep >= 1 
            ? "bg-primary text-white" 
            : "bg-gray-200 text-gray-500"
        }`}>
          {currentStep > 1 ? <Check className="h-3.5 w-3.5" /> : "1"}
        </div>
        <span className={`text-xs font-medium hidden sm:block ${
          currentStep >= 1 ? "text-gray-900" : "text-gray-500"
        }`}>
          Dados do estabelecimento
        </span>
      </div>

      {/* Connector */}
      <div className={`w-8 h-0.5 transition-all ${
        currentStep > 1 ? "bg-primary" : "bg-gray-200"
      }`} />

      {/* Step 2 */}
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
          currentStep >= 2 
            ? "bg-primary text-white" 
            : "bg-gray-200 text-gray-500"
        }`}>
          2
        </div>
        <span className={`text-xs font-medium hidden sm:block ${
          currentStep >= 2 ? "text-gray-900" : "text-gray-500"
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
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Gerencie seu restaurante de um jeito simples e inteligente.
            </h1>
            <p className="text-white/80 text-lg mb-8">
              Cardápio digital, gestão de pedidos, controle de estoque e muito mais — tudo em uma única plataforma pensada para o seu negócio crescer.
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap gap-3">
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
      <div className="w-full lg:w-1/2 xl:w-2/5 bg-gray-50 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Success Badge */}
          {showSuccessBadge && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 relative">
              <button
                onClick={() => setShowSuccessBadge(false)}
                className="absolute top-2 right-2 text-green-600 hover:text-green-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 text-sm">Conta criada com sucesso!</h3>
                  <p className="text-xs text-green-700">
                    Agora vamos cadastrar seu restaurante
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Logo - Mobile only */}
          <div className="flex items-center justify-center gap-3 mb-4 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Mindi</span>
          </div>

          {/* Header */}
          <div className="text-center mb-2">
            <h2 className="text-lg font-bold text-primary">
              {currentStep === 1 ? "Cadastre seu Restaurante" : "Seus Objetivos"}
            </h2>
            <p className="text-gray-500 text-xs">
              {currentStep === 1 
                ? "Preencha os dados básicos do seu estabelecimento" 
                : "Conte-nos mais sobre seus objetivos"}
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator />

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Step 1: Dados do estabelecimento */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* Nome */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-900">
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
                      className="h-12 pl-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm"
                    />
                  </div>
                </div>

                {/* Link público */}
                <div className="space-y-1.5">
                  <Label htmlFor="menuSlug" className="text-sm font-semibold text-gray-900">
                    Link público do cardápio
                  </Label>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-3.5 rounded-l-xl border border-r-0 border-gray-200">
                      mindi.com.br/
                    </span>
                    <div className="relative flex-1">
                      <Input
                        id="menuSlug"
                        type="text"
                        placeholder="seu-restaurante"
                        value={menuSlug}
                        onChange={(e) => setMenuSlug(generateSlug(e.target.value))}
                        className="h-12 rounded-l-none rounded-r-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp" className="text-sm font-semibold text-gray-900">
                    WhatsApp do restaurante
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                      className="h-12 pl-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm"
                    />
                  </div>
                </div>

                {/* Instagram */}
                <div className="space-y-1.5">
                  <Label htmlFor="instagram" className="text-sm font-semibold text-gray-900">
                    Instagram do restaurante
                  </Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="instagram"
                      type="text"
                      placeholder="@seu_restaurante"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="h-12 pl-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm"
                    />
                  </div>
                </div>

                {/* Tipo de entrega */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">
                    Tipo de entrega
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {DELIVERY_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = deliveryType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setDeliveryType(type.id)}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                            isSelected 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-gray-200 hover:border-gray-300 text-gray-600"
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-gray-400"}`} />
                          <span className="text-xs font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Next button */}
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200 text-sm mt-2"
                >
                  Continuar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Objetivos */}
            {currentStep === 2 && (
              <div className="space-y-5">
                {/* Objetivos */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Target className="h-4 w-4 text-primary" />
                    Quais são seus objetivos com a nossa plataforma? <span className="text-red-500">*</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {OBJECTIVES.map((objective) => {
                      const isSelected = selectedObjectives.includes(objective.id);
                      return (
                        <button
                          key={objective.id}
                          type="button"
                          onClick={() => handleObjectiveToggle(objective.id)}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected 
                                ? "border-primary bg-primary" 
                                : "border-gray-300"
                            }`}>
                              {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <span className={`text-xs font-medium ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
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
                      className="rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm"
                      rows={2}
                    />
                  )}
                </div>

                {/* Como conheceu */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Users className="h-4 w-4 text-primary" />
                    Como você conheceu nossa plataforma? <span className="text-red-500">*</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {HOW_FOUND.map((option) => {
                      const isSelected = howFound === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setHowFound(option.id)}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected 
                                ? "border-primary" 
                                : "border-gray-300"
                            }`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <span className={`text-xs font-medium ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                              {option.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Campo condicional para "Outros" */}
                  {howFound === "others" && (
                    <Input
                      placeholder="Como você nos conheceu?"
                      value={otherHowFound}
                      onChange={(e) => setOtherHowFound(e.target.value)}
                      className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-sm"
                    />
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="flex-1 h-12 rounded-xl border-gray-200 text-gray-700 font-semibold text-sm"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEstablishmentMutation.isPending}
                    className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200 text-sm"
                  >
                    {createEstablishmentMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      <>
                        Finalizar
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-500">
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
