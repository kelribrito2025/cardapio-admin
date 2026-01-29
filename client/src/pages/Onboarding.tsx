import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Store, 
  Link as LinkIcon, 
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
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
    <div className="flex items-center justify-center gap-3 mb-8">
      {/* Step 1 */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
          currentStep >= 1 
            ? "bg-primary text-white" 
            : "bg-gray-200 text-gray-500"
        }`}>
          {currentStep > 1 ? <Check className="h-4 w-4" /> : "1"}
        </div>
        <span className={`text-sm font-medium hidden sm:block ${
          currentStep >= 1 ? "text-gray-900" : "text-gray-500"
        }`}>
          Dados do estabelecimento
        </span>
      </div>

      {/* Connector */}
      <div className={`w-12 h-0.5 transition-all ${
        currentStep > 1 ? "bg-primary" : "bg-gray-200"
      }`} />

      {/* Step 2 */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
          currentStep >= 2 
            ? "bg-primary text-white" 
            : "bg-gray-200 text-gray-500"
        }`}>
          2
        </div>
        <span className={`text-sm font-medium hidden sm:block ${
          currentStep >= 2 ? "text-gray-900" : "text-gray-500"
        }`}>
          Objetivos
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-6 md:p-8">
        {/* Success Badge */}
        {showSuccessBadge && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 relative">
            <button
              onClick={() => setShowSuccessBadge(false)}
              className="absolute top-3 right-3 text-green-600 hover:text-green-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Conta criada com sucesso!</h3>
                <p className="text-sm text-green-700">
                  Agora vamos cadastrar seu restaurante
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
            <UtensilsCrossed className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">Mindi</span>
        </div>

        {/* Header */}
        <div className="text-center mb-2">
          <h2 className="text-xl font-bold text-primary">
            {currentStep === 1 ? "Cadastre seu Restaurante" : "Seus Objetivos"}
          </h2>
          <p className="text-gray-500 text-sm">
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
                  <span className="text-sm text-gray-500 bg-gray-100 px-4 py-4 rounded-l-xl border border-r-0 border-gray-200">
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

              {/* WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-sm font-semibold text-gray-900">
                  WhatsApp do restaurante
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
                  Instagram do restaurante
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

              {/* Tipo de entrega */}
              <div className="space-y-3">
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
                className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200 text-base mt-4"
              >
                Continuar
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Objetivos */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Objetivos */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Target className="h-4 w-4 text-primary" />
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
                    className="rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20"
                    rows={2}
                  />
                )}
              </div>

              {/* Como conheceu */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Users className="h-4 w-4 text-primary" />
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

                {/* Campo condicional para "Outros" */}
                {howFound === "others" && (
                  <Input
                    placeholder="Como você nos conheceu?"
                    value={otherHowFound}
                    onChange={(e) => setOtherHowFound(e.target.value)}
                    className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary/20 text-base"
                  />
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
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

              <p className="text-xs text-center text-gray-500">
                Você poderá editar todas essas informações depois
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
