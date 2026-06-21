import { type Message, EmbedBuilder } from "discord.js";

export async function faqMessage(message: Message): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("❓ FAQ — Questions Fréquentes")
    .addFields(
      {
        name: "💳 Quels sont les moyens de paiement ?",
        value: "Utilise la commande `!paiement` pour voir tous les moyens de paiement acceptés.",
      },
      {
        name: "📦 Comment passer une commande ?",
        value: "Ouvre un ticket avec `!ticket` et un membre du staff te répondra rapidement.",
      },
      {
        name: "⏱️ Quel est le délai de livraison ?",
        value: "La livraison est généralement instantanée après confirmation du paiement.",
      },
      {
        name: "🔄 Comment être notifié des restocks ?",
        value: "Va dans le salon des notifs et clique sur le bouton 🔔 pour recevoir le rôle @Restock.",
      },
      {
        name: "⭐ Comment laisser un avis ?",
        value: "Utilise `!vouch add @vendeur [commentaire]` après ta commande.",
      },
      {
        name: "🚨 J'ai un problème avec ma commande ?",
        value: "Ouvre un ticket avec `!ticket` en expliquant ton problème, le staff te répondra.",
      },
    )
    .setFooter({ text: "D'autres questions ? Ouvre un ticket !" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}