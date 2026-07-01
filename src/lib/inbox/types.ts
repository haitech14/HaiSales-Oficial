export type InboxChannel =
  | "whatsapp"
  | "facebook"
  | "messenger"
  | "tiktok"
  | "web"
  | "email";

export type InboxStage = "nuevo" | "seguimiento" | "cotizado" | "cerrado" | "perdido";

export type InboxPriority = "alta" | "media" | "baja";

export type InboxStatus = "activa" | "cerrada";

export type InboxTab = "todos" | InboxStage;

export interface InboxContact {
  name: string;
  identifier: string;
  avatarUrl?: string;
}

export interface InboxConversation {
  id: string;
  channel: InboxChannel;
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
  channel: InboxChannel;
  status: "connected" | "disconnected" | "error";
  accountLabel?: string;
  lastSyncAt?: string;
  errorMessage?: string;
}

export interface InboxFilters {
  tab: InboxTab;
  channel: InboxChannel | "all";
  advisor: string;
  search: string;
}
