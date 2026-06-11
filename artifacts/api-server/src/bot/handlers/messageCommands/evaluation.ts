import {
  type Message,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { getRatings } from "../ratingHandler.js";

export async function evaluationMessage(message: Message, args: string[]) {
  const sub = args[0]?.toLowerCase();

  if (sub === "panel") {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.reply("❌ Permission refusée.");
      return;
    }

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`rating_panel_${message.author.id}`)
        .setPlaceholder("Évalue notre serveur / support (1-5 étoiles)")
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel("⭐ 1 étoile — Très mauvais").setValue("1"),
          new StringSelectMenuOptionBuilder().setLabel("⭐⭐ 2 étoiles — Mauvais").setValue("2"),
          new StringSelectMenuOptionBuilder().setLabel("⭐⭐⭐ 3 étoiles — Moyen").setValue("3"),
          new StringSelectMenuOptionBuilder().setLabel("⭐⭐⭐⭐ 4 étoiles — Bien").setValue("4"),
          new StringSelectMenuOptionBuilder().setLabel("⭐⭐⭐⭐⭐ 5 étoiles — Excellent!").setValue("5")
        )
    );

    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("📊 Évalue notre serveur")
          .setDescription("Ta satisfaction est importante pour nous. Sélectionne une note ci-dessous.")
          .setColor(0xfee75c),
      ],
      components: [row],
    });
    await message.react("✅");
  } else if (sub === "resultats") {
    const ratings = getRatings();
    if (ratings.length === 0) {
      await message.reply("📭 Aucune évaluation reçue.");
      return;
    }

    const avg = (ratings.reduce((a, b) => a + b.rating, 0) / ratings.length).toFixed(2);
    const dist = [1, 2, 3, 4, 5].map((n) => ({
      n,
      count: ratings.filter((r) => r.rating === n).length,
      pct: Math.round((ratings.filter((r) => r.rating === n).length / ratings.length) * 100),
    }));

    const bar = (pct: number) => "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("📊 Résultats des évaluations")
          .addFields(
            { name: "Nombre total", value: `${ratings.length}`, inline: true },
            { name: "Note moyenne", value: `⭐ ${avg}/5`, inline: true },
            {
              name: "Distribution",
              value: dist.map((d) => `${d.n}⭐ ${bar(d.pct)} ${d.count} (${d.pct}%)`).join("\n"),
            }
          )
          .setColor(0xfee75c)
          .setTimestamp(),
      ],
    });
  } else {
    await message.reply(
      "**Commandes évaluation :**\n`!evaluation panel` `!evaluation resultats`"
    );
  }
}
