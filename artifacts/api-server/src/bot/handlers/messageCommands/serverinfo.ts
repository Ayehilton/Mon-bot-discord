import { type Message, EmbedBuilder, ChannelType } from "discord.js";

export async function serverinfoMessage(message: Message) {
  const guild = message.guild;
  if (!guild) { await message.reply("❌ Cette commande doit être utilisée dans un serveur."); return; }
  await guild.fetch();
  const owner = await guild.fetchOwner().catch(() => null);
  const channels = guild.channels.cache;
  const textChannels = channels.filter((c) => c.type === ChannelType.GuildText).size;
  const voiceChannels = channels.filter((c) => c.type === ChannelType.GuildVoice).size;
  const categories = channels.filter((c) => c.type === ChannelType.GuildCategory).size;
  const embed = new EmbedBuilder()
    .setTitle(`📊 Infos serveur — ${guild.name}`)
    .setThumbnail(guild.iconURL({ size: 256 }))
    .setColor(0x5865f2)
    .addFields(
      { name: "🆔 ID", value: `\`${guild.id}\``, inline: true },
      { name: "👑 Propriétaire", value: owner ? `<@${owner.id}>` : "Inconnu", inline: true },
      { name: "📅 Créé le", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
      { name: "👥 Membres", value: `\`${guild.memberCount}\``, inline: true },
      { name: "💬 Salons texte", value: `\`${textChannels}\``, inline: true },
      { name: "🔊 Salons vocaux", value: `\`${voiceChannels}\``, inline: true },
      { name: "📂 Catégories", value: `\`${categories}\``, inline: true },
      { name: "🎭 Rôles", value: `\`${guild.roles.cache.size}\``, inline: true },
      { name: "😀 Émojis", value: `\`${guild.emojis.cache.size}\``, inline: true },
      { name: "🚀 Boosts", value: `\`Niveau ${guild.premiumTier} • ${guild.premiumSubscriptionCount ?? 0} boosts\``, inline: false },
    )
    .setFooter({ text: `Demandé par ${message.author.username}` })
    .setTimestamp();
  await message.reply({ embeds: [embed] });
}
