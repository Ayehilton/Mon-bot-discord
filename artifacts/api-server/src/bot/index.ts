import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} from "discord.js";
import type { SlashCommand } from "./types.js";
import { logger } from "../lib/logger.js";
import { registerEvents } from "./events/index.js";
import { loadCommands } from "./handlers/commandLoader.js";

const privilegedIntents: GatewayIntentBits[] = [];

if (process.env["DISCORD_INTENT_MEMBERS"] === "true") {
  privilegedIntents.push(GatewayIntentBits.GuildMembers);
}
if (process.env["DISCORD_INTENT_PRESENCE"] === "true") {
  privilegedIntents.push(GatewayIntentBits.GuildPresences);
}
if (process.env["DISCORD_INTENT_MESSAGES"] === "true") {
  privilegedIntents.push(GatewayIntentBits.MessageContent);
}

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    ...privilegedIntents,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

(client as any).commands = new Collection<string, SlashCommand>();

export async function startBot() {
  const token = process.env["DISCORD_TOKEN"];
  if (!token) {
    logger.error("DISCORD_TOKEN is not set");
    return;
  }

  await loadCommands(client);
  registerEvents(client);

  await client.login(token);
  logger.info("Discord bot starting...");
}
