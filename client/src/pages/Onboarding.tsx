import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Store, 
  Link as LinkIcon, 
  Phone, 
  Instagram, 
  MapPin, 
  Target, 
  Users,
  ArrowRight, 
  Loader2, 
  UtensilsCrossed,
  CheckCircle2,
  X
} from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
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
  { id: "referral", label: "Indicação" },
  { id: "google", label: "Google" },
  { id: "other_menu", label: "Vi em outro menu digital" },
  { id: "social_media", label: "Redes sociais" },
  { id: "others", label: "Outros" },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [showSuccessBadge, setShowSuccessBadge] = useState(true);
  const utils = trpc.useUtils();
  
  // Form state
  const [name, setName] = useState("");
  const [menuSlug, setMenuSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [area, setArea] = useState("");
  
  // Objectives
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [otherObjective, setOtherObjective] = useState("");
  
  // How found
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Por favor, informe o nome do estabelecimento.");
      return;
    }

    createEstablishmentMutation.mutate({
      name: name.trim(),
      menuSlug: menuSlug.trim() || undefined,
      whatsapp: whatsapp.replace(/\D/g, "") || undefined,
    });
  };

  return (
    <AuthLayout>
      <div className="p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        {/* Success Badge */}
        {showSuccessBadge && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 relative">
            <button
              onClick={() => setShowSuccessBadge(false)}
              className="absolute top-3 right-3 text-green-600 hover:text-green-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Conta criada com sucesso! 🎉</h3>
                <p className="text-sm text-green-700 mt-0.5">
                  Agora vamos cadastrar seu restaurante
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-[50px] h-[50px] bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
            <UtensilsCrossed className="h-7 w-7 text-white" />
          </div>
          <span className="text-3xl font-bold text-gray-900">Mindi</span>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastre seu Restaurante</h2>
          <p className="text-gray-600">Preencha os dados básicos para começar</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do estabelecimento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 uppercase tracking-wide">
              <Store className="h-4 w-4" />
              Dados do Estabelecimento
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nome do estabelecimento *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: Pizzaria do João"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>

            {/* Link público */}
            <div className="space-y-2">
              <Label htmlFor="menuSlug" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <LinkIcon className="h-4 w-4 text-gray-500" />
                Link público do cardápio
              </Label>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2.5 rounded-l-xl border border-r-0 border-gray-200">
                  mindi.com.br/
                </span>
                <Input
                  id="menuSlug"
                  type="text"
                  placeholder="seu-restaurante"
                  value={menuSlug}
                  onChange={(e) => setMenuSlug(generateSlug(e.target.value))}
                  className="h-11 rounded-l-none rounded-r-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="h-4 w-4 text-gray-500" />
                WhatsApp do restaurante
              </Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="(11) 99999-9999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                className="h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>

            {/* Instagram */}
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Instagram className="h-4 w-4 text-gray-500" />
                Instagram do restaurante
              </Label>
              <Input
                id="instagram"
                type="text"
                placeholder="@seu_restaurante"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>

            {/* Área de atuação */}
            <div className="space-y-2">
              <Label htmlFor="area" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4 text-gray-500" />
                Área de atuação
              </Label>
              <Input
                id="area"
                type="text"
                placeholder="Ex: Centro, São Paulo - SP"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Objetivos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 uppercase tracking-wide">
              <Target className="h-4 w-4" />
              Objetivos com a plataforma
            </div>
            <p className="text-sm text-gray-600">Quais são seus objetivos com a nossa plataforma?</p>
            
            <div className="space-y-3">
              {OBJECTIVES.map((objective) => (
                <div key={objective.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={objective.id}
                    checked={selectedObjectives.includes(objective.id)}
                    onCheckedChange={() => handleObjectiveToggle(objective.id)}
                  />
                  <label
                    htmlFor={objective.id}
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {objective.label}
                  </label>
                </div>
              ))}
            </div>

            {/* Campo condicional para "Outros" */}
            {selectedObjectives.includes("others") && (
              <Textarea
                placeholder="Descreva brevemente seu objetivo"
                value={otherObjective}
                onChange={(e) => setOtherObjective(e.target.value)}
                className="mt-2 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                rows={2}
              />
            )}
          </div>

          {/* Como conheceu */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 uppercase tracking-wide">
              <Users className="h-4 w-4" />
              Como nos conheceu
            </div>
            <p className="text-sm text-gray-600">Como você conheceu nossa plataforma?</p>
            
            <RadioGroup value={howFound} onValueChange={setHowFound} className="space-y-3">
              {HOW_FOUND.map((option) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.id} id={`how-${option.id}`} />
                  <label
                    htmlFor={`how-${option.id}`}
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </RadioGroup>

            {/* Campo condicional para "Outros" */}
            {howFound === "others" && (
              <Input
                placeholder="Como você nos conheceu?"
                value={otherHowFound}
                onChange={(e) => setOtherHowFound(e.target.value)}
                className="mt-2 h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            )}
          </div>

          {/* Submit button */}
          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              disabled={createEstablishmentMutation.isPending}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/30 transition-all duration-200"
            >
              {createEstablishmentMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
            <p className="text-xs text-center text-gray-500">
              Você poderá editar todas essas informações depois
            </p>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
