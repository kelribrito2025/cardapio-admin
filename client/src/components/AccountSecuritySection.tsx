import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/shared";
import { toast } from "sonner";
import { Building2, User, Lock, Shield, Eye, EyeOff, Loader2, Mail, Phone, FileText, KeyRound, Check } from "lucide-react";

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
  
  // Estado para indicador visual de campos salvos
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set());
  const savedTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  
  // Refs para debounce
  const debounceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const twoFactorEmailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Query para obter dados da conta
  const { data: accountInfo, isLoading: isLoadingAccount } = trpc.establishment.getAccountData.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );
  
  // Função para marcar campos como salvos com indicador visual temporário
  const markFieldsSaved = useCallback((fields: string[]) => {
    setSavedFields(prev => {
      const next = new Set(prev);
      fields.forEach(f => next.add(f));
      return next;
    });
    fields.forEach(field => {
      if (savedTimersRef.current[field]) clearTimeout(savedTimersRef.current[field]);
      savedTimersRef.current[field] = setTimeout(() => {
        setSavedFields(prev => {
          const next = new Set(prev);
          next.delete(field);
          return next;
        });
      }, 2000);
    });
  }, []);
  
  // Componente inline de indicador "Salvo"
  const SavedCheck = ({ field }: { field: string }) => {
    if (!savedFields.has(field)) return null;
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium ml-2 animate-in fade-in duration-300">
        <Check className="h-3 w-3" />
        Salvo
      </span>
    );
  };
  
  // Mutations
  const updateAccountMutation = trpc.establishment.updateAccountData.useMutation({
    onSuccess: async (_data, variables) => {
      // Determinar quais campos foram salvos com base nas variáveis
      const fields: string[] = [];
      if (variables.name !== undefined) fields.push("name");
      if (variables.cnpj !== undefined) fields.push("cnpj");
      if (variables.responsibleName !== undefined) fields.push("responsibleName");
      if (variables.responsiblePhone !== undefined) fields.push("responsiblePhone");
      if (fields.length === 0) fields.push("account");
      markFieldsSaved(fields);
      
      toast.success("Dados salvos com sucesso!");
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
      toast.success(twoFactorEnabled ? "Verificação em duas etapas ativada" : "Verificação em duas etapas desativada");
      markFieldsSaved(["twoFactor"]);
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
  
  // Cleanup dos timers ao desmontar
  useEffect(() => {
    return () => {
      Object.values(debounceTimersRef.current).forEach(t => clearTimeout(t));
      Object.values(savedTimersRef.current).forEach(t => clearTimeout(t));
      if (twoFactorEmailDebounceRef.current) clearTimeout(twoFactorEmailDebounceRef.current);
    };
  }, []);
  
  // Auto-save com debounce para campos da conta
  const autoSaveAccountField = useCallback((field: string, value: string) => {
    if (!establishmentId) return;
    
    // Não salvar name vazio (validação min 1 no servidor)
    if (field === "name" && !value.trim()) return;
    
    if (debounceTimersRef.current[field]) {
      clearTimeout(debounceTimersRef.current[field]);
    }
    
    debounceTimersRef.current[field] = setTimeout(() => {
      // Enviar apenas o campo alterado para evitar sobrescrever outros campos
      const payload: Record<string, unknown> = { establishmentId };
      if (field === "name") {
        payload.name = value;
      } else if (field === "cnpj") {
        payload.cnpj = value || null;
      } else if (field === "responsibleName") {
        payload.responsibleName = value || null;
      } else if (field === "responsiblePhone") {
        payload.responsiblePhone = value || null;
      }
      updateAccountMutation.mutate(payload as any);
    }, 800);
  }, [establishmentId, updateAccountMutation]);
  
  // Auto-save para email de 2FA
  const autoSaveTwoFactorEmail = useCallback((email: string) => {
    if (!establishmentId) return;
    
    if (twoFactorEmailDebounceRef.current) {
      clearTimeout(twoFactorEmailDebounceRef.current);
    }
    
    twoFactorEmailDebounceRef.current = setTimeout(() => {
      toggleTwoFactorMutation.mutate({
        establishmentId,
        enabled: twoFactorEnabled,
        email: email || undefined,
      });
    }, 800);
  }, [establishmentId, twoFactorEnabled, toggleTwoFactorMutation]);
  
  // Handlers com auto-save
  const handleAccountFieldChange = (field: keyof typeof accountData, value: string) => {
    setAccountData(prev => ({ ...prev, [field]: value }));
    autoSaveAccountField(field, value);
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
              <Label htmlFor="name" className="text-sm font-medium">
                Nome do estabelecimento
                <SavedCheck field="name" />
              </Label>
              <Input
                id="name"
                value={accountData.name}
                onChange={(e) => handleAccountFieldChange("name", e.target.value)}
                placeholder="Nome do seu estabelecimento"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cnpj" className="text-sm font-medium">
                CNPJ
                <SavedCheck field="cnpj" />
              </Label>
              <Input
                id="cnpj"
                value={accountData.cnpj}
                onChange={(e) => handleAccountFieldChange("cnpj", formatCNPJ(e.target.value))}
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
              <Label htmlFor="responsibleName" className="text-sm font-medium">
                Nome do responsável
                <SavedCheck field="responsibleName" />
              </Label>
              <Input
                id="responsibleName"
                value={accountData.responsibleName}
                onChange={(e) => handleAccountFieldChange("responsibleName", e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsiblePhone" className="text-sm font-medium">
                Celular do responsável
                <SavedCheck field="responsiblePhone" />
              </Label>
              <Input
                id="responsiblePhone"
                value={accountData.responsiblePhone}
                onChange={(e) => handleAccountFieldChange("responsiblePhone", formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>
        </SectionCard>
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
                    <SavedCheck field="twoFactor" />
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
                <Label htmlFor="twoFactorEmail" className="text-sm font-medium">
                  E-mail para verificação
                  <SavedCheck field="twoFactorEmail" />
                </Label>
                <Input
                  id="twoFactorEmail"
                  type="email"
                  value={twoFactorEmail}
                  onChange={(e) => {
                    setTwoFactorEmail(e.target.value);
                    autoSaveTwoFactorEmail(e.target.value);
                  }}
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
