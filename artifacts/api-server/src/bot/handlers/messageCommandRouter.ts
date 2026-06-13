import type { Message } from "discord.js";
import { ticketMessage } from "./messageCommands/ticket.js";
import { giveawayMessage } from "./messageCommands/giveaway.js";
import { modMessage } from "./messageCommands/mod.js";
import { statsMessage } from "./messageCommands/stats.js";
import { evaluationMessage } from "./messageCommands/evaluation.js";
import { vouchMessage } from "./messageCommands/vouch.js";
import { helpMessage } from "./messageCommands/help.js";
import { paiementMessage } from "./messageCommands/paiement.js";
import { clearMessage } from "./messageCommands/clear.js";
import { rulesMessage } from "./messageCommands/rules.js";
import { catalogueMessage } from "./messageCommands/catalogue.js";
import { pingMessage } from "./messageCommands/ping.js";
import { serverinfoMessage } from "./messageCommands/serverinfo.js";
import { userinfoMessage } from "./messageCommands/userinfo.js";
import { avatarMessage } from "./messageCommands/avatar.js";
import { sayMessage } from "./messageCommands/say.js";
import { annonceMessage } from "./messageCommands/annonce.js";
import { sondageMessage } from "./messageCommands/sondage.js";
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
      case "ticket": await ticketMessage(message, args); break;
      case "giveaway":
      case "gw": await giveawayMessage(message, args); break;
      case "mod": await modMessage(message, args); break;
      case "stats": await statsMessage(message, args); break;
      case "evaluation":
      case "eval": await evaluationMessage(message, args); break;
      case "vouch": await vouchMessage(message, args); break;
      case "help":
      case "aide": await helpMessage(message); break;
      case "paiement":
      case "paiements":
      case "payment": await paiementMessage(message); break;
      case "clear":
      case "purge": await clearMessage(message, args); break;
      case "rules":
      case "regles":
      case "règles":
      case "conditions": await rulesMessage(message); break;
      case "catalogue":
      case "catalog":
      case "shop": await catalogueMessage(message, args); break;
      case "ping": await pingMessage(message); break;
      case "serverinfo":
      case "serveur":
      case "server": await serverinfoMessage(message); break;
      case "userinfo":
      case "user":
      case "whois": await userinfoMessage(message, args); break;
      case "avatar":
      case "pp": await avatarMessage(message, args); break;
      case "say":
      case "dis":
      case "repete": await sayMessage(message, args); break;
      case "annonce":
      case "announce": await annonceMessage(message, args); break;
      case "sondage":
      case "poll": await sondageMessage(message, args); break;
      default: break;
    }
  } catch (err) {
    logger.error({ err }, `Erreur commande préfixe: !${command}`);
    try {
      await message.reply("❌ Une erreur est survenue lors de l'exécution de la commande.");
    } catch {}
  }
}
