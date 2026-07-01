import { inboxChannelMeta } from "@/lib/inbox/channels";
import type { InboxChannel } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

export function ChannelIcon({
  channel,
  className,
  size = "md",
}: {
  channel: InboxChannel;
  className?: string;
  size?: "sm" | "md";
}) {
  const meta = inboxChannelMeta[channel];
  const Icon = meta.icon;
  const sizeClass = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md text-white",
        sizeClass,
        className,
      )}
      style={{ backgroundColor: meta.color }}
      title={meta.label}
    >
      <Icon className={iconSize} strokeWidth={2} />
    </span>
  );
}
