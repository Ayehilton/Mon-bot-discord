import { type Message, EmbedBuilder } from "discord.js";

export async function paiementMessage(message: Message) {
  const embed = new EmbedBuilder()
    .setTitle("💳 Moyens de paiement acceptés")
    .setDescription("Voici tous les moyens de paiement disponibles pour régler ta commande.")
    .addFields(
      {
        name: "🪙 Litecoin (LTC)",
        value:
          "Paiement en cryptomonnaie Litecoin.\n> Rapide · Sécurisé · Sans frais bancaires\n> Demande l'adresse LTC en ouvrant un ticket.",
        inline: false,
      },
      {
        name: "🅿️ PayPal",
        value:
          "Paiement via PayPal (Amis & Famille).\n> ⚠️ **Amis & Famille uniquement** — Pas de remboursement automatique\n> Demande l'adresse PayPal en ouvrant un ticket.",
        inline: false,
      },
      {
        name: "🟢 Robux (Roblox)",
        value:
          "Paiement en Robux via game pass ou groupe Roblox.\n> Montant converti au taux actuel\n> Demande les détails en ouvrant un ticket.",
        inline: false,
      }
    )
    .setColor(0x5865f2)
    .setFooter({
      text: "Pour toute question, ouvre un ticket • LJI Market",
    })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });

  try {
    await message.delete();
  } catch {}
}
