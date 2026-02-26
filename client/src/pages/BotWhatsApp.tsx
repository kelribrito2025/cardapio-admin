import { trpc } from "@/lib/trpc";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bot,
  BookOpen,
  Power,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminLayout } from "@/components/AdminLayout";

export default function BotWhatsApp() {
  const { data: establishment, refetch: refetchEstablishment } = trpc.establishment.get.useQuery();
  const estId = establishment?.id;
  const botEnabled = establishment?.whatsappBotEnabled ?? false;

  const toggleBotMutation = trpc.establishment.update.useMutation({
    onSuccess: () => {
      refetchEstablishment();
      toast.success(botEnabled ? "Bot desativado!" : "Bot ativado!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao alterar status do bot");
    },
  });

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <AdminLayout>
      <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            Bot WhatsApp
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a integração com bots de atendimento via WhatsApp (n8n, etc.)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Bot Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
            <Power className={cn("h-4 w-4", botEnabled ? "text-green-500" : "text-muted-foreground")} />
            <span className="text-sm font-medium whitespace-nowrap">
              {botEnabled ? "Bot Ativo" : "Bot Inativo"}
            </span>
            <Switch
              checked={botEnabled}
              onCheckedChange={(checked) => {
                if (!estId) return;
                toggleBotMutation.mutate({ id: estId, whatsappBotEnabled: checked });
              }}
              disabled={toggleBotMutation.isPending}
            />
          </div>
        </div>
      </div>

      {/* Info Card - Endpoints */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            Como integrar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            A API Key é gerada automaticamente ao conectar o WhatsApp. Use-a no header <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Authorization: Bearer SUA_API_KEY</code> para acessar os endpoints abaixo:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { method: "GET", path: "/api/bot/establishment", desc: "Dados do estabelecimento" },
              { method: "GET", path: "/api/bot/menu", desc: "Cardápio completo" },
              { method: "GET", path: "/api/bot/menu/search?q=", desc: "Buscar no cardápio" },
              { method: "GET", path: "/api/bot/products/:id", desc: "Detalhes + complementos" },
              { method: "GET", path: "/api/bot/stock/:id", desc: "Verificar estoque" },
              { method: "GET", path: "/api/bot/delivery-fees", desc: "Taxas de entrega" },
              { method: "GET", path: "/api/bot/coupons/validate", desc: "Validar cupom" },
              { method: "POST", path: "/api/bot/orders", desc: "Criar pedido" },
              { method: "GET", path: "/api/bot/orders?phone=", desc: "Pedidos do cliente" },
              { method: "GET", path: "/api/bot/orders/:id", desc: "Detalhes do pedido" },
              { method: "GET", path: "/api/bot/whatsapp-config?phone=", desc: "Buscar estabelecimento pelo WhatsApp" },
              { method: "GET", path: "/api/bot/api-key?establishmentId=", desc: "Buscar API Key pelo estabelecimento" },
              { method: "GET", path: "/api/bot/bot-status", desc: "Verificar se bot está ativo" },
              { method: "GET", path: "/api/bot/menu-link", desc: "Link do cardápio público" },
            ].map((ep) => (
              <div
                key={ep.path}
                className="flex items-center gap-2 bg-background rounded px-3 py-2 border"
              >
                <Badge
                  variant={ep.method === "GET" ? "secondary" : "default"}
                  className={cn(
                    "text-[10px] font-mono w-12 justify-center shrink-0",
                    ep.method === "GET"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  )}
                >
                  {ep.method}
                </Badge>
                <code className="text-xs truncate flex-1">{ep.path}</code>
                <span className="text-xs text-muted-foreground shrink-0 hidden lg:inline">{ep.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground pt-1">
            URL base: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{baseUrl}</code>
          </p>
        </CardContent>
      </Card>
    </div>
    </AdminLayout>
  );
}
