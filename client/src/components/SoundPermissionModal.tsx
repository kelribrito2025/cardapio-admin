import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Volume2 } from "lucide-react";
import { useSoundNotification } from "@/contexts/SoundNotificationContext";

export function SoundPermissionModal() {
  const { showPermissionModal, setShowPermissionModal, requestPermission } = useSoundNotification();

  const handleActivate = async () => {
    await requestPermission();
  };

  const handleDismiss = () => {
    setShowPermissionModal(false);
  };

  return (
    <Dialog open={showPermissionModal} onOpenChange={setShowPermissionModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Volume2 className="h-8 w-8 text-red-600" />
          </div>
          <DialogTitle className="text-center text-xl">Alertas Sonoros</DialogTitle>
          <DialogDescription className="text-center text-base">
            Deseja ativar alertas sonoros para novos pedidos? Você será notificado com um som sempre que um novo pedido chegar.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="flex-1 gap-2"
          >
            <BellOff className="h-4 w-4" />
            Agora não
          </Button>
          <Button
            onClick={handleActivate}
            className="flex-1 gap-2 bg-red-600 hover:bg-red-700"
          >
            <Bell className="h-4 w-4" />
            Ativar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
