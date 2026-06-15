import {
  type Message,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  TextChannel,
} from "discord.js";
import { guildConfigs } from "../../store.js";
import { logger } from "../../../lib/logger.js";

interface ScheduledPub {
  guildId: string;
  channelId: string;
  text: string;
  authorId: string;
  authorUsername: string;
  timeoutId: NodeJS.Timeout;
  scheduledFor: Date;
}

const scheduled = new Map<string, ScheduledPub>();

export async function pubMessage(message: Message, args: string[]) {
  if (!message.guild) return;

  const isMod = message.member?.permissions.has(PermissionFlagsBits.ManageMessages);
  if (!isMod) {
    await message.reply("🚫 Réservé aux modérateurs.");
    return;
  }

  const sub = (args[0] ?? "help").toLowerCase();

  if (sub === "setup" || sub === "salon") {
    const channel = message.mentions.channels.first();
    if (!channel || channel.type !== ChannelType.GuildText) {
      await message.reply("❌ Syntaxe : `!pub setup #salon`");
      return;
    }
    const config = guildConfigs.get(message.guild.id) ?? {};
    config.pubChannelId = channel.id;
    guildConfigs.set(message.guild.id, config);
    await message.reply(`✅ Salon de pub configuré sur ${channel}.`);
    return;
  }

  if (sub === "now" || sub === "send" || sub === "envoyer") {
    const text = args.slice(1).join(" ").trim();
    if (!text) {
      await message.reply("❌ Syntaxe : `!pub now <ton message>`");
      return;
    }
    await sendPub(message.guild, text, message.author.id, message.author.username);
    try { await message.delete(); } catch {}
    return;
  }

  if (sub === "schedule" || sub === "programmer") {
    const minutes = parseInt(args[1] ?? "", 10);
    const text = args.slice(2).join(" ").trim();
    if (!minutes || minutes < 1 || !text) {
      await message.reply(
        "❌ Syntaxe : `!pub schedule <minutes> <message>`\n" +
        "Exemple : `!pub schedule 30 Promo Nitro -50% !`",
      );
      return;
    }
    if (minutes > 7 * 24 * 60) {
      await message.reply("❌ Maximum 7 jours (10080 minutes).");
      return;
    }

    const existing = scheduled.get(message.guild.id);
    if (existing) clearTimeout(existing.timeoutId);

    const ms = minutes * 60 * 1000;
    const scheduledFor = new Date(Date.now() + ms);
    const guildId = message.guild.id;
    const guild = message.guild;
    const authorId = message.author.id;
    const authorUsername = message.author.username;

    const timeoutId = setTimeout(async () => {
      scheduled.delete(guildId);
      try {
        await sendPub(guild, text, authorId, authorUsername);
      } catch (err) {
        logger.error({ err }, "Erreur envoi pub programmée");
      }
    }, ms);

    scheduled.set(guildId, {
      guildId,
      channelId: message.channel.id,
      text,
      authorId,
      authorUsername,
      timeoutId,
      scheduledFor,
    });

    await message.reply(
      `✅ Pub programmée pour <t:${Math.floor(scheduledFor.getTime() / 1000)}:F> ` +
      `(<t:${Math.floor(scheduledFor.getTime() / 1000)}:R>).`,
    );
    return;
  }

  if (sub === "cancel" || sub === "annuler") {
    const existing = scheduled.get(message.guild.id);
    if (!existing) {
      await message.reply("❌ Aucune pub programmée.");
      return;
    }
    clearTimeout(existing.timeoutId);
    scheduled.delete(message.guild.id);
    await message.reply("✅ Pub programmée annulée.");
    return;
  }

  if (sub === "status" || sub === "list") {
    const existing = scheduled.get(message.guild.id);
    if (!existing) {
      await message.reply("📭 Aucune pub programmée.");
      return;
    }
    await message.reply(
      `📅 Pub programmée pour <t:${Math.floor(existing.scheduledFor.getTime() / 1000)}:R>\n` +
      `📝 *${existing.text.slice(0, 200)}*`,
    );
    return;
  }

  await message.reply(
    "**Commandes pub :**\n" +
    "`!pub setup #salon` — Définir le salon de pub\n" +
    "`!pub now <message>` — Envoyer une pub immédiate (avec lien d'invite auto)\n" +
    "`!pub schedule <minutes> <message>` — Programmer une pub\n" +
    "`!pub status` — Voir la pub programmée\n" +
    "`!pub cancel` — Annuler la pub programmée",
  );
}

async function sendPub(
  guild: import("discord.js").Guild,
  text: string,
  authorId: string,
  authorUsername: string,
) {
  const config = guildConfigs.get(guild.id);
  if (!config?.pubChannelId) {
    logger.warn(`Pas de salon pub configuré pour ${guild.id}`);
    return;
  }

  const channel = await guild.channels.fetch(config.pubChannelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) {
    logger.warn(`Salon pub introuvable pour ${guild.id}`);
    return;
  }

  let inviteUrl: string | null = null;
  try {
    const invite = await (channel as TextChannel).createInvite({
      maxAge: 0,
      maxUses: 0,
      unique: false,
      reason: `Pub par ${authorUsername}`,
    });
    inviteUrl = invite.url;
  } catch (err) {
    logger.warn({ err }, "Impossible de créer l'invite pour la pub");
  }

  const embed = new EmbedBuilder()
    .setTitle(`📢 ${guild.name}`)
    .setDescription(text)
    .setColor(0x5865f2)
    .setThumbnail(guild.iconURL({ size: 256 }))
    .setFooter({ text: `Annonce par ${authorUsername}` })
    .setTimestamp();

  if (inviteUrl) {
    embed.addFields({ name: "🔗 Rejoindre", value: inviteUrl });
  }

  await channel.send({
    content: `@everyone`,
    embeds: [embed],
    allowedMentions: { parse: ["everyone"] },
  });
  logger.info(`Pub envoyée dans ${channel.name} par ${authorUsername}`);
}
