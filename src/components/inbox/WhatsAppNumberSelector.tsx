import { cn } from "@/lib/utils";
import type { ChannelConnection, WhatsAppConnectionFilter } from "@/lib/inbox/types";

type WhatsAppNumberSelectorProps = {
  connections: ChannelConnection[];
  value: WhatsAppConnectionFilter;
  onChange: (value: WhatsAppConnectionFilter) => void;
};

export function WhatsAppNumberSelector({
  connections,
  value,
  onChange,
}: WhatsAppNumberSelectorProps) {
  const whatsAppConnections = connections.filter(
    (item) => item.channel === "whatsapp" && item.status === "connected" && item.id,
  );

  if (whatsAppConnections.length === 0) return null;

  const tabs: Array<{ id: WhatsAppConnectionFilter; label: string }> = [
    { id: "all", label: "Todos" },
    ...whatsAppConnections.map((item) => ({
      id: item.id!,
      label: item.accountLabel ?? item.phoneNumberId ?? "WhatsApp",
    })),
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 bg-slate-50/80 px-4 py-2 sm:px-6">
      {tabs.map((tab) => {
        const isActive = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition",
              isActive
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
