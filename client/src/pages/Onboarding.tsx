import { useState } from "react";
import { useLocation } from "wouter";
import { 
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Opções de objetivos (simplificado conforme imagem)
const OBJECTIVES = [
  { id: "sell_online", label: "Vender online" },
  { id: "digital_menu", label: "Ter um cardápio digital" },
  { id: "table_orders", label: "Receber pedidos na mesa" },
  { id: "others", label: "Outro(s)" },
];

// Opções de como conheceu
const HOW_FOUND = [
  { id: "referral", label: "Por indicação" },
  { id: "other_establishment", label: "Vi em outro estabelecimento" },
  { id: "google", label: "Pelo google" },
  { id: "social_media", label: "Pelas redes sociais" },
  { id: "others", label: "Outros" },
];

// Áreas de atuação
const AREAS = [
  { id: "restaurante", label: "Restaurante" },
  { id: "lanchonete", label: "Lanchonete" },
  { id: "pizzaria", label: "Pizzaria" },
  { id: "hamburgueria", label: "Hamburgueria" },
  { id: "cafeteria", label: "Cafeteria" },
  { id: "padaria", label: "Padaria" },
  { id: "bar", label: "Bar" },
  { id: "food_truck", label: "Food Truck" },
  { id: "delivery", label: "Delivery" },
  { id: "outros", label: "Outros" },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  // Form state
  const [name, setName] = useState("");
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
      // Redirecionar para seleção de planos
      window.location.href = "/onboarding/planos";
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao cadastrar restaurante. Tente novamente.");
    },
  });

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

    if (!area) {
      toast.error("Por favor, selecione a área de atuação.");
      return;
    }

    if (selectedObjectives.length === 0) {
      toast.error("Por favor, selecione pelo menos um objetivo.");
      return;
    }

    if (!howFound) {
      toast.error("Por favor, informe como conheceu nossa plataforma.");
      return;
    }

    createEstablishmentMutation.mutate({
      name: name.trim(),
      menuSlug: generateSlug(name.trim()) || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        {/* Success Badge */}
        <div className="mb-8 bg-green-100 rounded-xl py-4 px-6 flex items-center justify-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          <span className="text-green-700 font-medium text-lg">Conta criada com sucesso</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-600">
            Agora vamos cadastrar<br />seu estabelecimento
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome do estabelecimento */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold text-gray-800">
              Nome do estabelecimento<span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Nome do seu estabelecimento"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base"
            />
          </div>

          {/* Áreas de atuação */}
          <div className="space-y-2">
            <Label className="text-base font-semibold text-gray-800">
              Áreas de atuação<span className="text-red-500">*</span>
            </Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base">
                <SelectValue placeholder="Selecione aqui" />
              </SelectTrigger>
              <SelectContent>
                {AREAS.map((areaOption) => (
                  <SelectItem key={areaOption.id} value={areaOption.id}>
                    {areaOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Objetivos */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-gray-800">
              Quais seus objetivos com a nossa plataforma?<span className="text-red-500">*</span>
            </Label>
            
            <div className="grid grid-cols-2 gap-3">
              {OBJECTIVES.map((objective) => (
                <label
                  key={objective.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedObjectives.includes(objective.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Checkbox
                    id={objective.id}
                    checked={selectedObjectives.includes(objective.id)}
                    onCheckedChange={() => handleObjectiveToggle(objective.id)}
                    className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                  <span className="text-gray-700 font-medium">{objective.label}</span>
                </label>
              ))}
            </div>

            {/* Campo condicional para "Outros" */}
            {selectedObjectives.includes("others") && (
              <Textarea
                placeholder="Descreva brevemente seu objetivo"
                value={otherObjective}
                onChange={(e) => setOtherObjective(e.target.value)}
                className="mt-2 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                rows={2}
              />
            )}
          </div>

          {/* Como conheceu */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-gray-800">
              Como conheceu nossa plataforma?<span className="text-red-500">*</span>
            </Label>
            
            <RadioGroup value={howFound} onValueChange={setHowFound} className="grid grid-cols-2 gap-3">
              {HOW_FOUND.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    howFound === option.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${option.id === "others" ? "col-span-2" : ""}`}
                >
                  <RadioGroupItem 
                    value={option.id} 
                    id={`how-${option.id}`}
                    className="border-gray-300 text-blue-500"
                  />
                  <span className="text-gray-700 font-medium">{option.label}</span>
                </label>
              ))}
            </RadioGroup>

            {/* Campo condicional para "Outros" */}
            {howFound === "others" && (
              <Input
                placeholder="Como você nos conheceu?"
                value={otherHowFound}
                onChange={(e) => setOtherHowFound(e.target.value)}
                className="mt-2 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
              />
            )}
          </div>

          {/* Submit button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={createEstablishmentMutation.isPending}
              className="h-12 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg transition-all duration-200"
            >
              {createEstablishmentMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
