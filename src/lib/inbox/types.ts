export type InboxChannel =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "messenger"
  | "tiktok"
  | "web"
  | "email";

export type InboxStage = "nuevo" | "seguimiento" | "cotizado" | "cerrado" | "perdido";

export type InboxPriority = "alta" | "media" | "baja";

export type InboxStatus = "activa" | "cerrada";

export type InboxTab = "todos" | InboxStage;

export type InboxViewFilter = "all" | "unread" | "team-chat" | InboxChannel;

export interface InboxContact {
  name: string;
  identifier: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  location?: string;
  isFrequentClient?: boolean;
  clientSince?: string;
  totalPurchases?: string;
  orderCount?: number;
  tags?: string[];
  previousConversations?: { id: string; title: string; date: string; channel: InboxChannel }[];
  internalNotes?: { id: string; author: string; date: string; body: string }[];
}

export interface InboxMessage {
  id: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  body: string;
  sentAt: string;
  isAutoReply?: boolean;
}

export interface InboxConversation {
  id: string;
  channel: InboxChannel;
  connectionId?: string;
  sourcePhoneLabel?: string;
  externalId: string;
  contact: InboxContact;
  lastMessage: string;
  lastMessageAt: string;
  isRead: boolean;
  stage: InboxStage;
  priority: InboxPriority;
  status: InboxStatus;
  advisor: string;
  advisorInitials: string;
  campaign?: string;
  isAssigned?: boolean;
  contactType?: "cliente" | "lead" | "prospecto";
}

export interface InboxKpi {
  label: string;
  value: string;
  change: string;
  changePositive: boolean;
  sparkColor: string;
  sparkPoints: number[];
}

export interface InboxStageStat {
  stage: InboxStage;
  label: string;
  count: number;
  color: string;
}

export interface InboxAdvisorStat {
  name: string;
  initials: string;
  responseRate: number;
}

export interface InboxPendingStats {
  unanswered: number;
  waitingCustomer: number;
  assigned: number;
}

export interface InboxSnapshot {
  conversations: InboxConversation[];
  kpis: InboxKpi[];
  stageStats: InboxStageStat[];
  advisorStats: InboxAdvisorStat[];
  pending: InboxPendingStats;
  updatedAt: string;
}

export interface ChannelConnection {
  id?: string;
  channel: InboxChannel;
  phoneNumberId?: string;
  status: "connected" | "disconnected" | "error";
  accountLabel?: string;
  lastSyncAt?: string;
  errorMessage?: string;
}

export type WhatsAppConnectionFilter = "all" | string;

export interface InboxFilters {
  view: InboxViewFilter;
  advisor: string;
  search: string;
}
