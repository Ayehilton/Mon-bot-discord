import { type Message, PermissionFlagsBits } from "discord.js";
import {
  spamMap,
  SPAM_THRESHOLD,
  SPAM_WINDOW_MS,
  MUTE_DURATION_MS,
  guildConfigs,
  vouches,
  channelVouchCount,
} from "../store.js";
import { logger } from "../../lib/logger.js";
import { handleMessageCommand } from "../handlers/messageCommandRouter.js";
import { updateVoiceCounter } from "../utils/voiceCounter.js";

export async function onMessageCreate(message: Message) {
  if (message.author.bot || !message.guild) return;

  await handleMessageCommand(message);

  // Auto-increment voice counter when a non-command message lands in the vouch channel.
  const guildId = message.guild.id;
  const config = guildConfigs.get(guildId);
  if (
    config?.vouchChannelId === message.channel.id &&
    !message.content.startsWith("!")
  ) {
    const current = (channelVouchCount.get(guildId) ?? 0) + 1;
    channelVouchCount.set(guildId, current);
    const formal = vouches.get(guildId)?.length ?? 0;
    try {
      await updateVoiceCounter(message.guild, "vouch", formal + current, "✅ Vouch");
    } catch (err) {
      logger.warn({ err }, "Erreur maj compteur vouch via message");
    }
  }

  const userId = message.author.id;
  const now = Date.now();
  const userSpam = spamMap.get(userId);

  if (!userSpam || now - userSpam.firstMessage > SPAM_WINDOW_MS) {
    spamMap.set(userId, { count: 1, firstMessage: now });
    return;
  }

  userSpam.count++;
  if (userSpam.count >= SPAM_THRESHOLD) {
    spamMap.delete(userId);

    const member = message.guild.members.cache.get(userId);
    if (!member || !member.moderatable) return;

    const botMember = message.guild.members.me;
    if (!botMember?.permissions.has(PermissionFlagsBits.ModerateMembers)) return;

    try {
      await member.timeout(MUTE_DURATION_MS, "Anti-spam automatique");
      await message.channel.send({
        content: `🔇 <@${userId}> a été mis en sourdine pendant **5 minutes** pour spam.`,
      });
      logger.info(`Anti-spam: ${userId} muté 5 min dans ${message.guild.id}`);
    } catch (err) {
      logger.error({ err }, "Erreur anti-spam mute");
    }
  }
}
