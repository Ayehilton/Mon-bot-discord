import { type Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { warnMap } from "../../store.js";
import { logger } from "../../../lib/logger.js";

export async function modMessage(message: Message, args: string[]) {
  if (!message.guild) return;
  const sub = args[0]?.toLowerCase();

  if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    await message.reply("❌ Tu n'as pas la permission de modérer.");
    return;
  }

  const mentionedUser = message.mentions.users.first();
  const mentionedMember = mentionedUser
    ? message.guild.members.cache.get(mentionedUser.id)
    : null;

  if (sub === "mute") {
    if (!mentionedUser || !mentionedMember) {
      await message.reply("❌ Usage: `!mod mute @membre <durée_min> [raison]`");
      return;
    }
    const duree = parseInt(args[2] ?? "0");
    if (!duree) {
      await message.reply("❌ Durée invalide. Usage: `!mod mute @membre <durée_min> [raison]`");
      return;
    }
    const raison = args.slice(3).join(" ") || "Aucune raison";

    if (!mentionedMember.moderatable) {
      await message.reply("❌ Je ne peux pas muter ce membre.");
      return;
    }

    await mentionedMember.timeout(duree * 60 * 1000, raison);
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔇 Membre muté")
          .addFields(
            { name: "Membre", value: `<@${mentionedUser.id}>`, inline: true },
            { name: "Durée", value: `${duree} min`, inline: true },
            { name: "Raison", value: raison }
          )
          .setColor(0xed4245)
          .setTimestamp(),
      ],
    });
    logger.info(`Mute: ${mentionedUser.tag} ${duree}min par ${message.author.tag}`);
  } else if (sub === "unmute") {
    if (!mentionedUser || !mentionedMember) {
      await message.reply("❌ Usage: `!mod unmute @membre`");
      return;
    }
    await mentionedMember.timeout(null);
    await message.reply(`✅ <@${mentionedUser.id}> n'est plus en sourdine.`);
  } else if (sub === "kick") {
    if (!mentionedUser || !mentionedMember) {
      await message.reply("❌ Usage: `!mod kick @membre [raison]`");
      return;
    }
    const raison = args.slice(2).join(" ") || "Aucune raison";
    if (!mentionedMember.kickable) {
      await message.reply("❌ Je ne peux pas kick ce membre.");
      return;
    }
    await mentionedMember.kick(raison);
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("👢 Membre expulsé")
          .addFields(
            { name: "Membre", value: `${mentionedUser.tag}`, inline: true },
            { name: "Raison", value: raison }
          )
          .setColor(0xffa500)
          .setTimestamp(),
      ],
    });
  } else if (sub === "ban") {
    if (!mentionedUser || !mentionedMember) {
      await message.reply("❌ Usage: `!mod ban @membre [raison]`");
      return;
    }
    const raison = args.slice(2).join(" ") || "Aucune raison";
    if (!mentionedMember.bannable) {
      await message.reply("❌ Je ne peux pas bannir ce membre.");
      return;
    }
    await mentionedMember.ban({ reason: raison });
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔨 Membre banni")
          .addFields(
            { name: "Membre", value: `${mentionedUser.tag}`, inline: true },
            { name: "Raison", value: raison }
          )
          .setColor(0xed4245)
          .setTimestamp(),
      ],
    });
  } else if (sub === "warn") {
    if (!mentionedUser) {
      await message.reply("❌ Usage: `!mod warn @membre <raison>`");
      return;
    }
    const raison = args.slice(2).join(" ");
    if (!raison) {
      await message.reply("❌ Une raison est requise.");
      return;
    }
    const key = `${mentionedUser.id}_${message.guild.id}`;
    const warns = warnMap.get(key) ?? [];
    warns.push(`[${new Date().toLocaleDateString("fr-FR")}] ${raison}`);
    warnMap.set(key, warns);

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚠️ Avertissement")
          .addFields(
            { name: "Membre", value: `<@${mentionedUser.id}>`, inline: true },
            { name: "Total warns", value: `${warns.length}`, inline: true },
            { name: "Raison", value: raison }
          )
          .setColor(0xfee75c)
          .setTimestamp(),
      ],
    });

    try {
      await mentionedUser.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("⚠️ Tu as reçu un avertissement")
            .addFields(
              { name: "Serveur", value: message.guild.name, inline: true },
              { name: "Raison", value: raison },
              { name: "Total", value: `${warns.length} avertissement(s)` }
            )
            .setColor(0xfee75c)
            .setTimestamp(),
        ],
      });
    } catch {}
  } else if (sub === "warns") {
    if (!mentionedUser) {
      await message.reply("❌ Usage: `!mod warns @membre`");
      return;
    }
    const key = `${mentionedUser.id}_${message.guild.id}`;
    const warns = warnMap.get(key) ?? [];
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`⚠️ Avertissements de ${mentionedUser.tag}`)
          .setColor(0xfee75c)
          .setDescription(
            warns.length > 0
              ? warns.map((w, i) => `**${i + 1}.** ${w}`).join("\n")
              : "Aucun avertissement."
          ),
      ],
    });
  } else if (sub === "clearwarn") {
    if (!mentionedUser) {
      await message.reply("❌ Usage: `!mod clearwarn @membre`");
      return;
    }
    const key = `${mentionedUser.id}_${message.guild.id}`;
    warnMap.delete(key);
    await message.reply(`✅ Avertissements de <@${mentionedUser.id}> effacés.`);
  } else {
    await message.reply(
      "**Commandes modération :**\n" +
      "`!mod mute @membre <durée_min> [raison]`\n" +
      "`!mod unmute @membre`\n" +
      "`!mod kick @membre [raison]`\n" +
      "`!mod ban @membre [raison]`\n" +
      "`!mod warn @membre <raison>`\n" +
      "`!mod warns @membre`\n" +
      "`!mod clearwarn @membre`"
    );
  }
}
