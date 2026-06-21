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
        value: "`!giveaway start <min> [w<nb>] <prix>`\n`!giveaway quick <prix>` — Express 1 min\n`!giveaway end/reroll/list <id>`",
      },
      {
        name: "🔨 Modération",
        value: "`!mod mute/unmute/kick/ban/warn @m`\n`!clear <nombre>` `!slowmode <secondes>`\n`!lock` `!unlock` `!say <texte>` `!annonce <texte>`\n`!antispam on/off` — Anti-spam auto",
      },
      {
        name: "📊 Stats & Évaluations",
        value: "`!stats serveur/utilisateur/support`\n`!evaluation panel` `!evaluation resultats`\n`!sondage <question>`",
      },
      {
        name: "✅ Vouches",
        value: "`!vouch add @m [commentaire]`\n`!vouch voir [@m]` `!vouch setup #salon`\n`!vouch compteur` `!vouch supprimer @m`",
      },
      {
        name: "🛒 Restock & Boutique",
        value: "`!restock <description>` — Poster un restock\n`!restock-notif` *(admin)* — Bouton abonnement notifs\n`!catalogue` — Voir les produits\n`!paiement` — Moyens de paiement",
      },
      {
        name: "📦 Commandes",
        value: "`!commande new [@acheteur] <description>` — Créer\n`!commande update <ID> <statut>` — Mettre à jour\n`!commande voir <ID>` — Voir le statut\n*Statuts: `attente` `confirmee` `livree` `annulee`*",
      },
      {
        name: "🎲 Tirage",
        value: "`!tirage [@role]` — Tirer un membre au sort",
      },
      {
        name: "📋 Règles / Rules",
        value: "`!rules` — Règles du serveur (FR + EN)",
      },
      {
        name: "❓ Aide & Contact",
        value: "`!faq` — Questions fréquentes\n`!contact` — Contacter le support\n`!invite` — Invitations",
      },
      {
        name: "🔧 Utilitaires",
        value: "`!ping` `!serverinfo` `!userinfo [@m]` `!avatar [@m]`",
      },
    )
    .setFooter({ text: "Préfixe: !" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}