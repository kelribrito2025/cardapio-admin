import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, SectionCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Save, Coins, CreditCard, AlertTriangle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Fidelizacao() {
  // Get establishment
  const { data: establishment } = trpc.establishment.get.useQuery();
  const establishmentId = establishment?.id || 0;

  // Loyalty settings
  const { data: loyaltySettings, refetch: refetchLoyalty } = trpc.loyalty.getSettings.useQuery();
  // Cashback settings
  const { data: cashbackConfig, refetch: refetchCashback } = trpc.cashback.getConfig.useQuery();
  // Categories for cashback
  const { data: categoriesData } = trpc.category.list.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  // Reward program type state
  const [rewardType, setRewardType] = useState<"none" | "loyalty" | "cashback">("none");

  // Loyalty form state
  const [stampsRequired, setStampsRequired] = useState(6);
  const [couponType, setCouponType] = useState<"fixed" | "percentage" | "free_delivery">("fixed");
  const [couponValue, setCouponValue] = useState("10");
  const [minOrderValue, setMinOrderValue] = useState("0");

  // Cashback form state
  const [cashbackPercent, setCashbackPercent] = useState("5");
  const [cashbackApplyMode, setCashbackApplyMode] = useState<"all" | "categories">("all");
  const [cashbackCategoryIds, setCashbackCategoryIds] = useState<number[]>([]);
  const cashbackAllowPartialUse = false;

  // Load loyalty settings
  useEffect(() => {
    if (loyaltySettings) {
      setStampsRequired(loyaltySettings.loyaltyStampsRequired || 6);
      setCouponType(loyaltySettings.loyaltyCouponType || "fixed");
      setCouponValue(loyaltySettings.loyaltyCouponValue || "10");
      setMinOrderValue(loyaltySettings.loyaltyMinOrderValue || "0");
    }
  }, [loyaltySettings]);

  // Load cashback settings
  useEffect(() => {
    if (cashbackConfig) {
      setRewardType(cashbackConfig.rewardProgramType as "none" | "loyalty" | "cashback" || "none");
      setCashbackPercent(cashbackConfig.cashbackPercent || "5");
      setCashbackApplyMode(cashbackConfig.cashbackApplyMode as "all" | "categories" || "all");
      setCashbackCategoryIds(cashbackConfig.cashbackCategoryIds as number[] || []);
    }
  }, [cashbackConfig]);

  // Save loyalty mutation
  const saveLoyaltyMutation = trpc.loyalty.saveSettings.useMutation({
    onSuccess: () => {
      refetchLoyalty();
      refetchCashback();
    },
    onError: () => {
      toast.error("Erro ao salvar configurações de fidelidade");
    },
  });

  // Save cashback mutation
  const saveCashbackMutation = trpc.cashback.saveConfig.useMutation({
    onSuccess: () => {
      refetchCashback();
      refetchLoyalty();
    },
    onError: () => {
      toast.error("Erro ao salvar configurações de cashback");
    },
  });

  const handleSave = () => {
    saveCashbackMutation.mutate({
      establishmentId,
      rewardProgramType: rewardType,
      cashbackPercent,
      cashbackApplyMode,
      cashbackCategoryIds,
      cashbackAllowPartialUse,
    });

    saveLoyaltyMutation.mutate({
      establishmentId,
      loyaltyEnabled: rewardType === "loyalty",
      loyaltyStampsRequired: stampsRequired,
      loyaltyCouponType: couponType,
      loyaltyCouponValue: couponValue,
      loyaltyMinOrderValue: minOrderValue,
    });

    toast.success("Configurações do programa de recompensas salvas!");
  };

  const isSaving = saveLoyaltyMutation.isPending || saveCashbackMutation.isPending;

  const toggleCategory = (catId: number) => {
    setCashbackCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header - padrão do projeto */}
        <PageHeader
          title="Fidelização de Clientes"
          description="Configure estratégias para incentivar seus clientes a voltar e comprar novamente."
          icon={<Heart className="h-6 w-6 text-rose-600" />}
        />

        {/* Programa de Recompensas - SectionCard padrão */}
        <SectionCard title="Programa de Recompensas" description="Escolha e configure o programa de recompensas do seu restaurante">
          <div className="space-y-6">
            {/* Aviso de exclusividade */}
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Você pode utilizar apenas um programa de recompensa por vez.
              </p>
            </div>

            {/* Seleção do programa ativo */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Programa ativo
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Nenhum */}
                <button
                  type="button"
                  onClick={() => setRewardType("none")}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                    rewardType === "none"
                      ? "border-gray-500 bg-gray-50 dark:bg-gray-800/50 shadow-sm"
                      : "border-border/50 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  {rewardType === "none" && (
                    <div className="absolute top-3 right-3">
                      <Check className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                  <div className={cn(
                    "p-3 rounded-xl",
                    rewardType === "none" ? "bg-gray-200 dark:bg-gray-700" : "bg-muted/50"
                  )}>
                    <AlertTriangle className="h-6 w-6 text-gray-500" />
                  </div>
                  <span className="font-semibold text-sm">Nenhum</span>
                  <span className="text-xs text-muted-foreground text-center">Sem recompensas</span>
                </button>

                {/* Cartão Fidelidade */}
                <button
                  type="button"
                  onClick={() => setRewardType("loyalty")}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                    rewardType === "loyalty"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm"
                      : "border-border/50 hover:border-emerald-300 dark:hover:border-emerald-700"
                  )}
                >
                  {rewardType === "loyalty" && (
                    <div className="absolute top-3 right-3">
                      <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                  <div className={cn(
                    "p-3 rounded-xl",
                    rewardType === "loyalty" ? "bg-emerald-200 dark:bg-emerald-800" : "bg-muted/50"
                  )}>
                    <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="font-semibold text-sm">Cartão Fidelidade</span>
                  <span className="text-xs text-muted-foreground text-center">Ganhe carimbos por pedido</span>
                </button>

                {/* Cashback */}
                <button
                  type="button"
                  onClick={() => setRewardType("cashback")}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                    rewardType === "cashback"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                      : "border-border/50 hover:border-blue-300 dark:hover:border-blue-700"
                  )}
                >
                  {rewardType === "cashback" && (
                    <div className="absolute top-3 right-3">
                      <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div className={cn(
                    "p-3 rounded-xl",
                    rewardType === "cashback" ? "bg-blue-200 dark:bg-blue-800" : "bg-muted/50"
                  )}>
                    <Coins className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-semibold text-sm">Cashback</span>
                  <span className="text-xs text-muted-foreground text-center">% de volta por pedido</span>
                </button>
              </div>
            </div>

            {/* Configurações do Cartão Fidelidade */}
            {rewardType === "loyalty" && (
              <div className="p-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <h4 className="font-semibold text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Configurações do Cartão Fidelidade
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Carimbos necessários */}
                  <div>
                    <Label htmlFor="stampsRequired" className="text-xs font-semibold text-muted-foreground">
                      Carimbos necessários
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
                  <div>
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

                  {/* Valor do desconto */}
                  {couponType !== "free_delivery" && (
                    <div>
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

                  {/* Valor mínimo */}
                  <div>
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
            )}

            {/* Configurações do Cashback */}
            {rewardType === "cashback" && (
              <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-200/50 dark:border-blue-800/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Configurações do Cashback
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Percentual de cashback */}
                  <div>
                    <Label htmlFor="cashbackPercent" className="text-xs font-semibold text-muted-foreground">
                      Percentual de cashback (%)
                    </Label>
                    <Input
                      id="cashbackPercent"
                      type="number"
                      min={1}
                      max={50}
                      step={1}
                      value={cashbackPercent}
                      onChange={(e) => setCashbackPercent(e.target.value)}
                      className="mt-1 h-9 rounded-lg border-border/50 text-sm"
                      placeholder="5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Ex: 5% = R$ 5,00 de cashback em um pedido de R$ 100,00
                    </p>
                  </div>

                  {/* Uso do saldo */}
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">
                      <strong>Uso do saldo:</strong> O cliente deve usar todo o saldo disponível ou nenhum.
                    </p>
                  </div>
                </div>

                {/* Aplicar cashback em */}
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Aplicar cashback em
                  </Label>
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setCashbackApplyMode("all")}
                      className={cn(
                        "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                        cashbackApplyMode === "all"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "border-border/50 text-muted-foreground hover:border-blue-300"
                      )}
                    >
                      Todos os produtos
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashbackApplyMode("categories")}
                      className={cn(
                        "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                        cashbackApplyMode === "categories"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "border-border/50 text-muted-foreground hover:border-blue-300"
                      )}
                    >
                      Categorias específicas
                    </button>
                  </div>
                </div>

                {/* Lista de categorias */}
                {cashbackApplyMode === "categories" && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Selecione as categorias elegíveis
                    </Label>
                    {categoriesData && categoriesData.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                        {categoriesData.map((cat: any) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                              cashbackCategoryIds.includes(cat.id)
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                : "border-border/50 text-muted-foreground hover:border-blue-300"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                              cashbackCategoryIds.includes(cat.id)
                                ? "bg-blue-500 border-blue-500"
                                : "border-gray-300 dark:border-gray-600"
                            )}>
                              {cashbackCategoryIds.includes(cat.id) && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <span className="truncate">{cat.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Nenhuma categoria encontrada. Adicione categorias ao seu cardápio primeiro.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Save button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl shadow-sm bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </AdminLayout>
  );
}
