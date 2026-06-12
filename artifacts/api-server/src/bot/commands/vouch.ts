import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import type { SlashCommand } from "../types.js";
import { vouches, guildConfigs } from "../store.js";
import { logger } from "../../lib/logger.js";
import { updateVoiceCounter } from "../utils/voiceCounter.js";

export const data = new SlashCommandBuilder()
  .setName("vouch")
  .setDescription("Système de vouches")
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("Laisser un vouch pour un acheteur")
      .addUserOption((o) =>
        o
          .setName("membre")
          .setDescription("Le membre à voucher")
          .setRequired(true)
      )
      .addStringOption((o) =>
        o
          .setName("commentaire")
          .setDescription("Ton avis sur la transaction")
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("voir")
      .setDescription("Voir les vouches d'un membre")
      .addUserOption((o) =>
        o
          .setName("membre")
          .setDescription("Membre (optionnel, toi par défaut)")
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("setup")
      .setDescription("Configurer le salon où les vouches sont affichés")
      .addChannelOption((o) =>
        o
          .setName("salon")
          .setDescription("Salon texte pour les vouches")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("compteur")
      .setDescription(
        "Créer/mettre à jour le salon vocal affichant le total des vouches"
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("supprimer")
      .setDescription("Supprimer le dernier vouch d'un membre (admin)")
      .addUserOption((o) =>
        o.setName("membre").setDescription("Membre").setRequired(true)
      )
  );

export const execute: SlashCommand["execute"] = async (
  interaction: ChatInputCommandInteraction
) => {
  if (!interaction.guild) return;
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guildId!;

  if (sub === "add") {
    const target = interaction.options.getUser("membre", true);
    const comment =
      interaction.options.getString("commentaire") ?? "Aucun commentaire";

    if (target.id === interaction.user.id) {
      await interaction.reply({
        content: "❌ Tu ne peux pas te voucher toi-même.",
        flags: 64,
      });
      return;
    }

    if (target.bot) {
      await interaction.reply({
        content: "❌ Tu ne peux pas voucher un bot.",
        flags: 64,
      });
      return;
    }

    const key = guildId;
    const list = vouches.get(key) ?? [];

    const alreadyVouched = list.find(
      (v) =>
        v.authorId === interaction.user.id &&
        v.targetId === target.id &&
        Date.now() - v.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
    );

    if (alreadyVouched) {
      await interaction.reply({
        content: `❌ Tu as déjà vouché <@${target.id}> cette semaine.`,
        flags: 64,
      });
      return;
    }

    const vouchData = {
      authorId: interaction.user.id,
      targetId: target.id,
      guildId,
      comment,
      timestamp: new Date(),
    };

    list.push(vouchData);
    vouches.set(key, list);

    const userVouches = list.filter((v) => v.targetId === target.id);
    const total = userVouches.length;

    const embed = new EmbedBuilder()
      .setTitle("✅ Nouveau Vouch")
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        {
          name: "👤 Voucheur",
          value: `<@${interaction.user.id}>`,
          inline: true,
        },
        { name: "🎯 Pour", value: `<@${target.id}>`, inline: true },
        { name: "⭐ Total vouches", value: `${total}`, inline: true },
        { name: "💬 Commentaire", value: comment }
      )
      .setColor(0x57f287)
      .setTimestamp()
      .setFooter({ text: `Vouch #${total}` });

    await interaction.reply({ embeds: [embed] });

    const config = guildConfigs.get(guildId);

    if (config?.vouchChannelId && config.vouchChannelId !== interaction.channelId) {
      try {
        const vouchChannel = await interaction.guild.channels.fetch(
          config.vouchChannelId
        );
        if (vouchChannel?.isTextBased()) {
          await vouchChannel.send({ embeds: [embed] });
        }
      } catch (err) {
        logger.warn({ err }, "Impossible de poster dans le salon de vouches");
      }
    }

    if (config?.vouchCounterChannelId) {
      await updateCounter(interaction.guild, guildId);
    }

    await updateVoiceCounter(interaction.guild, "vouch", list.length, "✅ Vouch");

    logger.info(
      `Vouch: ${interaction.user.tag} → ${target.tag} dans ${interaction.guild.name}`
    );
  }

  if (sub === "voir") {
    const target = interaction.options.getUser("membre") ?? interaction.user;
    const list = vouches.get(guildId) ?? [];
    const userVouches = list.filter((v) => v.targetId === target.id);

    if (userVouches.length === 0) {
      await interaction.reply({
        content: `📭 <@${target.id}> n'a aucun vouch.`,
        flags: 64,
      });
      return;
    }

    const recent = userVouches.slice(-10).reverse();

    const embed = new EmbedBuilder()
      .setTitle(`⭐ Vouches de ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .setColor(0x5865f2)
      .setDescription(
        recent
          .map(
            (v, i) =>
              `**${userVouches.length - i}.** <@${v.authorId}> — ${v.comment}\n*${v.timestamp.toLocaleDateString("fr-FR")}*`
          )
          .join("\n\n")
      )
      .addFields({
        name: "Total",
        value: `⭐ **${userVouches.length}** vouch${userVouches.length > 1 ? "s" : ""}`,
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  if (sub === "setup") {
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: "❌ Permission refusée.",
        flags: 64,
      });
      return;
    }

    const channel = interaction.options.getChannel("salon", true);
    const config = guildConfigs.get(guildId) ?? {};
    config.vouchChannelId = channel.id;
    guildConfigs.set(guildId, config);

    await interaction.reply({
      content: `✅ Salon de vouches configuré sur <#${channel.id}>. Les vouches y seront automatiquement postés.`,
      flags: 64,
    });
  }

  if (sub === "compteur") {
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)
    ) {
      await interaction.reply({
        content: "❌ Permission refusée.",
        flags: 64,
      });
      return;
    }

    const list = vouches.get(guildId) ?? [];
    const total = list.length;

    const config = guildConfigs.get(guildId) ?? {};

    if (config.vouchCounterChannelId) {
      await updateCounter(interaction.guild, guildId);
      await interaction.reply({
        content: `✅ Compteur mis à jour.`,
        flags: 64,
      });
      return;
    }

    try {
      const channel = await interaction.guild.channels.create({
        name: `⭐ Vouches: ${total}`,
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            allow: [PermissionFlagsBits.ViewChannel],
            deny: [PermissionFlagsBits.Connect],
          },
        ],
      });

      config.vouchCounterChannelId = channel.id;
      guildConfigs.set(guildId, config);

      await interaction.reply({
        content: `✅ Salon vocal compteur créé : **${channel.name}**\nIl sera visible par tous mais non rejoignable, et se mettra à jour automatiquement à chaque vouch.`,
        flags: 64,
      });

      logger.info(
        `Compteur vouch créé: ${channel.id} dans ${interaction.guild.name}`
      );
    } catch (err) {
      logger.error({ err }, "Erreur création salon vocal compteur");
      await interaction.reply({
        content: "❌ Impossible de créer le salon vocal.",
        flags: 64,
      });
    }
  }

  if (sub === "supprimer") {
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: "❌ Permission refusée.",
        flags: 64,
      });
      return;
    }

    const target = interaction.options.getUser("membre", true);
    const list = vouches.get(guildId) ?? [];
    const idx = [...list]
      .reverse()
      .findIndex((v) => v.targetId === target.id);

    if (idx === -1) {
      await interaction.reply({
        content: `❌ Aucun vouch trouvé pour <@${target.id}>.`,
        flags: 64,
      });
      return;
    }

    const realIdx = list.length - 1 - idx;
    list.splice(realIdx, 1);
    vouches.set(guildId, list);

    const config = guildConfigs.get(guildId);
    if (config?.vouchCounterChannelId) {
      await updateCounter(interaction.guild, guildId);
    }

    await interaction.reply({
      content: `✅ Dernier vouch de <@${target.id}> supprimé.`,
      flags: 64,
    });
  }
};

async function updateCounter(
  guild: import("discord.js").Guild,
  guildId: string
) {
  const config = guildConfigs.get(guildId);
  if (!config?.vouchCounterChannelId) return;

  const list = vouches.get(guildId) ?? [];
  const total = list.length;

  try {
    const channel = await guild.channels.fetch(config.vouchCounterChannelId);
    if (channel && channel.type === ChannelType.GuildVoice) {
      await channel.setName(`⭐ Vouches: ${total}`);
    }
  } catch (err) {
    logger.warn({ err }, "Impossible de mettre à jour le compteur vocal");
  }
}
