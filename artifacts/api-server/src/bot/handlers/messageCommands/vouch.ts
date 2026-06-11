import {
  type Message,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { vouches, guildConfigs } from "../../store.js";
import { logger } from "../../../lib/logger.js";
import { updateVoiceCounter } from "../../utils/voiceCounter.js";

export async function vouchMessage(message: Message, args: string[]) {
  if (!message.guild) return;
  const sub = args[0]?.toLowerCase();
  const guildId = message.guild.id;

  if (sub === "add" || !sub) {
    const target = message.mentions.users.first();
    if (!target) {
      await message.reply("❌ Usage: `!vouch add @membre [commentaire]`");
      return;
    }
    if (target.id === message.author.id) {
      await message.reply("❌ Tu ne peux pas te voucher toi-même.");
      return;
    }
    if (target.bot) {
      await message.reply("❌ Tu ne peux pas voucher un bot.");
      return;
    }

    const comment = args.slice(2).join(" ") || "Aucun commentaire";
    const list = vouches.get(guildId) ?? [];

    const alreadyVouched = list.find(
      (v) =>
        v.authorId === message.author.id &&
        v.targetId === target.id &&
        Date.now() - v.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
    );

    if (alreadyVouched) {
      await message.reply(`❌ Tu as déjà vouché <@${target.id}> cette semaine.`);
      return;
    }

    list.push({
      authorId: message.author.id,
      targetId: target.id,
      guildId,
      comment,
      timestamp: new Date(),
    });
    vouches.set(guildId, list);

    const userVouches = list.filter((v) => v.targetId === target.id);
    const total = userVouches.length;

    const embed = new EmbedBuilder()
      .setTitle("✅ Nouveau Vouch")
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "👤 Voucheur", value: `<@${message.author.id}>`, inline: true },
        { name: "🎯 Pour", value: `<@${target.id}>`, inline: true },
        { name: "⭐ Total vouches", value: `${total}`, inline: true },
        { name: "💬 Commentaire", value: comment }
      )
      .setColor(0x57f287)
      .setTimestamp()
      .setFooter({ text: `Vouch #${total}` });

    await message.reply({ embeds: [embed] });

    const config = guildConfigs.get(guildId);
    if (config?.vouchChannelId && config.vouchChannelId !== message.channelId) {
      try {
        const vouchChannel = await message.guild.channels.fetch(config.vouchChannelId);
        if (vouchChannel?.isTextBased()) await vouchChannel.send({ embeds: [embed] });
      } catch {}
    }

    await updateVoiceCounter(message.guild, "vouch", list.length, "✅ Vouch");
    logger.info(`Vouch: ${message.author.tag} → ${target.tag} dans ${message.guild.name}`);
  } else if (sub === "voir") {
    const target = message.mentions.users.first() ?? message.author;
    const list = vouches.get(guildId) ?? [];
    const userVouches = list.filter((v) => v.targetId === target.id);

    if (userVouches.length === 0) {
      await message.reply(`📭 <@${target.id}> n'a aucun vouch.`);
      return;
    }

    const recent = userVouches.slice(-10).reverse();
    await message.reply({
      embeds: [
        new EmbedBuilder()
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
          .addFields({ name: "Total", value: `⭐ **${userVouches.length}** vouch${userVouches.length > 1 ? "s" : ""}` }),
      ],
    });
  } else if (sub === "setup") {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.reply("❌ Permission refusée.");
      return;
    }
    const channel = message.mentions.channels.first();
    if (!channel) {
      await message.reply("❌ Usage: `!vouch setup #salon`");
      return;
    }
    const config = guildConfigs.get(guildId) ?? {};
    config.vouchChannelId = channel.id;
    guildConfigs.set(guildId, config);
    await message.reply(`✅ Salon de vouches configuré sur <#${channel.id}>.`);
  } else if (sub === "compteur") {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await message.reply("❌ Permission refusée.");
      return;
    }
    const list = vouches.get(guildId) ?? [];
    const config = guildConfigs.get(guildId) ?? {};

    if (config.vouchCounterChannelId) {
      await updateVoiceCounter(message.guild, "vouch", list.length, "✅ Vouch");
      await message.reply("✅ Compteur mis à jour.");
      return;
    }

    const channel = await message.guild.channels.create({
      name: `✅ Vouch : ${list.length}`,
      type: ChannelType.GuildVoice,
      permissionOverwrites: [
        {
          id: message.guild.id,
          allow: [PermissionFlagsBits.ViewChannel],
          deny: [PermissionFlagsBits.Connect],
        },
      ],
    });
    config.vouchCounterChannelId = channel.id;
    guildConfigs.set(guildId, config);
    await message.reply(`✅ Salon vocal compteur créé : **${channel.name}**`);
  } else if (sub === "supprimer") {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.reply("❌ Permission refusée.");
      return;
    }
    const target = message.mentions.users.first();
    if (!target) {
      await message.reply("❌ Usage: `!vouch supprimer @membre`");
      return;
    }
    const list = vouches.get(guildId) ?? [];
    const idx = [...list].reverse().findIndex((v) => v.targetId === target.id);
    if (idx === -1) {
      await message.reply(`❌ Aucun vouch pour <@${target.id}>.`);
      return;
    }
    list.splice(list.length - 1 - idx, 1);
    vouches.set(guildId, list);
    await updateVoiceCounter(message.guild, "vouch", list.length, "✅ Vouch");
    await message.reply(`✅ Dernier vouch de <@${target.id}> supprimé.`);
  } else {
    await message.reply(
      "**Commandes vouch :**\n" +
      "`!vouch add @membre [commentaire]`\n" +
      "`!vouch voir [@membre]`\n" +
      "`!vouch setup #salon`\n" +
      "`!vouch compteur`\n" +
      "`!vouch supprimer @membre`"
    );
  }
}
