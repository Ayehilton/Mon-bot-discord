import type { Message } from "discord.js";
import { ticketMessage } from "./messageCommands/ticket.js";
import { giveawayMessage } from "./messageCommands/giveaway.js";
import { modMessage } from "./messageCommands/mod.js";
import { statsMessage } from "./messageCommands/stats.js";
import { evaluationMessage } from "./messageCommands/evaluation.js";
import { vouchMessage } from "./messageCommands/vouch.js";
import { helpMessage } from "./messageCommands/help.js";
import { logger } from "../../lib/logger.js";

export const PREFIX = "!";

export async function handleMessageCommand(message: Message) {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const raw = message.content.slice(PREFIX.length).trim();
  const parts = raw.split(/\s+/);
  const command = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  if (!command) return;

  try {
    switch (command) {
      case "ticket":
        await ticketMessage(message, args);
        break;
      case "giveaway":
      case "gw":
        await giveawayMessage(message, args);
        break;
      case "mod":
        await modMessage(message, args);
        break;
      case "stats":
        await statsMessage(message, args);
        break;
      case "evaluation":
      case "eval":
        await evaluationMessage(message, args);
        break;
      case "vouch":
        await vouchMessage(message, args);
        break;
      case "help":
      case "aide":
        await helpMessage(message);
        break;
      default:
        break;
    }
  } catch (err) {
    logger.error({ err }, `Erreur commande préfixe: !${command}`);
    try {
      await message.reply("❌ Une erreur est survenue lors de l'exécution de la commande.");
    } catch {}
  }
}
