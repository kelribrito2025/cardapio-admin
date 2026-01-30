import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LoyaltySettingsCardProps {
  establishmentId: number;
}

export function LoyaltySettingsCard({ establishmentId }: LoyaltySettingsCardProps) {
  const { data: settings, refetch } = trpc.loyalty.getSettings.useQuery();
  
  // Form state
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [stampsRequired, setStampsRequired] = useState(6);
  const [couponType, setCouponType] = useState<"fixed" | "percentage" | "free_delivery">("fixed");
  const [couponValue, setCouponValue] = useState("10");
  const [minOrderValue, setMinOrderValue] = useState("0");
  
  // Load settings
  useEffect(() => {
    if (settings) {
      setLoyaltyEnabled(settings.loyaltyEnabled || false);
      setStampsRequired(settings.loyaltyStampsRequired || 6);
      setCouponType(settings.loyaltyCouponType || "fixed");
      setCouponValue(settings.loyaltyCouponValue || "10");
      setMinOrderValue(settings.loyaltyMinOrderValue || "0");
    }
  }, [settings]);
  
  const saveMutation = trpc.loyalty.saveSettings.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Configurações de fidelidade salvas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar configurações de fidelidade");
    },
  });
  
  const handleSave = () => {
    saveMutation.mutate({
      establishmentId,
      loyaltyEnabled,
      loyaltyStampsRequired: stampsRequired,
      loyaltyCouponType: couponType,
      loyaltyCouponValue: couponValue,
      loyaltyMinOrderValue: minOrderValue,
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Header with icon */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-emerald-100 rounded-xl">
          <Gift className="h-6 w-6 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">Cartão Fidelidade</h3>
          <p className="text-sm text-muted-foreground">
            Configure o programa de fidelidade do seu restaurante
          </p>
        </div>
      </div>
      
      {/* Card único com toggle + todos os 4 campos na mesma linha */}
      <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Toggle Ativar */}
          <div className="flex items-center gap-3 shrink-0">
            <div>
              <p className="font-medium">Ativar Cartão Fidelidade</p>
              <p className="text-sm text-muted-foreground">
                Clientes ganham carimbos a cada pedido
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={loyaltyEnabled}
                onChange={(e) => setLoyaltyEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
          
          {/* Separador vertical em desktop */}
          <div className="hidden lg:block w-px h-12 bg-border/50" />
          
          {/* 4 campos em linha */}
          <div className={cn(
            "flex flex-col sm:flex-row flex-1 gap-3 transition-all duration-300",
            !loyaltyEnabled && "opacity-50 pointer-events-none"
          )}>
            {/* Carimbos necessários */}
            <div className="flex-1 min-w-0">
              <Label htmlFor="stampsRequired" className="text-xs font-semibold text-muted-foreground">
                Carimbos
              </Label>
              <Input
                id="stampsRequired"
                type="number"
                min={1}
                max={20}
                value={stampsRequired}
                onChange={(e) => setStampsRequired(parseInt(e.target.value) || 6)}
                className="mt-1 h-9 rounded-lg border-border/50 text-sm"
              />
            </div>
            
            {/* Tipo de cupom */}
            <div className="flex-1 min-w-0">
              <Label htmlFor="couponType" className="text-xs font-semibold text-muted-foreground">
                Tipo de cupom
              </Label>
              <Select value={couponType} onValueChange={(v) => setCouponType(v as typeof couponType)}>
                <SelectTrigger className="mt-1 h-9 rounded-lg border-border/50 text-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                  <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                  <SelectItem value="free_delivery">Frete grátis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Valor do desconto (hidden for free_delivery) */}
            {couponType !== "free_delivery" && (
              <div className="flex-1 min-w-0">
                <Label htmlFor="couponValue" className="text-xs font-semibold text-muted-foreground">
                  {couponType === "percentage" ? "Desconto (%)" : "Desconto (R$)"}
                </Label>
                <Input
                  id="couponValue"
                  type="number"
                  min={1}
                  max={couponType === "percentage" ? 100 : 1000}
                  value={couponValue}
                  onChange={(e) => setCouponValue(e.target.value)}
                  className="mt-1 h-9 rounded-lg border-border/50 text-sm"
                />
              </div>
            )}
            
            {/* Valor mínimo por pedido */}
            <div className="flex-1 min-w-0">
              <Label htmlFor="minOrderValue" className="text-xs font-semibold text-muted-foreground">
                Valor mínimo (R$)
              </Label>
              <Input
                id="minOrderValue"
                type="number"
                min={0}
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                className="mt-1 h-9 rounded-lg border-border/50 text-sm"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Save button */}
      <Button 
        onClick={handleSave} 
        disabled={saveMutation.isPending}
        className="rounded-xl shadow-sm bg-emerald-600 hover:bg-emerald-700"
      >
        <Save className="h-4 w-4 mr-2" />
        {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  );
}
