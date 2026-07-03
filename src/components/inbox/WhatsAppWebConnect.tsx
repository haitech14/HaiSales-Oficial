import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WhatsAppWebConnectProps = {
  isLinking: boolean;
  onConnect: () => void;
};

function QrPlaceholder() {
  const cells = Array.from({ length: 49 }, (_, index) => {
    const row = Math.floor(index / 7);
    const col = index % 7;
    const isCorner =
      (row < 2 && col < 2) ||
      (row < 2 && col > 4) ||
      (row > 4 && col < 2) ||
      (row === 3 && col === 3);
    const isDot = (row + col) % 2 === 0;
    return isCorner || isDot;
  });

  return (
    <div className="grid grid-cols-7 gap-0.5 rounded-lg border-4 border-emerald-500 bg-white p-3">
      {cells.map((filled, index) => (
        <span
          key={index}
          className={cn("h-3 w-3 rounded-[1px]", filled ? "bg-slate-900" : "bg-white")}
        />
      ))}
    </div>
  );
}

export function WhatsAppWebConnect({ isLinking, onConnect }: WhatsAppWebConnectProps) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center bg-[#f0f2f5] px-6 py-10 text-center">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Usa HaiSales en tu computadora</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Vincula WhatsApp Web escaneando el código QR con tu teléfono para recibir y responder
          conversaciones desde el Inbox.
        </p>

        <ol className="mt-5 space-y-2 text-left text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="font-semibold text-emerald-600">1.</span>
            Abre WhatsApp en tu teléfono
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-emerald-600">2.</span>
            Toca Menú o Configuración y selecciona Dispositivos vinculados
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-emerald-600">3.</span>
            Toca Vincular dispositivo y escanea el código
          </li>
        </ol>

        <div className="mt-6 flex justify-center">
          {isLinking ? (
            <div className="flex h-[148px] w-[148px] items-center justify-center rounded-lg border border-dashed border-emerald-300 bg-emerald-50">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <QrPlaceholder />
          )}
        </div>

        <Button
          className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500"
          onClick={onConnect}
          disabled={isLinking}
        >
          {isLinking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Esperando escaneo...
            </>
          ) : (
            <>
              <Smartphone className="mr-2 h-4 w-4" />
              Simular escaneo QR
            </>
          )}
        </Button>

        <p className="mt-3 text-[11px] text-slate-400">
          En producción, aquí se mostrará el QR generado por la API de WhatsApp Business.
        </p>
      </div>
    </div>
  );
}
