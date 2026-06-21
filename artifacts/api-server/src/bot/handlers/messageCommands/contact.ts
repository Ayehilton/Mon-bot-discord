import { type Message, EmbedBuilder } from "discord.js";

export async function contactMessage(message: Message): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📞 Nous Contacter")
    .setDescription("Plusieurs façons de contacter le support de **LJI Market** :")
    .addFields(
      {
        name: "🎫 Ticket",
        value: "Utilise `!ticket` pour ouvrir un ticket — méthode la plus rapide.",
      },
      {
        name: "⏰ Disponibilité",
        value: "Le staff est disponible tous les jours. Nous répondons dans les plus brefs délais.",
      },
      {
        name: "⚠️ Rappel",
        value: "Ne contacte jamais le staff en DM sans avoir ouvert un ticket au préalable.",
      },
    )
    .setFooter({ text: "LJI Market — Support" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}