import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Clock, Calendar, Timer, Info } from "lucide-react";
import { toast } from "sonner";

export function SchedulingSettings() {
  const { data: config, isLoading } = trpc.scheduling.getConfig.useQuery();
  const updateConfig = trpc.scheduling.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Configurações de agendamento salvas com sucesso!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const [enabled, setEnabled] = useState(false);
  const [minAdvance, setMinAdvance] = useState(60);
  const [maxDays, setMaxDays] = useState(7);
  const [interval, setIntervalVal] = useState(30);
  const [moveMinutes, setMoveMinutes] = useState(30);

  useEffect(() => {
    if (config) {
      setEnabled(config.schedulingEnabled);
      setMinAdvance(config.schedulingMinAdvance);
      setMaxDays(config.schedulingMaxDays);
      setIntervalVal(config.schedulingInterval);
      setMoveMinutes(config.schedulingMoveMinutes);
    }
  }, [config]);

  const handleSave = () => {
    updateConfig.mutate({
      schedulingEnabled: enabled,
      schedulingMinAdvance: minAdvance,
      schedulingMaxDays: maxDays,
      schedulingInterval: interval,
      schedulingMoveMinutes: moveMinutes,
    });
  };

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins} minutos`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded-lg w-48" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Agendamento de Pedidos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Permita que seus clientes agendem pedidos para datas e horários futuros
          </p>
        </div>
        <Badge variant={enabled ? "default" : "secondary"} className="text-xs">
          {enabled ? "Ativo" : "Desativado"}
        </Badge>
      </div>

      {/* Toggle principal */}
      <Card className="rounded-xl border-border/50">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarClock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="text-sm font-medium">Habilitar agendamento</Label>
                <p className="text-xs text-muted-foreground">
                  Exibe o botão "Agendar" no menu público para seus clientes
                </p>
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <>
          {/* Configurações de tempo */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Regras de Tempo
              </CardTitle>
              <CardDescription className="text-xs">
                Defina os limites de antecedência para agendamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Antecedência mínima */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Antecedência mínima</Label>
                  <span className="text-sm font-medium text-primary">{formatMinutes(minAdvance)}</span>
                </div>
                <Slider
                  value={[minAdvance]}
                  onValueChange={([v]) => setMinAdvance(v)}
                  min={15}
                  max={480}
                  step={15}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Tempo mínimo antes do horário agendado que o cliente pode fazer o pedido
                </p>
              </div>

              {/* Antecedência máxima (dias) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Antecedência máxima</Label>
                  <span className="text-sm font-medium text-primary">{maxDays} {maxDays === 1 ? "dia" : "dias"}</span>
                </div>
                <Slider
                  value={[maxDays]}
                  onValueChange={([v]) => setMaxDays(v)}
                  min={1}
                  max={30}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Quantos dias no futuro o cliente pode agendar
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Intervalo de horários */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                Intervalo de Horários
              </CardTitle>
              <CardDescription className="text-xs">
                Defina o intervalo entre os horários disponíveis para agendamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[15, 30, 60].map((val) => (
                  <button
                    key={val}
                    onClick={() => setIntervalVal(val)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      interval === val
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/30 text-muted-foreground"
                    }`}
                  >
                    <span className="text-lg font-semibold">{val}</span>
                    <span className="text-xs">minutos</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Exemplo: com intervalo de {interval} min, os horários serão 11:00, {interval === 15 ? "11:15, 11:30, 11:45" : interval === 30 ? "11:30, 12:00, 12:30" : "12:00, 13:00, 14:00"}...
              </p>
            </CardContent>
          </Card>

          {/* Automação da fila */}
          <Card className="rounded-xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Automação da Fila
              </CardTitle>
              <CardDescription className="text-xs">
                Configure quando o pedido agendado entra automaticamente na fila de preparo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Mover para fila de preparo</Label>
                <span className="text-sm font-medium text-primary">{formatMinutes(moveMinutes)} antes</span>
              </div>
              <Slider
                value={[moveMinutes]}
                onValueChange={([v]) => setMoveMinutes(v)}
                min={5}
                max={120}
                step={5}
                className="w-full"
              />
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  O pedido agendado será movido automaticamente para a fila de pedidos novos {formatMinutes(moveMinutes)} antes do horário agendado, para que você tenha tempo de preparar.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Botão salvar */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className="rounded-xl shadow-sm"
        >
          {updateConfig.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}
