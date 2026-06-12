import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  PermissionFlagsBits,
} from "discord.js";
import type { SlashCommand } from "../types.js";
import { getRatings } from "../handlers/ratingHandler.js";

export const data = new SlashCommandBuilder()
  .setName("evaluation")
  .setDescription("Gestion des évaluations")
  .addSubcommand((sub) =>
    sub.setName("panel").setDescription("Envoyer un panneau d'évaluation")
  )
  .addSubcommand((sub) =>
    sub.setName("resultats").setDescription("Voir les résultats des évaluations")
  );

export const execute: SlashCommand["execute"] = async (
  interaction: ChatInputCommandInteraction
) => {
  const sub = interaction.options.getSubcommand();

  if (sub === "panel") {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({ content: "❌ Permission refusée.", flags: 64 });
      return;
    }

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`rating_panel_${interaction.user.id}`)
        .setPlaceholder("Évalue notre serveur / support (1-5 étoiles)")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("⭐ 1 étoile — Très mauvais")
            .setValue("1"),
          new StringSelectMenuOptionBuilder()
            .setLabel("⭐⭐ 2 étoiles — Mauvais")
            .setValue("2"),
          new StringSelectMenuOptionBuilder()
            .setLabel("⭐⭐⭐ 3 étoiles — Moyen")
            .setValue("3"),
          new StringSelectMenuOptionBuilder()
            .setLabel("⭐⭐⭐⭐ 4 étoiles — Bien")
            .setValue("4"),
          new StringSelectMenuOptionBuilder()
            .setLabel("⭐⭐⭐⭐⭐ 5 étoiles — Excellent!")
            .setValue("5")
        )
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("📊 Évalue notre serveur")
          .setDescription("Ta satisfaction est importante pour nous. Sélectionne une note ci-dessous.")
          .setColor(0xfee75c),
      ],
      components: [row],
    });
  }

  if (sub === "resultats") {
    const ratings = getRatings();

    if (ratings.length === 0) {
      await interaction.reply({ content: "📭 Aucune évaluation reçue.", flags: 64 });
      return;
    }

    const avg = (ratings.reduce((a, b) => a + b.rating, 0) / ratings.length).toFixed(2);
    const dist = [1, 2, 3, 4, 5].map((n) => ({
      n,
      count: ratings.filter((r) => r.rating === n).length,
      pct: Math.round((ratings.filter((r) => r.rating === n).length / ratings.length) * 100),
    }));

    const bar = (pct: number) => {
      const filled = Math.round(pct / 10);
      return "█".repeat(filled) + "░".repeat(10 - filled);
    };

    const embed = new EmbedBuilder()
      .setTitle("📊 Résultats des évaluations")
      .addFields(
        { name: "Nombre total", value: `${ratings.length}`, inline: true },
        { name: "Note moyenne", value: `⭐ ${avg}/5`, inline: true },
        {
          name: "Distribution",
          value: dist
            .map((d) => `${d.n}⭐ ${bar(d.pct)} ${d.count} (${d.pct}%)`)
            .join("\n"),
        }
      )
      .setColor(0xfee75c)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
