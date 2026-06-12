import type { Client } from "discord.js";
import { onReady } from "./ready.js";
import { onInteractionCreate } from "./interactionCreate.js";
import { onMessageCreate } from "./messageCreate.js";
import { onGuildMemberAdd } from "./guildMemberAdd.js";

export function registerEvents(client: Client) {
  client.once("clientReady", (c) => onReady(c));
  client.on("interactionCreate", (i) => onInteractionCreate(i));
  client.on("messageCreate", (m) => onMessageCreate(m));
  client.on("guildMemberAdd", (m) => onGuildMemberAdd(m));
}
