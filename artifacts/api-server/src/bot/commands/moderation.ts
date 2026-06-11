import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import type { SlashCommand } from "../types.js";
import { warnMap } from "../store.js";
import { logger } from "../../lib/logger.js";

export const data = new SlashCommandBuilder()
  .setName("mod")
  .setDescription("Commandes de modération")
  .addSubcommand((sub) =>
    sub
      .setName("mute")
      .setDescription("Mettre en sourdine un membre")
      .addUserOption((o) =>
        o.setName("membre").setDescription("Membre à muter").setRequired(true)
      )
      .addIntegerOption((o) =>
        o
          .setName("duree")
          .setDescription("Durée en minutes")
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(40320)
      )
      .addStringOption((o) =>
        o.setName("raison").setDescription("Raison").setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("unmute")
      .setDescription("Retirer la sourdine d'un membre")
      .addUserOption((o) =>
        o.setName("membre").setDescription("Membre à unmuter").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("kick")
      .setDescription("Expulser un membre")
      .addUserOption((o) =>
        o.setName("membre").setDescription("Membre à expulser").setRequired(true)
      )
      .addStringOption((o) =>
        o.setName("raison").setDescription("Raison").setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("ban")
      .setDescription("Bannir un membre")
      .addUserOption((o) =>
        o.setName("membre").setDescription("Membre à bannir").setRequired(true)
      )
      .addStringOption((o) =>
        o.setName("raison").setDescription("Raison").setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("warn")
      .setDescription("Avertir un membre")
      .addUserOption((o) =>
        o.setName("membre").setDescription("Membre à avertir").setRequired(true)
      )
      .addStringOption((o) =>
        o.setName("raison").setDescription("Raison").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("warns")
      .setDescription("Voir les avertissements d'un membre")
      .addUserOption((o) =>
        o.setName("membre").setDescription("Membre").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("clearwarn")
      .setDescription("Effacer les avertissements d'un membre")
      .addUserOption((o) =>
        o.setName("membre").setDescription("Membre").setRequired(true)
      )
  );

export const execute: SlashCommand["execute"] = async (
  interaction: ChatInputCommandInteraction
) => {
  if (!interaction.guild) return;

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
    await interaction.reply({
      content: "❌ Tu n'as pas la permission de modérer.",
      ephemeral: true,
    });
    return;
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "mute") {
    const user = interaction.options.getUser("membre", true);
    const duree = interaction.options.getInteger("duree", true);
    const raison = interaction.options.getString("raison") ?? "Aucune raison";
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) {
      await interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });
      return;
    }

    if (!member.moderatable) {
      await interaction.reply({ content: "❌ Je ne peux pas muter ce membre.", ephemeral: true });
      return;
    }

    await member.timeout(duree * 60 * 1000, raison);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔇 Membre muté")
          .addFields(
            { name: "Membre", value: `<@${user.id}>`, inline: true },
            { name: "Durée", value: `${duree} min`, inline: true },
            { name: "Raison", value: raison }
          )
          .setColor(0xed4245)
          .setTimestamp(),
      ],
    });
    logger.info(`Mute: ${user.tag} ${duree}min par ${interaction.user.tag}`);
  }

  if (sub === "unmute") {
    const user = interaction.options.getUser("membre", true);
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) {
      await interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });
      return;
    }

    await member.timeout(null);
    await interaction.reply({
      content: `✅ <@${user.id}> n'est plus en sourdine.`,
    });
  }

  if (sub === "kick") {
    const user = interaction.options.getUser("membre", true);
    const raison = interaction.options.getString("raison") ?? "Aucune raison";
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) {
      await interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });
      return;
    }

    if (!member.kickable) {
      await interaction.reply({ content: "❌ Je ne peux pas kick ce membre.", ephemeral: true });
      return;
    }

    await member.kick(raison);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("👢 Membre expulsé")
          .addFields(
            { name: "Membre", value: `${user.tag}`, inline: true },
            { name: "Raison", value: raison }
          )
          .setColor(0xffa500)
          .setTimestamp(),
      ],
    });
  }

  if (sub === "ban") {
    const user = interaction.options.getUser("membre", true);
    const raison = interaction.options.getString("raison") ?? "Aucune raison";
    const member = interaction.guild.members.cache.get(user.id);

    if (!member?.bannable) {
      await interaction.reply({ content: "❌ Je ne peux pas bannir ce membre.", ephemeral: true });
      return;
    }

    await member.ban({ reason: raison });
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔨 Membre banni")
          .addFields(
            { name: "Membre", value: `${user.tag}`, inline: true },
            { name: "Raison", value: raison }
          )
          .setColor(0xed4245)
          .setTimestamp(),
      ],
    });
  }

  if (sub === "warn") {
    const user = interaction.options.getUser("membre", true);
    const raison = interaction.options.getString("raison", true);
    const key = `${user.id}_${interaction.guildId}`;
    const warns = warnMap.get(key) ?? [];
    warns.push(`[${new Date().toLocaleDateString("fr-FR")}] ${raison}`);
    warnMap.set(key, warns);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚠️ Avertissement")
          .addFields(
            { name: "Membre", value: `<@${user.id}>`, inline: true },
            { name: "Total warns", value: `${warns.length}`, inline: true },
            { name: "Raison", value: raison }
          )
          .setColor(0xfee75c)
          .setTimestamp(),
      ],
    });

    try {
      const dmUser = await interaction.client.users.fetch(user.id);
      await dmUser.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("⚠️ Tu as reçu un avertissement")
            .addFields(
              { name: "Serveur", value: interaction.guild.name, inline: true },
              { name: "Raison", value: raison },
              { name: "Total", value: `${warns.length} avertissement(s)` }
            )
            .setColor(0xfee75c)
            .setTimestamp(),
        ],
      });
    } catch {}
  }

  if (sub === "warns") {
    const user = interaction.options.getUser("membre", true);
    const key = `${user.id}_${interaction.guildId}`;
    const warns = warnMap.get(key) ?? [];

    const embed = new EmbedBuilder()
      .setTitle(`⚠️ Avertissements de ${user.tag}`)
      .setColor(0xfee75c)
      .setDescription(
        warns.length > 0 ? warns.map((w, i) => `**${i + 1}.** ${w}`).join("\n") : "Aucun avertissement."
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (sub === "clearwarn") {
    const user = interaction.options.getUser("membre", true);
    const key = `${user.id}_${interaction.guildId}`;
    warnMap.delete(key);
    await interaction.reply({
      content: `✅ Avertissements de <@${user.id}> effacés.`,
      ephemeral: true,
    });
  }
};
