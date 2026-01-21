import { useState } from "react";
import { Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSoundNotification } from "@/contexts/SoundNotificationContext";

export function SoundActivationBanner() {
  const { soundEnabled, requestPermission } = useSoundNotification();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if sound is already enabled or banner was dismissed
  if (soundEnabled || dismissed) {
    return null;
  }

  const handleActivate = async () => {
    await requestPermission();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex items-center gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
          <Volume2 className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">Alertas sonoros desativados</p>
          <p className="text-xs text-gray-500">Clique para receber alertas de novos pedidos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleActivate}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Ativar
          </Button>
        </div>
      </div>
    </div>
  );
}
