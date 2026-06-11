import { StringSelectMenuInteraction, EmbedBuilder } from "discord.js";
import { logger } from "../../lib/logger.js";

const ratings: { userId: string; rating: number; timestamp: Date }[] = [];

export function getRatings() {
  return ratings;
}

export async function handleRatingSelect(interaction: StringSelectMenuInteraction) {
  const rating = parseInt(interaction.values[0] ?? "0");
  const stars = "⭐".repeat(rating);

  ratings.push({ userId: interaction.user.id, rating, timestamp: new Date() });

  const avg = ratings.reduce((a, b) => a + b.rating, 0) / ratings.length;

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("Merci pour ton évaluation !")
        .setDescription(`Tu as donné **${stars}** (${rating}/5)`)
        .addFields({ name: "Moyenne globale", value: `${avg.toFixed(1)}/5 (${ratings.length} avis)` })
        .setColor(0x57f287)
        .setTimestamp(),
    ],
    ephemeral: true,
  });

  logger.info(`Évaluation reçue: ${rating}/5 de ${interaction.user.tag}`);
}
