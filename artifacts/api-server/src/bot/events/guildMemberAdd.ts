import { type GuildMember, EmbedBuilder } from "discord.js";
import { guildConfigs } from "../store.js";
import { logger } from "../../lib/logger.js";

export async function onGuildMemberAdd(member: GuildMember) {
  logger.info(`Nouveau membre: ${member.user.tag} dans ${member.guild.name}`);

  const config = guildConfigs.get(member.guild.id);
  if (!config?.welcomeChannelId) return;

  try {
    const channel = await member.guild.channels
      .fetch(config.welcomeChannelId)
      .catch(() => null);
    if (!channel?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setTitle("👋 Bienvenue !")
      .setDescription(
        `Salut <@${member.id}> ! Bienvenue sur **${member.guild.name}** 🎉\n\n` +
          "Lis les règles avec `!rules` et découvre notre boutique avec `!catalogue` !",
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setColor(0x57f287)
      .addFields(
        { name: "👤 Membre", value: member.user.username, inline: true },
        {
          name: "📊 Membres",
          value: `${member.guild.memberCount}`,
          inline: true,
        },
      )
      .setFooter({ text: `${member.guild.name}` })
      .setTimestamp();

    await channel.send({ content: `<@${member.id}>`, embeds: [embed] });
  } catch (err) {
    logger.warn({ err }, "Impossible d'envoyer le message de bienvenue");
  }
}
