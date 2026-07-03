import { Globe, Instagram, Mail, MessageCircle, MessageSquare, Share2, Video } from "lucide-react";
import type { InboxChannel, InboxStage, InboxViewFilter } from "./types";

export const INBOX_CHANNEL_ORDER: InboxChannel[] = [
  "whatsapp",
  "instagram",
  "facebook",
  "messenger",
  "tiktok",
  "web",
  "email",
];

export const inboxChannelMeta: Record<
  InboxChannel,
  {
    label: string;
    shortLabel: string;
    color: string;
    bgLight: string;
    textColor: string;
    icon: typeof MessageCircle;
    apiEnvKeys: string[];
    webhookPath: string;
  }
> = {
  whatsapp: {
    label: "WhatsApp",
    shortLabel: "WA",
    color: "#22c55e",
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-700",
    icon: MessageCircle,
    apiEnvKeys: ["VITE_WHATSAPP_API_URL", "VITE_WHATSAPP_ACCESS_TOKEN", "VITE_WHATSAPP_PHONE_NUMBER_ID", "VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN"],
    webhookPath: "/functions/v1/whatsapp-webhook",
  },
  instagram: {
    label: "Instagram",
    shortLabel: "IG",
    color: "#e1306c",
    bgLight: "bg-pink-50",
    textColor: "text-pink-700",
    icon: Instagram,
    apiEnvKeys: ["VITE_INSTAGRAM_APP_ID", "VITE_INSTAGRAM_ACCESS_TOKEN"],
    webhookPath: "/api/webhooks/instagram",
  },
  facebook: {
    label: "Facebook",
    shortLabel: "FB",
    color: "#1877f2",
    bgLight: "bg-blue-50",
    textColor: "text-blue-700",
    icon: Share2,
    apiEnvKeys: ["VITE_FACEBOOK_APP_ID", "VITE_FACEBOOK_APP_SECRET", "VITE_FACEBOOK_PAGE_ACCESS_TOKEN"],
    webhookPath: "/api/webhooks/facebook",
  },
  messenger: {
    label: "Messenger",
    shortLabel: "MSG",
    color: "#0084ff",
    bgLight: "bg-sky-50",
    textColor: "text-sky-700",
    icon: MessageSquare,
    apiEnvKeys: ["VITE_MESSENGER_PAGE_ACCESS_TOKEN", "VITE_MESSENGER_VERIFY_TOKEN"],
    webhookPath: "/api/webhooks/messenger",
  },
  tiktok: {
    label: "TikTok",
    shortLabel: "TT",
    color: "#010101",
    bgLight: "bg-slate-100",
    textColor: "text-slate-800",
    icon: Video,
    apiEnvKeys: ["VITE_TIKTOK_CLIENT_KEY", "VITE_TIKTOK_CLIENT_SECRET", "VITE_TIKTOK_ACCESS_TOKEN"],
    webhookPath: "/api/webhooks/tiktok",
  },
  web: {
    label: "Web Chat",
    shortLabel: "WEB",
    color: "#6366f1",
    bgLight: "bg-indigo-50",
    textColor: "text-indigo-700",
    icon: Globe,
    apiEnvKeys: ["VITE_WEB_CHAT_WIDGET_ID", "VITE_WEB_CHAT_API_KEY"],
    webhookPath: "/api/webhooks/web",
  },
  email: {
    label: "Correo Electrónico",
    shortLabel: "MAIL",
    color: "#f59e0b",
    bgLight: "bg-amber-50",
    textColor: "text-amber-700",
    icon: Mail,
    apiEnvKeys: ["VITE_EMAIL_IMAP_HOST", "VITE_EMAIL_SMTP_HOST", "VITE_EMAIL_OAUTH_CLIENT_ID"],
    webhookPath: "/api/webhooks/email",
  },
};

export const inboxStageMeta: Record<
  InboxStage,
  { label: string; badgeClass: string; tabCount?: number }
> = {
  nuevo: { label: "Nuevo", badgeClass: "bg-sky-100 text-sky-700", tabCount: 32 },
  seguimiento: { label: "En seguimiento", badgeClass: "bg-blue-100 text-blue-700", tabCount: 68 },
  cotizado: { label: "Cotizado", badgeClass: "bg-violet-100 text-violet-700", tabCount: 24 },
  cerrado: { label: "Cerrado", badgeClass: "bg-emerald-100 text-emerald-700", tabCount: 40 },
  perdido: { label: "Perdido", badgeClass: "bg-rose-100 text-rose-700", tabCount: 22 },
};

export const inboxPriorityMeta: Record<"alta" | "media" | "baja", string> = {
  alta: "text-rose-600",
  media: "text-amber-600",
  baja: "text-emerald-600",
};

export const inboxViewTabs: { id: InboxViewFilter; label: string; count?: number }[] = [
  { id: "all", label: "Todos", count: 128 },
  { id: "unread", label: "No leídos", count: 16 },
  { id: "team-chat", label: "Chat de equipo" },
  { id: "whatsapp", label: "WhatsApp", count: 68 },
  { id: "instagram", label: "Instagram", count: 24 },
  { id: "facebook", label: "Facebook", count: 18 },
  { id: "web", label: "Web Chat", count: 10 },
  { id: "email", label: "Email", count: 8 },
];
