import type { InboxChannel, InboxConversation, InboxSnapshot } from "./types";

export interface InboxProviderConfig {
  accessToken?: string;
  apiUrl?: string;
  accountId?: string;
  webhookSecret?: string;
  [key: string]: string | undefined;
}

export interface InboxProvider {
  readonly channel: InboxChannel;
  isConfigured(): boolean;
  connect(config: InboxProviderConfig): Promise<void>;
  disconnect(): Promise<void>;
  syncConversations(): Promise<InboxConversation[]>;
  sendMessage?(conversationExternalId: string, body: string): Promise<void>;
}

export interface InboxProviderRegistry {
  getProvider(channel: InboxChannel): InboxProvider;
  getAllProviders(): InboxProvider[];
  syncAll(): Promise<InboxConversation[]>;
}
