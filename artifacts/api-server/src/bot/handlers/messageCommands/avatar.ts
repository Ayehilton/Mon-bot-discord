import { type Message, EmbedBuilder } from "discord.js";

export async function avatarMessage(message: Message, args: string[]) {
  const mentioned = message.mentions.users.first();
  const id = mentioned?.id ?? args[0]?.replace(/[<@!>]/g, "") ?? message.author.id;
  const user = await message.client.users.fetch(id).catch(() => null);
  if (!user) { await message.reply("❌ Utilisateur introuvable."); return; }
  const url = user.displayAvatarURL({ size: 1024, extension: "png" });
  const embed = new EmbedBuilder()
    .setTitle(`🖼️ Avatar de ${user.username}`)
    .setImage(url)
    .setColor(0x5865f2)
    .setURL(url)
    .setFooter({ text: `Demandé par ${message.author.username}` });
  await message.reply({ embeds: [embed] });
}
