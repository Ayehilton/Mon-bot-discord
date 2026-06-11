import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from "discord.js";
import type { SlashCommand } from "../types.js";

export const data = new SlashCommandBuilder()
  .setName("ticket")
  .setDescription("Gestion des tickets de support")
  .addSubcommand((sub) =>
    sub.setName("setup").setDescription("Créer le panneau d'ouverture de tickets")
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("Voir les tickets ouverts")
  );

export const execute: SlashCommand["execute"] = async (
  interaction: ChatInputCommandInteraction
) => {
  const sub = interaction.options.getSubcommand();

  if (sub === "setup") {
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)
    ) {
      await interaction.reply({
        content: "❌ Tu n'as pas la permission.",
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🎫 Support")
      .setDescription(
        "Clique sur le bouton ci-dessous pour ouvrir un ticket de support.\n\nUn membre du staff te répondra dans les plus brefs délais."
      )
      .setColor(0x5865f2)
      .setFooter({ text: "Un ticket par utilisateur" });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_open")
        .setLabel("Ouvrir un ticket")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🎫")
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  }

  if (sub === "list") {
    const { tickets } = await import("../store.js");
    const guildTickets = [...tickets.entries()].filter(([key]) =>
      key.endsWith("_" + interaction.guildId)
    );

    if (guildTickets.length === 0) {
      await interaction.reply({
        content: "📭 Aucun ticket ouvert.",
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("📋 Tickets ouverts")
      .setColor(0x5865f2)
      .setDescription(
        guildTickets
          .map(([, t]) => `<#${t.channelId}> — <@${t.userId}>`)
          .join("\n")
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
