import { ButtonInteraction, EmbedBuilder } from "discord.js";
import { giveaways } from "../store.js";
import { logger } from "../../lib/logger.js";

export async function handleGiveawayJoin(interaction: ButtonInteraction) {
  const giveawayId = interaction.customId.replace("giveaway_join_", "");
  const giveaway = giveaways.get(giveawayId);

  if (!giveaway) {
    await interaction.reply({ content: "❌ Ce giveaway n'existe plus.", flags: 64 });
    return;
  }

  if (giveaway.ended) {
    await interaction.reply({ content: "❌ Ce giveaway est déjà terminé.", flags: 64 });
    return;
  }

  if (new Date() > giveaway.endTime) {
    await interaction.reply({ content: "❌ Ce giveaway est expiré.", flags: 64 });
    return;
  }

  if (giveaway.participants.includes(interaction.user.id)) {
    giveaway.participants = giveaway.participants.filter((id) => id !== interaction.user.id);
    await interaction.reply({
      content: "✅ Tu t'es retiré du giveaway.",
      flags: 64,
    });
  } else {
    giveaway.participants.push(interaction.user.id);
    await interaction.reply({
      content: `🎉 Tu participes au giveaway ! (${giveaway.participants.length} participants)`,
      flags: 64,
    });
  }

  logger.info(`Giveaway ${giveawayId}: ${giveaway.participants.length} participants`);
}

export async function endGiveaway(messageId: string, client: import("discord.js").Client) {
  const giveaway = giveaways.get(messageId);
  if (!giveaway || giveaway.ended) return;

  giveaway.ended = true;

  const winners: string[] = [];
  const pool = [...giveaway.participants];

  for (let i = 0; i < Math.min(giveaway.winnersCount, pool.length); i++) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]!);
  }

  try {
    const channel = await client.channels.fetch(giveaway.channelId);
    if (!channel?.isTextBased()) return;

    const msg = await channel.messages.fetch(messageId);

    const embed = new EmbedBuilder()
      .setTitle("🎉 GIVEAWAY TERMINÉ!")
      .setDescription(`**Prix:** ${giveaway.prize}`)
      .addFields(
        {
          name: "Gagnant(s)",
          value: winners.length > 0 ? winners.map((w) => `<@${w}>`).join(", ") : "Aucun participant",
        },
        { name: "Participants", value: `${giveaway.participants.length}` }
      )
      .setColor(0xfee75c)
      .setTimestamp();

    await msg.edit({ embeds: [embed], components: [] });

    if (winners.length > 0) {
      await channel.send({
        content: `🎊 Félicitations ${winners.map((w) => `<@${w}>`).join(", ")} ! Vous avez gagné **${giveaway.prize}** !`,
      });
    } else {
      await channel.send({ content: "😢 Personne n'a participé au giveaway." });
    }
  } catch (err) {
    logger.error({ err }, "Erreur fin giveaway");
  }
}
