import {
  type Interaction,
  ButtonInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import type { ExtendedClient } from "../types.js";
import { logger } from "../../lib/logger.js";
import { handleTicketButton, handleTicketCategorySelect } from "../handlers/ticketHandler.js";
import { handleRatingSelect } from "../handlers/ratingHandler.js";
import { handleGiveawayJoin } from "../handlers/giveawayHandler.js";
// ✅ NOUVEAU
import { handleRestockButton } from "../handlers/messageCommands/restockNotif.js";

export async function onInteractionCreate(interaction: Interaction) {
  if (interaction.isChatInputCommand()) {
    const client = interaction.client as ExtendedClient;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (err) {
      logger.error({ err }, `Erreur commande ${interaction.commandName}`);
      const msg = { content: "Une erreur est survenue.", flags: 64 };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
    return;
  }

  if (interaction instanceof ButtonInteraction) {
    // ✅ NOUVEAU - Bouton restock
    if (interaction.customId === "toggle_restock_role") {
      await handleRestockButton(interaction);
      return;
    }
    if (
      interaction.customId.startsWith("ticket_close_") ||
      interaction.customId.startsWith("ticket_open") ||
      interaction.customId.startsWith("ticket_claim_")
    ) {
      await handleTicketButton(interaction);
    }
    if (interaction.customId.startsWith("giveaway_join_")) {
      await handleGiveawayJoin(interaction);
    }
    return;
  }

  if (interaction instanceof StringSelectMenuInteraction) {
    if (interaction.customId.startsWith("ticket_category_")) {
      await handleTicketCategorySelect(interaction);
      return;
    }
    if (interaction.customId.startsWith("rating_")) {
      await handleRatingSelect(interaction);
    }
  }
}