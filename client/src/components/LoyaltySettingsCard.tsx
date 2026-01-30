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
  
  // Format currency input
  const formatCurrency = (value: string) => {
    const num = value.replace(/[^\d]/g, "");
    const formatted = (parseInt(num || "0") / 100).toFixed(2);
    return formatted;
  };
  
  return (
    <div className="space-y-6">
      {/* Header with icon and toggle */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-emerald-100 rounded-xl">
          <Gift className="h-6 w-6 text-emerald-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Cartão Fidelidade</h3>
              <p className="text-sm text-muted-foreground">
                Configure o programa de fidelidade do seu restaurante
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toggle Ativar */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
        <div>
          <p className="font-medium">Ativar Cartão Fidelidade</p>
          <p className="text-sm text-muted-foreground">
            Clientes ganham carimbos a cada pedido
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={loyaltyEnabled}
            onChange={(e) => setLoyaltyEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>
      
      {/* Settings (only show when enabled) */}
      <div className={cn(
        "space-y-4 transition-all duration-300",
        !loyaltyEnabled && "opacity-50 pointer-events-none"
      )}>
        {/* Linha com todos os campos de configuração */}
        <div className={cn(
          "grid gap-4",
          couponType === "free_delivery" ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        )}>
          {/* Carimbos necessários */}
          <div>
            <Label htmlFor="stampsRequired" className="text-sm font-semibold">
              Carimbos necessários
            </Label>
            <Input
              id="stampsRequired"
              type="number"
              min={1}
              max={20}
              value={stampsRequired}
              onChange={(e) => setStampsRequired(parseInt(e.target.value) || 6)}
              className="mt-2 h-10 rounded-xl border-border/50"
            />
          </div>
          
          {/* Tipo de cupom */}
          <div>
            <Label htmlFor="couponType" className="text-sm font-semibold">
              Tipo de cupom
            </Label>
            <Select value={couponType} onValueChange={(v) => setCouponType(v as typeof couponType)}>
              <SelectTrigger className="mt-2 h-10 rounded-xl border-border/50">
                <SelectValue placeholder="Selecione o tipo" />
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
            <div>
              <Label htmlFor="couponValue" className="text-sm font-semibold">
                {couponType === "percentage" ? "Desconto (%)" : "Desconto (R$)"}
              </Label>
              <Input
                id="couponValue"
                type="number"
                min={1}
                max={couponType === "percentage" ? 100 : 1000}
                value={couponValue}
                onChange={(e) => setCouponValue(e.target.value)}
                className="mt-2 h-10 rounded-xl border-border/50"
              />
            </div>
          )}
          
          {/* Valor mínimo por pedido */}
          <div>
            <Label htmlFor="minOrderValue" className="text-sm font-semibold">
              Valor mínimo (R$)
            </Label>
            <Input
              id="minOrderValue"
              type="number"
              min={0}
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(e.target.value)}
              className="mt-2 h-10 rounded-xl border-border/50"
              placeholder="0 = sem mínimo"
            />
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
