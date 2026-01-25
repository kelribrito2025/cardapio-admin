import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Printer,
  Plus,
  Trash2,
  Save,
  Settings2,
  Wifi,
  WifiOff,
  Star,
  TestTube,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PrinterData = {
  id: number;
  name: string;
  ipAddress: string;
  port: number;
  isActive: boolean;
  isDefault: boolean;
};

export default function Impressoras() {
  const { data: establishment } = trpc.establishment.get.useQuery();
  const { data: printers, refetch: refetchPrinters } = trpc.printer.list.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id }
  );
  const { data: printerSettings, refetch: refetchSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id }
  );

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterData | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [printerToDelete, setPrinterToDelete] = useState<PrinterData | null>(null);

  // Form state
  const [printerName, setPrinterName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [port, setPort] = useState(9100);
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  // Settings state
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);
  const [printOnNewOrder, setPrintOnNewOrder] = useState(true);
  const [printOnStatusChange, setPrintOnStatusChange] = useState(false);
  const [copies, setCopies] = useState(1);
  const [showLogo, setShowLogo] = useState(true);
  const [showQrCode, setShowQrCode] = useState(false);
  const [footerMessage, setFooterMessage] = useState("");

  // Load settings
  useEffect(() => {
    if (printerSettings) {
      setAutoPrintEnabled(printerSettings.autoPrintEnabled);
      setPrintOnNewOrder(printerSettings.printOnNewOrder);
      setPrintOnStatusChange(printerSettings.printOnStatusChange);
      setCopies(printerSettings.copies);
      setShowLogo(printerSettings.showLogo);
      setShowQrCode(printerSettings.showQrCode);
      setFooterMessage(printerSettings.footerMessage || "");
    }
  }, [printerSettings]);

  // Mutations
  const createPrinterMutation = trpc.printer.create.useMutation({
    onSuccess: () => {
      refetchPrinters();
      setIsModalOpen(false);
      resetForm();
      toast.success("Impressora adicionada com sucesso");
    },
    onError: () => toast.error("Erro ao adicionar impressora"),
  });

  const updatePrinterMutation = trpc.printer.update.useMutation({
    onSuccess: () => {
      refetchPrinters();
      setIsModalOpen(false);
      resetForm();
      toast.success("Impressora atualizada com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar impressora"),
  });

  const deletePrinterMutation = trpc.printer.delete.useMutation({
    onSuccess: () => {
      refetchPrinters();
      setDeleteConfirmOpen(false);
      setPrinterToDelete(null);
      toast.success("Impressora removida com sucesso");
    },
    onError: () => toast.error("Erro ao remover impressora"),
  });

  const saveSettingsMutation = trpc.printer.saveSettings.useMutation({
    onSuccess: () => {
      refetchSettings();
      toast.success("Configurações salvas com sucesso");
    },
    onError: () => toast.error("Erro ao salvar configurações"),
  });

  const resetForm = () => {
    setPrinterName("");
    setIpAddress("");
    setPort(9100);
    setIsActive(true);
    setIsDefault(false);
    setEditingPrinter(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (printer: PrinterData) => {
    setEditingPrinter(printer);
    setPrinterName(printer.name);
    setIpAddress(printer.ipAddress);
    setPort(printer.port);
    setIsActive(printer.isActive);
    setIsDefault(printer.isDefault);
    setIsModalOpen(true);
  };

  const handleSavePrinter = () => {
    if (!printerName.trim()) {
      toast.error("Nome da impressora é obrigatório");
      return;
    }
    if (!ipAddress.trim()) {
      toast.error("Endereço IP é obrigatório");
      return;
    }

    if (editingPrinter) {
      updatePrinterMutation.mutate({
        id: editingPrinter.id,
        name: printerName,
        ipAddress,
        port,
        isActive,
        isDefault,
      });
    } else {
      createPrinterMutation.mutate({
        establishmentId: establishment?.id || 0,
        name: printerName,
        ipAddress,
        port,
        isActive,
        isDefault,
      });
    }
  };

  const handleDeletePrinter = (printer: PrinterData) => {
    setPrinterToDelete(printer);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (printerToDelete) {
      deletePrinterMutation.mutate({ id: printerToDelete.id });
    }
  };

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      establishmentId: establishment?.id || 0,
      autoPrintEnabled,
      printOnNewOrder,
      printOnStatusChange,
      copies,
      showLogo,
      showQrCode,
      footerMessage: footerMessage || null,
    });
  };

  if (!establishment) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Impressoras"
        description="Configure suas impressoras térmicas para impressão automática de pedidos"
      />

      <div className="space-y-6">
        {/* Seção de Configurações Gerais */}
        <SectionCard
          title="Configurações de Impressão"
          description="Configure como os pedidos serão impressos automaticamente"
        >
          <div className="space-y-6">
            {/* Toggle de Impressão Automática */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="space-y-1">
                <Label className="text-base font-medium">Impressão Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Imprimir pedidos automaticamente quando recebidos
                </p>
              </div>
              <Switch
                checked={autoPrintEnabled}
                onCheckedChange={setAutoPrintEnabled}
              />
            </div>

            {autoPrintEnabled && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                {/* Quando Imprimir */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Quando imprimir:</Label>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Ao receber novo pedido</Label>
                    <Switch
                      checked={printOnNewOrder}
                      onCheckedChange={setPrintOnNewOrder}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Ao mudar status do pedido</Label>
                    <Switch
                      checked={printOnStatusChange}
                      onCheckedChange={setPrintOnStatusChange}
                    />
                  </div>
                </div>

                {/* Número de Cópias */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Número de cópias</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCopies(Math.max(1, copies - 1))}
                      disabled={copies <= 1}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{copies}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCopies(Math.min(5, copies + 1))}
                      disabled={copies >= 5}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Opções do Cupom */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Opções do cupom:</Label>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Mostrar logo do estabelecimento</Label>
                    <Switch
                      checked={showLogo}
                      onCheckedChange={setShowLogo}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Mostrar QR Code</Label>
                    <Switch
                      checked={showQrCode}
                      onCheckedChange={setShowQrCode}
                    />
                  </div>
                </div>

                {/* Mensagem do Rodapé */}
                <div className="space-y-2">
                  <Label className="text-sm">Mensagem do rodapé (opcional)</Label>
                  <Textarea
                    value={footerMessage}
                    onChange={(e) => setFooterMessage(e.target.value)}
                    placeholder="Ex: Obrigado pela preferência! Volte sempre!"
                    className="resize-none"
                    rows={2}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleSaveSettings}
              disabled={saveSettingsMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </SectionCard>

        {/* Seção de Impressoras */}
        <SectionCard
          title="Impressoras Cadastradas"
          description="Gerencie suas impressoras térmicas"
          actions={
            <Button onClick={openAddModal} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          }
        >
          {/* Aviso sobre Print Server */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl mb-4">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Requisito: Print Server Local</p>
              <p>
                Para que a impressão automática funcione, é necessário ter o aplicativo 
                Print Server rodando no computador conectado à impressora. 
                O Print Server recebe os pedidos via internet e envia para a impressora na rede local.
              </p>
            </div>
          </div>

          {printers && printers.length > 0 ? (
            <div className="space-y-3">
              {printers.map((printer) => (
                <div
                  key={printer.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${printer.isActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      {printer.isActive ? (
                        <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{printer.name}</span>
                        {printer.isDefault && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                            <Star className="h-3 w-3" />
                            Padrão
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {printer.ipAddress}:{printer.port}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(printer)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePrinter(printer)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Printer className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma impressora cadastrada</p>
              <p className="text-sm">Adicione uma impressora para começar</p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Modal de Adicionar/Editar Impressora */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPrinter ? "Editar Impressora" : "Adicionar Impressora"}
            </DialogTitle>
            <DialogDescription>
              Configure os dados da impressora térmica
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="printerName">Nome da Impressora</Label>
              <Input
                id="printerName"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                placeholder="Ex: Cozinha, Balcão, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipAddress">Endereço IP</Label>
              <Input
                id="ipAddress"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="Ex: 192.168.1.100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="port">Porta</Label>
              <Input
                id="port"
                type="number"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value) || 9100)}
                placeholder="9100"
              />
              <p className="text-xs text-muted-foreground">
                A porta padrão para impressoras ESC/POS é 9100
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Impressora Ativa</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isDefault">Impressora Padrão</Label>
              <Switch
                id="isDefault"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSavePrinter}
              disabled={createPrinterMutation.isPending || updatePrinterMutation.isPending}
            >
              {createPrinterMutation.isPending || updatePrinterMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Impressora</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a impressora "{printerToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
