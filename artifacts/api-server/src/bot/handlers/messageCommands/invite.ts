import { type Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export async function inviteMessage(message: Message, args: string[]) {
  if (!message.guild) return;

  const botMember = message.guild.members.me;
  if (!botMember?.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await message.reply(
      "❌ Le bot a besoin de la permission **Gérer le serveur** pour voir les invitations.",
    );
    return;
  }

  try {
    const invites = await message.guild.invites.fetch();
    const target = message.mentions.users.first();

    if (target) {
      const userInvites = invites.filter((i) => i.inviter?.id === target.id);
      const total = userInvites.reduce((sum, i) => sum + (i.uses ?? 0), 0);

      const embed = new EmbedBuilder()
        .setTitle(`📨 Invitations de ${target.username}`)
        .setThumbnail(target.displayAvatarURL())
        .setColor(0x5865f2)
        .addFields({
          name: "Total d'invitations utilisées",
          value: `**${total}**`,
          inline: false,
        });

      if (userInvites.size > 0) {
        const lines = [...userInvites.values()]
          .slice(0, 10)
          .map((i) => `\`${i.code}\` — ${i.uses ?? 0} utilisation(s)`);
        embed.addFields({ name: "Codes actifs", value: lines.join("\n") });
      } else {
        embed.setFooter({ text: "Aucun code d'invitation actif pour ce membre" });
      }

      await message.reply({ embeds: [embed] });
      return;
    }

    const byInviter = new Map<string, { name: string; count: number }>();
    invites.forEach((inv) => {
      if (!inv.inviter) return;
      const existing = byInviter.get(inv.inviter.id);
      if (existing) {
        existing.count += inv.uses ?? 0;
      } else {
        byInviter.set(inv.inviter.id, {
          name: inv.inviter.username,
          count: inv.uses ?? 0,
        });
      }
    });

    const sorted = [...byInviter.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15);

    if (sorted.length === 0) {
      await message.reply("📭 Aucune invitation enregistrée sur ce serveur.");
      return;
    }

    const lines = sorted.map(([id, { count }], idx) => {
      const medal =
        idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
      return `${medal} <@${id}> — **${count}** invitation(s)`;
    });

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`📨 Classement des invitations — ${message.guild.name}`)
          .setDescription(lines.join("\n"))
          .setColor(0x5865f2)
          .setFooter({
            text: `Top ${sorted.length} • Utilise !invite @membre pour les détails`,
          })
          .setTimestamp(),
      ],
    });
  } catch {
    await message.reply(
      "❌ Impossible de récupérer les invitations. Vérifie les permissions du bot.",
    );
  }
}
