import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Printer,
  Plus,
  Pencil,
  Trash2,
  ChefHat,
  Loader2,
  ArrowLeft,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

interface PrinterSector {
  id: number;
  establishmentId: number;
  name: string;
  linkcode: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function SetoresImpressao() {
  const { data: establishment } = trpc.establishment.get.useQuery();
  const { data: sectors, refetch: refetchSectors } = trpc.printerSector.list.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id }
  );

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<PrinterSector | null>(null);
  const [sectorName, setSectorName] = useState("");
  const [sectorLinkcode, setSectorLinkcode] = useState("");
  const [sectorIsActive, setSectorIsActive] = useState(true);
  const [sectorSortOrder, setSectorSortOrder] = useState(0);
  
  // Delete confirmation
  const [deletingSector, setDeletingSector] = useState<PrinterSector | null>(null);

  // Mutations
  const createSector = trpc.printerSector.create.useMutation({
    onSuccess: () => {
      toast.success("Setor criado com sucesso!");
      refetchSectors();
      closeDialog();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar setor");
    },
  });

  const updateSector = trpc.printerSector.update.useMutation({
    onSuccess: () => {
      toast.success("Setor atualizado com sucesso!");
      refetchSectors();
      closeDialog();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar setor");
    },
  });

  const deleteSector = trpc.printerSector.delete.useMutation({
    onSuccess: () => {
      toast.success("Setor removido com sucesso!");
      refetchSectors();
      setDeletingSector(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover setor");
    },
  });

  const openCreateDialog = () => {
    setEditingSector(null);
    setSectorName("");
    setSectorLinkcode("");
    setSectorIsActive(true);
    setSectorSortOrder(sectors?.length || 0);
    setIsDialogOpen(true);
  };

  const openEditDialog = (sector: PrinterSector) => {
    setEditingSector(sector);
    setSectorName(sector.name);
    setSectorLinkcode(sector.linkcode || "");
    setSectorIsActive(sector.isActive);
    setSectorSortOrder(sector.sortOrder);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSector(null);
    setSectorName("");
    setSectorLinkcode("");
    setSectorIsActive(true);
    setSectorSortOrder(0);
  };

  const handleSubmit = () => {
    if (!sectorName.trim()) {
      toast.error("Nome do setor é obrigatório");
      return;
    }

    if (!establishment?.id) {
      toast.error("Estabelecimento não encontrado");
      return;
    }

    if (editingSector) {
      updateSector.mutate({
        id: editingSector.id,
        name: sectorName.trim(),
        linkcode: sectorLinkcode.trim() || null,
        isActive: sectorIsActive,
        sortOrder: sectorSortOrder,
      });
    } else {
      createSector.mutate({
        establishmentId: establishment.id,
        name: sectorName.trim(),
        linkcode: sectorLinkcode.trim() || null,
        isActive: sectorIsActive,
        sortOrder: sectorSortOrder,
      });
    }
  };

  const handleDelete = () => {
    if (deletingSector) {
      deleteSector.mutate({ id: deletingSector.id });
    }
  };

  const isLoading = createSector.isPending || updateSector.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/configuracoes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <PageHeader
            title="Setores de Impressão"
            description="Configure os setores de preparo (Cozinha, Sushi Bar, Bar, etc.) e suas impressoras"
          />
        </div>

        {/* Info Card */}
        <SectionCard className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Como funciona:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Crie setores para cada área de preparo (ex: Cozinha, Sushi Bar, Bar)</li>
                <li>Configure o <strong>linkcode</strong> do app ESC/POS Printer Driver de cada setor</li>
                <li>Nos produtos, selecione qual setor prepara cada item</li>
                <li>Ao aceitar um pedido, cada setor receberá automaticamente apenas seus itens</li>
              </ul>
            </div>
          </div>
        </SectionCard>

        {/* Sectors List */}
        <SectionCard
          title="Setores Cadastrados"
          actions={
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Setor
            </Button>
          }
        >
          {!sectors || sectors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum setor cadastrado</p>
              <p className="text-sm mt-1">Clique em "Novo Setor" para adicionar o primeiro setor de impressão</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Linkcode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectors.map((sector) => (
                  <TableRow key={sector.id}>
                    <TableCell className="font-medium">{sector.name}</TableCell>
                    <TableCell>
                      {sector.linkcode ? (
                        <code className="bg-muted px-2 py-1 rounded text-sm">{sector.linkcode}</code>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não configurado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {sector.isActive ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <XCircle className="h-4 w-4" />
                          Inativo
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{sector.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(sector)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingSector(sector)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSector ? "Editar Setor" : "Novo Setor de Impressão"}
              </DialogTitle>
              <DialogDescription>
                {editingSector
                  ? "Atualize as informações do setor de impressão"
                  : "Configure um novo setor de preparo para receber pedidos"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sectorName">Nome do Setor *</Label>
                <Input
                  id="sectorName"
                  placeholder="Ex: Cozinha, Sushi Bar, Bar..."
                  value={sectorName}
                  onChange={(e) => setSectorName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sectorLinkcode">Linkcode do ESC/POS Printer Driver</Label>
                <Input
                  id="sectorLinkcode"
                  placeholder="Ex: abc123xyz"
                  value={sectorLinkcode}
                  onChange={(e) => setSectorLinkcode(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Código gerado pelo app ESC/POS Printer Driver no dispositivo Android deste setor
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sectorSortOrder">Ordem de Exibição</Label>
                <Input
                  id="sectorSortOrder"
                  type="number"
                  min={0}
                  value={sectorSortOrder}
                  onChange={(e) => setSectorSortOrder(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Setor Ativo</Label>
                  <p className="text-xs text-muted-foreground">
                    Setores inativos não recebem impressões
                  </p>
                </div>
                <Switch
                  checked={sectorIsActive}
                  onCheckedChange={setSectorIsActive}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingSector ? "Salvar" : "Criar Setor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingSector} onOpenChange={() => setDeletingSector(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Setor</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover o setor "{deletingSector?.name}"?
                Os produtos vinculados a este setor terão o campo de setor removido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteSector.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
