import type { Client } from "discord.js";
import type { ExtendedClient, SlashCommand } from "../types.js";
import { logger } from "../../lib/logger.js";

import * as ticketCmd from "../commands/ticket.js";
import * as giveawayCmd from "../commands/giveaway.js";
import * as moderationCmd from "../commands/moderation.js";
import * as statsCmd from "../commands/stats.js";
import * as ratingCmd from "../commands/rating.js";
import * as vouchCmd from "../commands/vouch.js";

const allCommands: SlashCommand[] = [
  ticketCmd,
  giveawayCmd,
  moderationCmd,
  statsCmd,
  ratingCmd,
  vouchCmd,
];

export async function loadCommands(client: Client) {
  const ext = client as ExtendedClient;
  for (const cmd of allCommands) {
    ext.commands.set(cmd.data.name, cmd);
    logger.info(`Commande chargée: ${cmd.data.name}`);
  }
}
