import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/shared";
import { toast } from "sonner";
import { Building2, User, Lock, Shield, Eye, EyeOff, Loader2, Save, Mail, Phone, FileText, KeyRound } from "lucide-react";

interface AccountSecuritySectionProps {
  establishmentId: number;
}

export function AccountSecuritySection({ establishmentId }: AccountSecuritySectionProps) {
  // Utils do tRPC para invalidar cache
  const utils = trpc.useUtils();
  
  // Estados para dados da conta
  const [accountData, setAccountData] = useState({
    name: "",
    email: "",
    cnpj: "",
    responsibleName: "",
    responsiblePhone: "",
  });
  
  // Estados para alteração de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estados para 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState("");
  
  // Query para obter dados da conta
  const { data: accountInfo, isLoading: isLoadingAccount } = trpc.establishment.getAccountData.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );
  
  // Mutations
  const updateAccountMutation = trpc.establishment.updateAccountData.useMutation({
    onSuccess: async () => {
      toast.success("Dados da conta atualizados com sucesso!");
      await utils.auth.me.invalidate();
      await utils.auth.me.refetch();
      await utils.establishment.getAccountData.invalidate();
      await utils.establishment.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar dados da conta");
    },
  });
  
  const changePasswordMutation = trpc.establishment.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao alterar senha");
    },
  });
  
  const toggleTwoFactorMutation = trpc.establishment.toggleTwoFactor.useMutation({
    onSuccess: () => {
      toast.success(twoFactorEnabled ? "Verificação em duas etapas desativada" : "Verificação em duas etapas ativada");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao alterar configuração de 2FA");
      setTwoFactorEnabled(!twoFactorEnabled);
    },
  });
  
  // Carregar dados quando accountInfo estiver disponível
  useEffect(() => {
    if (accountInfo) {
      setAccountData({
        name: accountInfo.name || "",
        email: accountInfo.userEmail || accountInfo.email || "",
        cnpj: accountInfo.cnpj || "",
        responsibleName: accountInfo.responsibleName || accountInfo.userName || "",
        responsiblePhone: accountInfo.responsiblePhone || "",
      });
      setTwoFactorEnabled(accountInfo.twoFactorEnabled || false);
      setTwoFactorEmail(accountInfo.twoFactorEmail || accountInfo.userEmail || accountInfo.email || "");
    }
  }, [accountInfo]);
  
  // Handlers
  const handleSaveAccountData = () => {
    if (!establishmentId) return;
    
    updateAccountMutation.mutate({
      establishmentId,
      name: accountData.name,
      email: accountData.email || null,
      cnpj: accountData.cnpj || null,
      responsibleName: accountData.responsibleName || null,
      responsiblePhone: accountData.responsiblePhone || null,
    });
  };
  
  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Nova senha e confirmação não coincidem");
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error("Nova senha deve ter pelo menos 8 caracteres");
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword,
    });
  };
  
  const handleToggleTwoFactor = (enabled: boolean) => {
    if (!establishmentId) return;
    
    setTwoFactorEnabled(enabled);
    toggleTwoFactorMutation.mutate({
      establishmentId,
      enabled,
      email: twoFactorEmail || undefined,
    });
  };
  
  // Formatar CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return value;
  };
  
  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        return numbers
          .replace(/(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{4})(\d)/, "$1-$2");
      }
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    return value;
  };
  
  if (isLoadingAccount) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Coluna esquerda - 40% - Dados da Conta */}
      <div className="w-full lg:w-[40%] lg:sticky lg:top-4 shrink-0 space-y-5 self-start">
        {/* Dados do Estabelecimento */}
        <SectionCard
          title="Dados do Estabelecimento"
          description="Informações do seu negócio"
          icon={<Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-100 dark:bg-blue-500/15"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nome do estabelecimento</Label>
              <Input
                id="name"
                value={accountData.name}
                onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                placeholder="Nome do seu estabelecimento"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cnpj" className="text-sm font-medium">CNPJ</Label>
              <Input
                id="cnpj"
                value={accountData.cnpj}
                onChange={(e) => setAccountData({ ...accountData, cnpj: formatCNPJ(e.target.value) })}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">E-mail da conta</Label>
              <Input
                id="email"
                type="email"
                value={accountData.email}
                readOnly
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                E-mail cadastrado na plataforma (não editável)
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Dados do Responsável */}
        <SectionCard
          title="Dados do Responsável"
          description="Informações de contato do responsável"
          icon={<User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-100 dark:bg-emerald-500/15"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="responsibleName" className="text-sm font-medium">Nome do responsável</Label>
              <Input
                id="responsibleName"
                value={accountData.responsibleName}
                onChange={(e) => setAccountData({ ...accountData, responsibleName: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsiblePhone" className="text-sm font-medium">Celular do responsável</Label>
              <Input
                id="responsiblePhone"
                value={accountData.responsiblePhone}
                onChange={(e) => setAccountData({ ...accountData, responsiblePhone: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>
        </SectionCard>

        {/* Botão Salvar dados */}
        <Button 
          onClick={handleSaveAccountData}
          disabled={updateAccountMutation.isPending}
          className="w-full rounded-xl"
        >
          {updateAccountMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar dados da conta
        </Button>
      </div>

      {/* Coluna direita - 60% - Segurança */}
      <div className="w-full lg:flex-1 space-y-5">
        {/* Alterar Senha */}
        <SectionCard
          title="Alterar Senha"
          description="Mantenha sua conta segura alterando periodicamente"
          icon={<Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-100 dark:bg-amber-500/15"
        >
          <div className="space-y-4">
            {/* Senha atual */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium">Senha atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Senha atual"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Nova senha e confirmação lado a lado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirme a nova senha"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              A senha deve ter pelo menos 8 caracteres
            </p>
            
            <Button 
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="rounded-xl"
            >
              {changePasswordMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4 mr-2" />
              )}
              Salvar nova senha
            </Button>
          </div>
        </SectionCard>
        
        {/* Verificação em duas etapas */}
        <SectionCard
          title="Verificação em Duas Etapas"
          description="Adicione uma camada extra de segurança"
          icon={<Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          iconBg="bg-purple-100 dark:bg-purple-500/15"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${twoFactorEnabled ? 'bg-green-100 dark:bg-green-500/15' : 'bg-muted'}`}>
                  <Shield className={`h-4 w-4 ${twoFactorEnabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {twoFactorEnabled ? "Ativado" : "Desativado"}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {twoFactorEnabled 
                      ? "Código enviado por e-mail ao fazer login"
                      : "Ative para receber código de verificação"
                    }
                  </p>
                </div>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={handleToggleTwoFactor}
                disabled={toggleTwoFactorMutation.isPending}
              />
            </div>
            
            {twoFactorEnabled && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="twoFactorEmail" className="text-sm font-medium">E-mail para verificação</Label>
                <Input
                  id="twoFactorEmail"
                  type="email"
                  value={twoFactorEmail}
                  onChange={(e) => setTwoFactorEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
                <p className="text-xs text-muted-foreground">
                  O código de verificação será enviado para este e-mail
                </p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
