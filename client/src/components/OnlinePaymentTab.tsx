import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { SectionCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CreditCard,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  LayoutDashboard,
  Shield,
  Info,
  Wallet,
  Zap,
  BadgeCheck,
  ArrowUpRight,
  Banknote,
} from "lucide-react";
import { useSearchParams } from "wouter";
import { cn } from "@/lib/utils";

export function OnlinePaymentTab() {
  const [searchParams] = useSearchParams();
  const stripeReturn = searchParams.get?.("stripe") || new URLSearchParams(window.location.search).get("stripe");

  const {
    data: accountStatus,
    isLoading,
    refetch,
  } = trpc.stripeConnect.getAccountStatus.useQuery(undefined, {
    refetchOnWindowFocus: true,
  });

  const createAccountMutation = trpc.stripeConnect.createAccount.useMutation({
    onSuccess: () => {
      toast.success("Conta Stripe Connect criada! Agora complete o cadastro.");
      refetch();
      createOnboardingMutation.mutate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar conta Stripe Connect");
    },
  });

  const createOnboardingMutation = trpc.stripeConnect.createOnboardingLink.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.info("Abrindo página de cadastro do Stripe em nova aba...");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar link de onboarding");
    },
  });

  const togglePaymentMutation = trpc.stripeConnect.toggleOnlinePayment.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success(
        data.enabled
          ? "Pagamento online ativado! Clientes podem pagar com cartão."
          : "Pagamento online desativado."
      );
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao alterar configuração");
    },
  });

  const getDashboardMutation = trpc.stripeConnect.getDashboardLink.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao abrir dashboard");
    },
  });

  // Refetch ao retornar do Stripe
  useEffect(() => {
    if (stripeReturn === "return") {
      refetch();
      toast.success("Cadastro atualizado! Verificando status...");
    }
    if (stripeReturn === "refresh") {
      refetch();
      toast.info("Sessão expirada. Gere um novo link de onboarding.");
    }
  }, [stripeReturn]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasAccount = accountStatus?.hasAccount;
  const isOnboarded = accountStatus?.onboardingComplete;
  const chargesEnabled = accountStatus?.chargesEnabled;
  const payoutsEnabled = accountStatus?.payoutsEnabled;
  const onlinePaymentEnabled = accountStatus?.onlinePaymentEnabled;
  const isFullyActive = isOnboarded && chargesEnabled;

  return (
    <div className="space-y-5">
      {/* Layout em duas colunas */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Coluna esquerda (40%) - Status e Configuração */}
        <div className="w-full lg:w-[40%] space-y-5">

          {/* Card Status Stripe Connect */}
          <SectionCard
            title="Stripe Connect"
            description="Conta de pagamentos"
            icon={<CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
            iconBg="bg-indigo-100 dark:bg-indigo-500/15"
            actions={
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            }
          >
            <div className="space-y-4">
              {/* Badge de status */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/30">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  isFullyActive
                    ? "bg-green-100 dark:bg-green-500/15"
                    : hasAccount
                      ? "bg-orange-100 dark:bg-orange-500/15"
                      : "bg-slate-100 dark:bg-slate-500/15"
                )}>
                  {isFullyActive ? (
                    <BadgeCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : hasAccount ? (
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  ) : (
                    <CreditCard className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {isFullyActive ? "Conta Ativa" : hasAccount ? "Cadastro Pendente" : "Não Configurado"}
                    </span>
                    <Badge variant="outline" className={cn(
                      "text-[10px] px-1.5 py-0",
                      isFullyActive
                        ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                        : hasAccount
                          ? "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800"
                          : "bg-slate-100 dark:bg-muted text-muted-foreground border-border"
                    )}>
                      {isFullyActive ? "Ativo" : hasAccount ? "Pendente" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isFullyActive
                      ? "Pronta para receber pagamentos"
                      : hasAccount
                        ? "Complete o cadastro no Stripe"
                        : "Configure para receber pagamentos"}
                  </p>
                </div>
              </div>

              {/* Detalhes de status (quando tem conta) */}
              {hasAccount && (
                <div className="grid grid-cols-2 gap-3">
                  <div className={cn(
                    "flex items-center gap-2 p-2.5 rounded-lg border",
                    chargesEnabled
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                  )}>
                    {chargesEnabled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    )}
                    <span className={cn(
                      "text-xs font-medium",
                      chargesEnabled ? "text-green-700 dark:text-green-400" : "text-orange-700 dark:text-orange-400"
                    )}>
                      {chargesEnabled ? "Cobranças" : "Cobranças"}
                    </span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 p-2.5 rounded-lg border",
                    payoutsEnabled
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                  )}>
                    {payoutsEnabled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    )}
                    <span className={cn(
                      "text-xs font-medium",
                      payoutsEnabled ? "text-green-700 dark:text-green-400" : "text-orange-700 dark:text-orange-400"
                    )}>
                      {payoutsEnabled ? "Repasses" : "Repasses"}
                    </span>
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex flex-wrap gap-2">
                {!hasAccount && (
                  <Button
                    onClick={() => createAccountMutation.mutate()}
                    disabled={createAccountMutation.isPending}
                    className="w-full bg-[#635BFF] hover:bg-[#5851DB] text-white rounded-xl h-10"
                  >
                    {createAccountMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Configurar Stripe Connect
                  </Button>
                )}

                {hasAccount && !isOnboarded && (
                  <Button
                    onClick={() => createOnboardingMutation.mutate()}
                    disabled={createOnboardingMutation.isPending}
                    className="w-full bg-[#635BFF] hover:bg-[#5851DB] text-white rounded-xl h-10"
                  >
                    {createOnboardingMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Completar Cadastro
                  </Button>
                )}

                {isFullyActive && (
                  <Button
                    variant="outline"
                    onClick={() => getDashboardMutation.mutate()}
                    disabled={getDashboardMutation.isPending}
                    className="w-full rounded-xl h-10"
                  >
                    {getDashboardMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                    )}
                    Gestão de Pagamentos
                    <ArrowUpRight className="h-3.5 w-3.5 ml-auto opacity-50" />
                  </Button>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Card de Taxas */}
          <SectionCard
            title="Taxas"
            description="Custos por transação"
            icon={<Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-100 dark:bg-emerald-500/15"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium">Taxa por transação</span>
                </div>
                <span className="text-sm font-bold text-foreground">3,99% + R$ 0,89</span>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                Cobrada apenas em pagamentos online confirmados. Sem mensalidade ou taxa fixa.
              </p>
            </div>
          </SectionCard>
        </div>

        {/* Coluna direita (60%) - Ativação e Métodos */}
        <div className="flex-1 space-y-5">

          {/* Card Ativar Pagamento Online */}
          <SectionCard
            title="Pagamento online"
            description="Ative para receber pagamentos no menu público"
            icon={<Shield className={cn(
              "h-5 w-5",
              isFullyActive ? "text-green-600 dark:text-green-400" : "text-slate-400 dark:text-muted-foreground"
            )} />}
            iconBg={cn(
              isFullyActive ? "bg-green-100 dark:bg-green-500/15" : "bg-slate-100 dark:bg-slate-500/15"
            )}
          >
            <div className={cn("space-y-4", !isFullyActive && "opacity-60")}>
              {/* Toggle principal */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isFullyActive && onlinePaymentEnabled
                      ? "bg-green-100 dark:bg-green-500/10"
                      : "bg-muted/50"
                  )}>
                    <Zap className={cn(
                      "h-4 w-4",
                      isFullyActive && onlinePaymentEnabled
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Aceitar pagamento online</p>
                    <p className="text-xs text-muted-foreground">
                      Clientes poderão pagar com cartão e Apple Pay (apenas Entrega)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isFullyActive ? (onlinePaymentEnabled || false) : false}
                  onCheckedChange={(checked) =>
                    togglePaymentMutation.mutate({ enabled: checked })
                  }
                  disabled={!isFullyActive || togglePaymentMutation.isPending}
                />
              </div>

              {/* Alerta se não configurado */}
              {!isFullyActive && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                  <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Configure o Stripe Connect para ativar pagamentos online.
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Card Métodos Aceitos */}
          <SectionCard
            title="Métodos aceitos"
            description="Formas de pagamento disponíveis online"
            icon={<Wallet className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
            iconBg="bg-violet-100 dark:bg-violet-500/15"
          >
            <div className="grid grid-cols-2 gap-3">
              {/* Cartão */}
              <div className={cn(
                "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all",
                isFullyActive && onlinePaymentEnabled
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/30 bg-muted/20 opacity-60"
              )}>
                <div className={cn(
                  "p-2 rounded-lg",
                  isFullyActive && onlinePaymentEnabled ? "bg-primary/10" : "bg-muted/50"
                )}>
                  <CreditCard className={cn(
                    "h-4 w-4",
                    isFullyActive && onlinePaymentEnabled ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className={cn(
                    "font-semibold text-sm",
                    isFullyActive && onlinePaymentEnabled ? "text-foreground" : "text-muted-foreground"
                  )}>Cartão</p>
                  <p className="text-[10px] text-muted-foreground">Crédito e débito</p>
                </div>
              </div>

              {/* Apple Pay */}
              <div className={cn(
                "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all",
                isFullyActive && onlinePaymentEnabled
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/30 bg-muted/20 opacity-60"
              )}>
                <div className={cn(
                  "p-2 rounded-lg",
                  isFullyActive && onlinePaymentEnabled ? "bg-slate-900 dark:bg-white/10" : "bg-muted/50"
                )}>
                  <svg className={cn(
                    "h-4 w-4",
                    isFullyActive && onlinePaymentEnabled ? "text-white dark:text-white" : "text-muted-foreground"
                  )} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.72 12.63c-.03-2.89 2.36-4.27 2.47-4.34-1.34-1.96-3.43-2.23-4.18-2.26-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.76-.99-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.5.96 1.39 2.1 2.95 3.6 2.89 1.45-.06 2-.94 3.75-.94s2.25.94 3.78.91c1.55-.03 2.53-1.41 3.49-2.81 1.1-1.61 1.55-3.17 1.58-3.25-.03-.01-3.03-1.16-3.06-4.62zM14.91 4.21c.8-.97 1.34-2.31 1.19-3.65-1.15.05-2.55.77-3.37 1.73-.74.86-1.38 2.22-1.21 3.54 1.28.1 2.59-.65 3.39-1.62z" />
                  </svg>
                </div>
                <div>
                  <p className={cn(
                    "font-semibold text-sm",
                    isFullyActive && onlinePaymentEnabled ? "text-foreground" : "text-muted-foreground"
                  )}>Apple Pay</p>
                  <p className="text-[10px] text-muted-foreground">Pagamento rápido</p>
                </div>
              </div>
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
