import { type Message, EmbedBuilder } from "discord.js";

export async function sondageMessage(message: Message, args: string[]) {
  const question = args.join(" ").trim();
  if (!question) {
    await message.reply("❌ Syntaxe : `!sondage <ta question>`");
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("📊 Sondage")
    .setDescription(question)
    .setColor(0x5865f2)
    .setFooter({ text: `Par ${message.author.username} • Vote ci-dessous`, iconURL: message.author.displayAvatarURL() })
    .setTimestamp();

  const sent = await message.channel.send({ embeds: [embed] });
  try {
    await sent.react("👍");
    await sent.react("👎");
    await sent.react("🤷");
  } catch {}

  try { await message.delete(); } catch {}
}
