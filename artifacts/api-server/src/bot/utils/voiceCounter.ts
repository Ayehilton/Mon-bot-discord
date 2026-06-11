import { type Guild, ChannelType } from "discord.js";
import { logger } from "../../lib/logger.js";

const updateQueue = new Map<string, NodeJS.Timeout>();

export async function updateVoiceCounter(
  guild: Guild,
  nameHint: string,
  count: number,
  prefix: string
) {
  const channel = guild.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildVoice &&
      c.name.toLowerCase().includes(nameHint.toLowerCase())
  );

  if (!channel || channel.type !== ChannelType.GuildVoice) {
    logger.warn(`Salon vocal "${nameHint}" introuvable dans ${guild.name}`);
    return;
  }

  const newName = `${prefix} : ${count}`;
  if (channel.name === newName) return;

  const queueKey = channel.id;
  if (updateQueue.has(queueKey)) {
    clearTimeout(updateQueue.get(queueKey));
  }

  const timeout = setTimeout(async () => {
    updateQueue.delete(queueKey);
    try {
      await channel.setName(newName);
      logger.info(`Compteur vocal mis à jour: "${newName}" dans ${guild.name}`);
    } catch (err) {
      logger.warn({ err }, `Impossible de renommer le salon vocal "${nameHint}"`);
    }
  }, 2000);

  updateQueue.set(queueKey, timeout);
}
