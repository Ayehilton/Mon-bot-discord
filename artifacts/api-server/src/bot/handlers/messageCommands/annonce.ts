import { type Message, EmbedBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

export async function annonceMessage(message: Message, args: string[]) {
  if (!message.guild) return;
  const isMod = message.member?.permissions.has(PermissionFlagsBits.ManageMessages);
  if (!isMod) {
    await message.reply("🚫 Seuls les modérateurs peuvent faire une annonce.");
    return;
  }

  const mentioned = message.mentions.channels.first();
  if (!mentioned || mentioned.type !== ChannelType.GuildText) {
    await message.reply("❌ Syntaxe : `!annonce #salon <ton message>`");
    return;
  }

  const text = args.filter((a) => !a.startsWith("<#")).join(" ").trim();
  if (!text) {
    await message.reply("❌ Tu dois écrire un message après le salon.");
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("📢 Annonce")
    .setDescription(text)
    .setColor(0xfee75c)
    .setFooter({ text: `Par ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
    .setTimestamp();

  try {
    await mentioned.send({ content: "@everyone", embeds: [embed], allowedMentions: { parse: ["everyone"] } });
    await message.reply(`✅ Annonce envoyée dans ${mentioned}`);
    try { await message.delete(); } catch {}
  } catch {
    await message.reply("❌ Impossible d'envoyer dans ce salon (permissions ?).");
  }
}
