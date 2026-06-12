import type { TicketData, GiveawayData } from "./types.js";

export const tickets = new Map<string, TicketData>();
export const giveaways = new Map<string, GiveawayData>();

export const spamMap = new Map<string, { count: number; firstMessage: number }>();
export const warnMap = new Map<string, string[]>();

export const SPAM_THRESHOLD = 5;
export const SPAM_WINDOW_MS = 5000;
export const MUTE_DURATION_MS = 5 * 60 * 1000;

export interface VouchData {
  authorId: string;
  targetId: string;
  guildId: string;
  comment: string;
  timestamp: Date;
}

export const vouches = new Map<string, VouchData[]>();

export interface GuildConfig {
  vouchChannelId?: string;
  vouchCounterChannelId?: string;
}

export const guildConfigs = new Map<string, GuildConfig>();
