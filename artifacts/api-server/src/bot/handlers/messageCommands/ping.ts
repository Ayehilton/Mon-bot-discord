import { type Message, EmbedBuilder } from "discord.js";

export async function pingMessage(message: Message) {
  const sent = await message.reply("🏓 Pong...");
  const latency = sent.createdTimestamp - message.createdTimestamp;
  const ws = Math.round(message.client.ws.ping);
  const embed = new EmbedBuilder()
    .setTitle("🏓 Pong !")
    .setColor(0x57f287)
    .addFields(
      { name: "📡 Latence message", value: `\`${latency}ms\``, inline: true },
      { name: "🌐 Latence API", value: `\`${ws}ms\``, inline: true },
    )
    .setTimestamp();
  await sent.edit({ content: "", embeds: [embed] });
}
