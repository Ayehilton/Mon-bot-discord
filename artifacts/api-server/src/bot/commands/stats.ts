import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import type { SlashCommand } from "../types.js";
import { giveaways, tickets, warnMap } from "../store.js";
import { getRatings } from "../handlers/ratingHandler.js";

export const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("Statistiques du serveur et des utilisateurs")
  .addSubcommand((sub) =>
    sub
      .setName("serveur")
      .setDescription("Statistiques générales du serveur")
  )
  .addSubcommand((sub) =>
    sub
      .setName("utilisateur")
      .setDescription("Statistiques d'un utilisateur")
      .addUserOption((o) =>
        o.setName("membre").setDescription("Membre (optionnel)").setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("support").setDescription("Statistiques du support (tickets & évaluations)")
  );

export const execute: SlashCommand["execute"] = async (
  interaction: ChatInputCommandInteraction
) => {
  if (!interaction.guild) return;
  const sub = interaction.options.getSubcommand();

  if (sub === "serveur") {
    const guild = interaction.guild;
    await guild.members.fetch();

    const total = guild.memberCount;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;
    const humans = total - bots;
    const online = guild.members.cache.filter(
      (m) => m.presence?.status === "online" || m.presence?.status === "dnd" || m.presence?.status === "idle"
    ).size;

    const textChannels = guild.channels.cache.filter((c) => c.isTextBased()).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.isVoiceBased()).size;
    const roles = guild.roles.cache.size - 1;

    const activeGiveaways = [...giveaways.values()].filter(
      (g) => !g.ended && g.guildId === guild.id
    ).size;

    const openTickets = [...tickets.keys()].filter((k) => k.endsWith("_" + guild.id)).length;

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
        { name: "🎉 Giveaways actifs", value: `${activeGiveaways}`, inline: true },
      )
      .setColor(0x5865f2)
      .setTimestamp()
      .setFooter({ text: `ID: ${guild.id}` });

    await interaction.reply({ embeds: [embed] });
  }

  if (sub === "utilisateur") {
    const user = interaction.options.getUser("membre") ?? interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) {
      await interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });
      return;
    }

    const warns = warnMap.get(`${user.id}_${interaction.guildId}`) ?? [];
    const joinedAgo = member.joinedAt
      ? `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>`
      : "Inconnu";

    const topRole = member.roles.highest;

    const embed = new EmbedBuilder()
      .setTitle(`👤 Profil — ${user.tag}`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "🗓️ Compte créé", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "📥 A rejoint", value: joinedAgo, inline: true },
        { name: "🏆 Rôle le plus haut", value: `${topRole}`, inline: true },
        { name: "⚠️ Avertissements", value: `${warns.length}`, inline: true },
        { name: "🤖 Bot", value: user.bot ? "Oui" : "Non", inline: true },
        { name: "🆔 ID", value: user.id, inline: true }
      )
      .setColor(member.displayHexColor || 0x5865f2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  if (sub === "support") {
    const ratings = getRatings();
    const guildTicketKeys = [...tickets.keys()].filter((k) =>
      k.endsWith("_" + interaction.guildId)
    );
    const totalGiveaways = [...giveaways.values()].filter(
      (g) => g.guildId === interaction.guildId
    );

    const avg =
      ratings.length > 0
        ? (ratings.reduce((a, b) => a + b.rating, 0) / ratings.length).toFixed(1)
        : "N/A";

    const dist = [1, 2, 3, 4, 5].map((n) => ({
      n,
      count: ratings.filter((r) => r.rating === n).length,
    }));

    const embed = new EmbedBuilder()
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
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
