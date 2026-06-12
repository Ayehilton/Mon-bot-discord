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
import { giveaways } from "../store.js";
import { endGiveaway } from "../handlers/giveawayHandler.js";
import { logger } from "../../lib/logger.js";

export const data = new SlashCommandBuilder()
  .setName("giveaway")
  .setDescription("Gestion des giveaways")
  .addSubcommand((sub) =>
    sub
      .setName("start")
      .setDescription("Lancer un giveaway")
      .addStringOption((o) =>
        o.setName("prize").setDescription("Le prix à gagner").setRequired(true)
      )
      .addIntegerOption((o) =>
        o
          .setName("duree")
          .setDescription("Durée en minutes")
          .setRequired(true)
          .setMinValue(1)
      )
      .addIntegerOption((o) =>
        o
          .setName("gagnants")
          .setDescription("Nombre de gagnants")
          .setRequired(false)
          .setMinValue(1)
          .setMaxValue(10)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("end")
      .setDescription("Terminer un giveaway maintenant")
      .addStringOption((o) =>
        o
          .setName("message_id")
          .setDescription("ID du message du giveaway")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("reroll")
      .setDescription("Retirer un nouveau gagnant")
      .addStringOption((o) =>
        o
          .setName("message_id")
          .setDescription("ID du message du giveaway")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("Voir les giveaways actifs")
  );

export const execute: SlashCommand["execute"] = async (
  interaction: ChatInputCommandInteraction
) => {
  const sub = interaction.options.getSubcommand();

  if (!interaction.guild || !interaction.channel?.isTextBased()) return;

  if (sub === "start") {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: "❌ Tu n'as pas la permission.",
        flags: 64,
      });
      return;
    }

    const prize = interaction.options.getString("prize", true);
    const dureeMin = interaction.options.getInteger("duree", true);
    const winnersCount = interaction.options.getInteger("gagnants") ?? 1;
    const endTime = new Date(Date.now() + dureeMin * 60 * 1000);

    const embed = new EmbedBuilder()
      .setTitle("🎉 GIVEAWAY!")
      .setDescription(`**Prix:** ${prize}\n\nClique sur le bouton pour participer !`)
      .addFields(
        { name: "Gagnants", value: `${winnersCount}`, inline: true },
        {
          name: "Fin",
          value: `<t:${Math.floor(endTime.getTime() / 1000)}:R>`,
          inline: true,
        },
        { name: "Organisateur", value: `<@${interaction.user.id}>`, inline: true }
      )
      .setColor(0xfee75c)
      .setFooter({ text: "Clique pour participer / re-cliquer pour se retirer" })
      .setTimestamp(endTime);

    await interaction.reply({ content: "🎉 Giveaway créé !", flags: 64 });

    const msg = await interaction.channel.send({ embeds: [embed] });

    const giveawayData = {
      messageId: msg.id,
      channelId: interaction.channelId,
      guildId: interaction.guildId!,
      prize,
      winnersCount,
      endTime,
      hostId: interaction.user.id,
      ended: false,
      participants: [] as string[],
    };

    giveaways.set(msg.id, giveawayData);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_join_${msg.id}`)
        .setLabel("Participer 🎉")
        .setStyle(ButtonStyle.Success)
    );

    await msg.edit({ components: [row] });

    setTimeout(() => {
      endGiveaway(msg.id, interaction.client).catch((err) =>
        logger.error({ err }, "Erreur fin giveaway auto")
      );
    }, dureeMin * 60 * 1000);
  }

  if (sub === "end") {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: "❌ Tu n'as pas la permission.",
        flags: 64,
      });
      return;
    }

    const msgId = interaction.options.getString("message_id", true);
    const g = giveaways.get(msgId);
    if (!g) {
      await interaction.reply({ content: "❌ Giveaway introuvable.", flags: 64 });
      return;
    }

    await endGiveaway(msgId, interaction.client);
    await interaction.reply({ content: "✅ Giveaway terminé !", flags: 64 });
  }

  if (sub === "reroll") {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: "❌ Tu n'as pas la permission.",
        flags: 64,
      });
      return;
    }

    const msgId = interaction.options.getString("message_id", true);
    const g = giveaways.get(msgId);
    if (!g || g.participants.length === 0) {
      await interaction.reply({
        content: "❌ Impossible de reroll (introuvable ou aucun participant).",
        flags: 64,
      });
      return;
    }

    const winner = g.participants[Math.floor(Math.random() * g.participants.length)];
    await interaction.reply({
      content: `🎊 Nouveau gagnant: <@${winner}> pour **${g.prize}** !`,
    });
  }

  if (sub === "list") {
    const active = [...giveaways.values()].filter(
      (g) => !g.ended && g.guildId === interaction.guildId
    );

    if (active.length === 0) {
      await interaction.reply({
        content: "📭 Aucun giveaway actif.",
        flags: 64,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🎉 Giveaways actifs")
      .setColor(0xfee75c)
      .setDescription(
        active
          .map(
            (g) =>
              `**${g.prize}** — <#${g.channelId}> — Fin: <t:${Math.floor(g.endTime.getTime() / 1000)}:R> — ${g.participants.length} participants`
          )
          .join("\n")
      );

    await interaction.reply({ embeds: [embed], flags: 64 });
  }
};
