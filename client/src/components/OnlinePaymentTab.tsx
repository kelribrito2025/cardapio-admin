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
            Receba pagamentos com cartão, Apple Pay e Google Pay diretamente no menu público
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

      {/* Toggle Online Payment + Reforço de taxa - sempre visível */}
      <div className={`rounded-xl border p-5 space-y-4 ${!(isOnboarded && chargesEnabled) ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isOnboarded && chargesEnabled ? 'bg-green-100' : 'bg-slate-100'}`}>
              <Shield className={`h-4 w-4 ${isOnboarded && chargesEnabled ? 'text-green-600' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="font-medium text-sm">Aceitar pagamento online</p>
              <p className="text-xs text-muted-foreground">
                Clientes poderão pagar com cartão, Apple Pay e Google Pay no menu público (apenas Entrega)
              </p>
            </div>
          </div>
          <Switch
            checked={isOnboarded && chargesEnabled ? (onlinePaymentEnabled || false) : false}
            onCheckedChange={(checked) =>
              togglePaymentMutation.mutate({ enabled: checked })
            }
            disabled={!(isOnboarded && chargesEnabled) || togglePaymentMutation.isPending}
          />
        </div>
        {/* Métodos aceitos */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-700">
              <CreditCard className="h-3.5 w-3.5" />
              Cartão
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 text-xs font-medium text-white">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.72 12.63c-.03-2.89 2.36-4.27 2.47-4.34-1.34-1.96-3.43-2.23-4.18-2.26-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.76-.99-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.5.96 1.39 2.1 2.95 3.6 2.89 1.45-.06 2-.94 3.75-.94s2.25.94 3.78.91c1.55-.03 2.53-1.41 3.49-2.81 1.1-1.61 1.55-3.17 1.58-3.25-.03-.01-3.03-1.16-3.06-4.62zM14.91 4.21c.8-.97 1.34-2.31 1.19-3.65-1.15.05-2.55.77-3.37 1.73-.74.86-1.38 2.22-1.21 3.54 1.28.1 2.59-.65 3.39-1.62z"/></svg>
              Apple Pay
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border text-xs font-medium text-slate-700">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24"><path d="M3.29 6.56c-.16.38-.28.8-.28 1.27 0 .47.12.89.28 1.27l.02.05 3.5-2.72-.01-.05c-.16-.38-.28-.8-.28-1.27 0-.47.12-.89.28-1.27l-.02-.05-3.5 2.72.01.05z" fill="#FBBC04"/><path d="M12 5.09c1.39 0 2.64.48 3.62 1.42l2.72-2.72C16.46 2.09 14.39 1.09 12 1.09c-3.58 0-6.67 2.05-8.18 5.04l3.5 2.72C8.22 6.62 9.93 5.09 12 5.09z" fill="#EA4335"/><path d="M12 18.91c-2.07 0-3.78-1.53-4.68-3.76l-3.5 2.72C5.33 20.86 8.42 22.91 12 22.91c2.3 0 4.49-.82 6.13-2.36l-3.33-2.58c-.87.58-1.98.94-3.17.94h.37z" fill="#34A853"/><path d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.33 2.58c1.94-1.79 3.09-4.42 3.09-8.4z" fill="#4285F4"/></svg>
              Google Pay
            </div>
          </div>
        </div>
        {/* Reforço de taxa junto ao toggle */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Taxa por transação: <span className="font-semibold text-foreground">3,99% + R$ 0,89</span> — cobrada apenas em pagamentos online confirmados.
          </p>
        </div>
        {!(isOnboarded && chargesEnabled) && (
          <div className="flex items-center gap-2 pt-1">
            <AlertCircle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <p className="text-xs text-orange-600">
              Configure o Stripe Connect acima para ativar pagamentos online.
            </p>
          </div>
        )}
      </div>


    </div>
  );
}
