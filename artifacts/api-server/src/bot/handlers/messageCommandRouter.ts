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
import { inviteMessage } from "./messageCommands/invite.js";
import { welcomeMessage } from "./messageCommands/welcome.js";
import { pubMessage } from "./messageCommands/pub.js";
import { restockNotifMessage } from "./messageCommands/restockNotif.js";
import { restockMessage } from "./messageCommands/restock.js";
import { slowmodeMessage } from "./messageCommands/slowmode.js";
import { lockMessage, unlockMessage } from "./messageCommands/lock.js";
import { faqMessage } from "./messageCommands/faq.js";
import { contactMessage } from "./messageCommands/contact.js";
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
      case "payment": await paiementMessage(message); break;
      case "clear":
      case "purge": await clearMessage(message, args); break;
      case "rules":
      case "regles": await rulesMessage(message); break;
      case "catalogue":
      case "shop": await catalogueMessage(message, args); break;
      case "ping": await pingMessage(message); break;
      case "serverinfo": await serverinfoMessage(message); break;
      case "userinfo":
      case "whois": await userinfoMessage(message, args); break;
      case "avatar":
      case "pp": await avatarMessage(message, args); break;
      case "say": await sayMessage(message, args); break;
      case "annonce": await annonceMessage(message, args); break;
      case "sondage":
      case "poll": await sondageMessage(message, args); break;
      case "invite": await inviteMessage(message, args); break;
      case "welcome": await welcomeMessage(message, args); break;
      case "pub": await pubMessage(message, args); break;
      case "restock-notif": await restockNotifMessage(message); break;
      case "restock": await restockMessage(message, args); break;
      case "slowmode": await slowmodeMessage(message, args); break;
      case "lock": await lockMessage(message); break;
      case "unlock": await unlockMessage(message); break;
      case "faq": await faqMessage(message); break;
      case "contact": await contactMessage(message); break;
      default: break;
    }
  } catch (err) {
    logger.error({ err }, `Erreur commande: !${command}`);
    try {
      await message.reply("❌ Une erreur est survenue.");
    } catch {}
  }
}