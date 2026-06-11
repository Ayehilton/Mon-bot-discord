import { type Message, EmbedBuilder } from "discord.js";

export async function helpMessage(message: Message) {
  const embed = new EmbedBuilder()
    .setTitle("📖 Commandes — LJI Market Bot")
    .setColor(0x5865f2)
    .addFields(
      {
        name: "🎫 Tickets",
        value: "`!ticket setup` `!ticket list`",
      },
      {
        name: "🎉 Giveaways",
        value:
          "`!giveaway start <min> [w<nb>] <prix>`\n`!giveaway end/reroll/list <id>`",
      },
      {
        name: "🔨 Modération",
        value:
          "`!mod mute @m <min> [raison]`\n`!mod unmute/kick/ban @m [raison]`\n`!mod warn @m <raison>` `!mod warns/clearwarn @m`",
      },
      {
        name: "📊 Stats",
        value: "`!stats serveur` `!stats utilisateur [@m]` `!stats support`",
      },
      {
        name: "⭐ Évaluations",
        value: "`!evaluation panel` `!evaluation resultats`",
      },
      {
        name: "✅ Vouches",
        value:
          "`!vouch add @m [commentaire]`\n`!vouch voir [@m]` `!vouch setup #salon`\n`!vouch compteur` `!vouch supprimer @m`",
      },
      {
        name: "💳 Paiements",
        value: "`!paiement` — Afficher les moyens de paiement",
      }
    )
    .setFooter({ text: "Préfixe: !" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
