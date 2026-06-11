import { type Message, PermissionFlagsBits } from "discord.js";
import { spamMap, SPAM_THRESHOLD, SPAM_WINDOW_MS, MUTE_DURATION_MS } from "../store.js";
import { logger } from "../../lib/logger.js";
import { handleMessageCommand } from "../handlers/messageCommandRouter.js";

export async function onMessageCreate(message: Message) {
  if (message.author.bot || !message.guild) return;

  await handleMessageCommand(message);

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
