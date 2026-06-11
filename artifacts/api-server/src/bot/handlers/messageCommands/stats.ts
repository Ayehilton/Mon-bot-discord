import { type Message, EmbedBuilder } from "discord.js";
import { giveaways, tickets, warnMap } from "../../store.js";
import { getRatings } from "../ratingHandler.js";

export async function statsMessage(message: Message, args: string[]) {
  if (!message.guild) return;
  const sub = args[0]?.toLowerCase() ?? "serveur";

  if (sub === "serveur") {
    const guild = message.guild;
    await guild.members.fetch();

    const total = guild.memberCount;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;
    const humans = total - bots;
    const online = guild.members.cache.filter(
      (m) =>
        m.presence?.status === "online" ||
        m.presence?.status === "dnd" ||
        m.presence?.status === "idle"
    ).size;

    const textChannels = guild.channels.cache.filter((c) => c.isTextBased()).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.isVoiceBased()).size;
    const roles = guild.roles.cache.size - 1;

    const activeGiveaways = [...giveaways.values()].filter(
      (g) => !g.ended && g.guildId === guild.id
    ).length;
    const openTickets = [...tickets.keys()].filter((k) =>
      k.endsWith("_" + guild.id)
    ).length;

    const embed = new EmbedBuilder()
      .setTitle(`📊 Statistiques — ${guild.name}`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: "👥 Membres", value: `${humans} humains | ${bots} bots`, inline: true },
        { name: "🟢 En ligne", value: `${online}`, inline: true },
        { name: "📅 Créé le", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: "💬 Salons texte", value: `${textChannels}`, inline: true },
        { name: "🔊 Salons vocal", value: `${voiceChannels}`, inline: true },
        { name: "🏷️ Rôles", value: `${roles}`, inline: true },
        { name: "🎫 Tickets ouverts", value: `${openTickets}`, inline: true },
        { name: "🎉 Giveaways actifs", value: `${activeGiveaways}`, inline: true }
      )
      .setColor(0x5865f2)
      .setTimestamp()
      .setFooter({ text: `ID: ${guild.id}` });

    await message.reply({ embeds: [embed] });
  } else if (sub === "utilisateur") {
    const target = message.mentions.users.first() ?? message.author;
    const member = message.guild.members.cache.get(target.id);
    if (!member) {
      await message.reply("❌ Membre introuvable.");
      return;
    }

    const warns = warnMap.get(`${target.id}_${message.guild.id}`) ?? [];
    const joinedAgo = member.joinedAt
      ? `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>`
      : "Inconnu";

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`👤 Profil — ${target.tag}`)
          .setThumbnail(target.displayAvatarURL())
          .addFields(
            { name: "🗓️ Compte créé", value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
            { name: "📥 A rejoint", value: joinedAgo, inline: true },
            { name: "🏆 Rôle le plus haut", value: `${member.roles.highest}`, inline: true },
            { name: "⚠️ Avertissements", value: `${warns.length}`, inline: true },
            { name: "🆔 ID", value: target.id, inline: true }
          )
          .setColor(member.displayHexColor || 0x5865f2)
          .setTimestamp(),
      ],
    });
  } else if (sub === "support") {
    const ratings = getRatings();
    const guildTicketKeys = [...tickets.keys()].filter((k) =>
      k.endsWith("_" + message.guild!.id)
    );
    const totalGiveaways = [...giveaways.values()].filter(
      (g) => g.guildId === message.guild!.id
    );

    const avg =
      ratings.length > 0
        ? (ratings.reduce((a, b) => a + b.rating, 0) / ratings.length).toFixed(1)
        : "N/A";

    const dist = [1, 2, 3, 4, 5].map((n) => ({
      n,
      count: ratings.filter((r) => r.rating === n).length,
    }));

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎫 Statistiques du support")
          .addFields(
            { name: "Tickets ouverts", value: `${guildTicketKeys.length}`, inline: true },
            { name: "Évaluations reçues", value: `${ratings.length}`, inline: true },
            { name: "Note moyenne", value: `${avg}/5`, inline: true },
            {
              name: "Distribution",
              value: dist.map((d) => `${"⭐".repeat(d.n)}: ${d.count}`).join("\n") || "Aucune",
            },
            { name: "Giveaways (total)", value: `${totalGiveaways.length}`, inline: true },
            {
              name: "Giveaways actifs",
              value: `${totalGiveaways.filter((g) => !g.ended).length}`,
              inline: true,
            }
          )
          .setColor(0x57f287)
          .setTimestamp(),
      ],
    });
  } else {
    await message.reply(
      "**Commandes stats :**\n`!stats serveur` `!stats utilisateur [@membre]` `!stats support`"
    );
  }
}
