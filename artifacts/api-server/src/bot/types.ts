import type {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  Collection,
} from "discord.js";

export interface SlashCommand {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface ExtendedClient extends Client {
  commands: Collection<string, SlashCommand>;
}

export interface TicketData {
  channelId: string;
  userId: string;
  guildId: string;
  createdAt: Date;
  reason: string;
  messages: { author: string; content: string; timestamp: Date }[];
}

export interface GiveawayData {
  messageId: string;
  channelId: string;
  guildId: string;
  prize: string;
  winnersCount: number;
  endTime: Date;
  hostId: string;
  ended: boolean;
  participants: string[];
}
