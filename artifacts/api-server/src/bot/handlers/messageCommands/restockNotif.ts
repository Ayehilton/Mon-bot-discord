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
        value: "`!giveaway start <min> [w<nb>] <prix>`\n`!giveaway end/reroll/list <id>`",
      },
      {
        name: "🔨 Modération",
        value: "`!mod mute @m <min> [raison]`\n`!mod unmute/kick/ban @m [raison]`\n`!mod warn @m <raison>` `!mod warns/clearwarn @m`",
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
        value: "`!vouch add @m [commentaire]`\n`!vouch voir [@m]` `!vouch setup #salon`\n`!vouch compteur` `!vouch supprimer @m`",
      },
      {
        name: "💳 Paiements",
        value: "`!paiement` — Afficher les moyens de paiement",
      },
      {
        name: "🗑️ Clear",
        value: "`!clear <nombre>` — Supprimer des messages (1-100)",
      },
      {
        name: "📋 Règles / Rules",
        value: "`!rules` — Règles du serveur (FR + EN)",
      },
      {
        name: "📦 Catalogue",
        value: "`!catalogue` — Voir les produits\n`!catalogue add <nom> | <description>` — Ajouter\n`!catalogue remove <id>` — Supprimer (mod)",
      },
      {
        name: "🔧 Utilitaires",
        value: "`!ping` — Latence du bot\n`!serverinfo` — Infos du serveur\n`!userinfo [@m]` — Infos d'un membre\n`!avatar [@m]` — Avatar d'un membre",
      },
      {
        name: "🔔 Notifications Restock",
        value: "`!restock-notif` *(admin)* — Poster le bouton d'abonnement aux notifs restock",
      },
    )
    .setFooter({ text: "Préfixe: !" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}