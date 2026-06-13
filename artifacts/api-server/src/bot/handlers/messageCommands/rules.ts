import { type Message, EmbedBuilder } from "discord.js";

export async function rulesMessage(message: Message) {
  const embedFR = new EmbedBuilder()
    .setTitle("📜 Règles du serveur — LJI Market")
    .setColor(0x5865f2)
    .setDescription(
      "Bienvenue ! En restant sur ce serveur, tu acceptes les règles ci-dessous. Tout manquement entraîne sanction (warn / mute / kick / ban).",
    )
    .addFields(
      { name: "1️⃣ Respect", value: "Aucune insulte, harcèlement, racisme, homophobie ou discrimination. On reste poli avec tout le monde, staff comme membres." },
      { name: "2️⃣ Pas de publicité", value: "Interdiction totale de faire la pub d'autres serveurs, comptes sociaux ou produits sans autorisation du staff. Les liens d'invitation Discord = ban immédiat." },
      { name: "3️⃣ Pas de contenu NSFW", value: "Images, vidéos, GIFs ou liens à caractère sexuel, violent ou choquant sont strictement interdits, même en privé via le bot." },
      { name: "4️⃣ Pas de spam", value: "Pas de flood, pas de mentions inutiles (@everyone, @here, @staff), pas de messages répétés. L'anti-spam mute auto 5 min si 5+ messages en 5s." },
      { name: "5️⃣ Arnaques / scams", value: "Toute tentative d'arnaque, phishing, fake giveaway ou usurpation d'identité = ban définitif + signalement à Discord Trust & Safety." },
      { name: "6️⃣ Tickets & ventes", value: "Pour acheter / vendre, ouvre un ticket via le panneau prévu. Toute vente hors-ticket n'engage en rien LJI Market." },
      { name: "7️⃣ Décisions du staff", value: "Les décisions du staff sont finales. Pour contester, ouvre un ticket — pas de drama en public." },
    )
    .setFooter({ text: "Français • !rules pour réafficher" })
    .setTimestamp();

  const embedEN = new EmbedBuilder()
    .setTitle("📜 Server Rules — LJI Market")
    .setColor(0x57f287)
    .setDescription(
      "Welcome! By staying on this server, you agree to the rules below. Breaking them = sanction (warn / mute / kick / ban).",
    )
    .addFields(
      { name: "1️⃣ Respect", value: "No insults, harassment, racism, homophobia or any kind of discrimination. Be polite with everyone, staff and members." },
      { name: "2️⃣ No advertising", value: "Promoting other servers, social accounts or products without staff approval is forbidden. Discord invite links = instant ban." },
      { name: "3️⃣ No NSFW content", value: "Sexual, violent or shocking images / videos / GIFs / links are strictly forbidden — even in DMs through the bot." },
      { name: "4️⃣ No spam", value: "No flooding, no useless mentions (@everyone, @here, @staff), no repeated messages. Anti-spam auto-mutes 5 min on 5+ msgs in 5s." },
      { name: "5️⃣ Scams", value: "Any scam attempt, phishing, fake giveaway or impersonation = permanent ban + report to Discord Trust & Safety." },
      { name: "6️⃣ Tickets & sales", value: "To buy / sell, open a ticket via the panel. Any sale outside a ticket is not covered by LJI Market." },
      { name: "7️⃣ Staff decisions", value: "Staff decisions are final. To dispute one, open a ticket — no public drama." },
    )
    .setFooter({ text: "English • !rules to display again" })
    .setTimestamp();

  await message.channel.send({ embeds: [embedFR, embedEN] });

  try {
    await message.delete();
  } catch {}
}
