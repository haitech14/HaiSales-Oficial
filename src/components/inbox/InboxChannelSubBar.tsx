import { INBOX_CHANNEL_ORDER, inboxChannelMeta } from "@/lib/inbox/channels";
import type { InboxChannel } from "@/lib/inbox/types";
import { ChannelIcon } from "@/components/inbox/ChannelIcon";
import { cn } from "@/lib/utils";

type InboxChannelSubBarProps = {
  activeChannel: InboxChannel;
  counts: Record<InboxChannel, number>;
  onChannelChange: (channel: InboxChannel) => void;
};

export function InboxChannelSubBar({
  activeChannel,
  counts,
  onChannelChange,
}: InboxChannelSubBarProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-100 pb-0">
      {INBOX_CHANNEL_ORDER.map((channel) => {
        const meta = inboxChannelMeta[channel];
        const isActive = activeChannel === channel;
        const count = counts[channel] ?? 0;

        return (
          <button
            key={channel}
            type="button"
            onClick={() => onChannelChange(channel)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold transition",
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700",
            )}
          >
            <ChannelIcon channel={channel} size="sm" />
            <span className="whitespace-nowrap">{meta.label}</span>
            {count > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
