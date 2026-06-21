import { type Message, EmbedBuilder, PermissionFlagsBits, type GuildMember } from "discord.js";

export async function restockMessage(message: Message, args: string[]): Promise<void> {
  if (!message.guild) return;

  const member = message.member as GuildMember;
  if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
    await message.reply("❌ Tu dois être **administrateur** pour utiliser cette commande.");
    return;
  }

  if (args.length === 0) {
    await message.reply("❌ Usage : `!restock <description du produit>`");
    return;
  }

  const restockRole = message.guild.roles.cache.find((r) => r.name === "Restock");
  const description = args.join(" ");

  await message.delete().catch(() => {});

  const embed = new EmbedBuilder()
    .setColor(0x00ff88)
    .setTitle("🔄 RESTOCK DISPONIBLE !")
    .setDescription(description)
    .addFields(
      { name: "📦 Disponibilité", value: "✅ En stock maintenant", inline: true },
      { name: "⚡ Action", value: "Ouvre un ticket vite !", inline: true },
    )
    .setFooter({ text: `Annonce par ${message.author.tag}` })
    .setTimestamp();

  const ping = restockRole ? `<@&${restockRole.id}>` : "";
  await message.channel.send({ content: ping, embeds: [embed] });
}