import type { GuildMember } from "discord.js";
import { logger } from "../../lib/logger.js";

export async function onGuildMemberAdd(member: GuildMember) {
  logger.info(`Nouveau membre: ${member.user.tag} dans ${member.guild.name}`);
}
