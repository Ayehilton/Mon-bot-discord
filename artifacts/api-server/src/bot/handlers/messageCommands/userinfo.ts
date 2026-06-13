import { type Message, EmbedBuilder } from "discord.js";

export async function userinfoMessage(message: Message, args: string[]) {
  if (!message.guild) return;
  const mentioned = message.mentions.users.first();
  const targetUserId = mentioned?.id ?? args[0] ?? message.author.id;
  const member = await message.guild.members.fetch(targetUserId.replace(/[<@!>]/g, "")).catch(() => null);
  if (!member) { await message.reply("❌ Utilisateur introuvable sur ce serveur."); return; }
  const roles = member.roles.cache
    .filter((r) => r.id !== message.guild!.id)
    .sort((a, b) => b.position - a.position)
    .map((r) => `<@&${r.id}>`)
    .slice(0, 15);
  const embed = new EmbedBuilder()
    .setTitle(`👤 Infos membre — ${member.user.username}`)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setColor(member.displayHexColor === "#000000" ? 0x5865f2 : member.displayColor)
    .addFields(
      { name: "🏷️ Tag", value: member.user.tag, inline: true },
      { name: "🆔 ID", value: `\`${member.id}\``, inline: true },
      { name: "🤖 Bot ?", value: member.user.bot ? "Oui" : "Non", inline: true },
      { name: "📅 Compte créé", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "📥 A rejoint", value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Inconnu", inline: true },
      { name: `🎭 Rôles (${roles.length})`, value: roles.length > 0 ? roles.join(" ") : "Aucun" },
    )
    .setFooter({ text: `Demandé par ${message.author.username}` })
    .setTimestamp();
  await message.reply({ embeds: [embed] });
}
