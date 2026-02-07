import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
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
} from "lucide-react";
import { useSearchParams } from "wouter";

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
      // Automaticamente abrir o onboarding
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pagamento Online</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Receba pagamentos com cartão diretamente no menu público
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          className="text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>


      {/* Status Card */}
      <div className="rounded-xl border bg-gradient-to-br from-white to-slate-50 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isOnboarded && chargesEnabled ? "bg-green-100" : "bg-orange-100"}`}>
            <CreditCard className={`h-5 w-5 ${isOnboarded && chargesEnabled ? "text-green-600" : "text-orange-600"}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Stripe Connect</span>
              {!hasAccount && (
                <Badge variant="outline" className="text-xs bg-slate-100">
                  Não configurado
                </Badge>
              )}
              {hasAccount && !isOnboarded && (
                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                  Pendente
                </Badge>
              )}
              {isOnboarded && chargesEnabled && (
                <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                  Ativo
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {!hasAccount && "Configure sua conta para receber pagamentos online"}
              {hasAccount && !isOnboarded && "Complete o cadastro no Stripe para ativar"}
              {isOnboarded && chargesEnabled && "Sua conta está pronta para receber pagamentos"}
            </p>
          </div>
        </div>

        {/* Status Details */}
        {hasAccount && (
          <div className="flex flex-wrap gap-4 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              {chargesEnabled ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              )}
              <span className={chargesEnabled ? "text-green-700" : "text-orange-700"}>
                {chargesEnabled ? "Cobranças ativas" : "Cobranças pendentes"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {payoutsEnabled ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              )}
              <span className={payoutsEnabled ? "text-green-700" : "text-orange-700"}>
                {payoutsEnabled ? "Repasses ativos" : "Repasses pendentes"}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {!hasAccount && (
            <Button
              onClick={() => createAccountMutation.mutate()}
              disabled={createAccountMutation.isPending}
              className="bg-[#635BFF] hover:bg-[#5851DB] text-white"
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
              className="bg-[#635BFF] hover:bg-[#5851DB] text-white"
            >
              {createOnboardingMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Completar Cadastro
            </Button>
          )}

          {hasAccount && isOnboarded && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => getDashboardMutation.mutate()}
              disabled={getDashboardMutation.isPending}
            >
              {getDashboardMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LayoutDashboard className="h-4 w-4 mr-2" />
              )}
              Gestão de Pagamentos
            </Button>
          )}
        </div>
      </div>

      {/* Toggle Online Payment + Reforço de taxa */}
      {isOnboarded && chargesEnabled && (
        <div className="rounded-xl border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Aceitar pagamento online</p>
                <p className="text-xs text-muted-foreground">
                  Clientes poderão pagar com cartão no menu público (apenas Entrega)
                </p>
              </div>
            </div>
            <Switch
              checked={onlinePaymentEnabled || false}
              onCheckedChange={(checked) =>
                togglePaymentMutation.mutate({ enabled: checked })
              }
              disabled={togglePaymentMutation.isPending}
            />
          </div>
          {/* Reforço de taxa junto ao toggle */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Taxa por transação: <span className="font-semibold text-foreground">3,99% + R$ 0,89</span> — cobrada apenas em pagamentos online confirmados.
            </p>
          </div>
        </div>
      )}


    </div>
  );
}
