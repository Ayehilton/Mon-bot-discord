import {
  type Message,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from "discord.js";
import { giveaways } from "../../store.js";
import { endGiveaway } from "../giveawayHandler.js";
import { logger } from "../../../lib/logger.js";

export async function giveawayMessage(message: Message, args: string[]) {
  if (!message.guild || !message.channel.isTextBased()) return;
  const sub = args[0]?.toLowerCase();

  if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await message.reply("❌ Tu n'as pas la permission.");
    return;
  }

  if (sub === "start") {
    const dureeMin = parseInt(args[1] ?? "0");
    const winnersCount = args[2]?.startsWith("w") ? parseInt(args[2].slice(1)) : 1;
    const prize = args.slice(args[2]?.startsWith("w") ? 3 : 2).join(" ");

    if (!dureeMin || !prize) {
      await message.reply(
        "❌ Usage: `!giveaway start <durée_min> [w<gagnants>] <prix>`\nExemple: `!giveaway start 60 w2 Nitro Discord`"
      );
      return;
    }

    const endTime = new Date(Date.now() + dureeMin * 60 * 1000);

    const embed = new EmbedBuilder()
      .setTitle("🎉 GIVEAWAY!")
      .setDescription(`**Prix:** ${prize}\n\nClique sur le bouton pour participer !`)
      .addFields(
        { name: "Gagnants", value: `${winnersCount}`, inline: true },
        { name: "Fin", value: `<t:${Math.floor(endTime.getTime() / 1000)}:R>`, inline: true },
        { name: "Organisateur", value: `<@${message.author.id}>`, inline: true }
      )
      .setColor(0xfee75c)
      .setFooter({ text: "Clique pour participer / re-cliquer pour se retirer" })
      .setTimestamp(endTime);

    const msg = await message.channel.send({ embeds: [embed] });

    const giveawayData = {
      messageId: msg.id,
      channelId: message.channelId,
      guildId: message.guild.id,
      prize,
      winnersCount,
      endTime,
      hostId: message.author.id,
      ended: false,
      participants: [] as string[],
    };

    giveaways.set(msg.id, giveawayData);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_join_${msg.id}`)
        .setLabel("Participer 🎉")
        .setStyle(ButtonStyle.Success)
    );

    await msg.edit({ components: [row] });
    await message.react("✅");

    setTimeout(() => {
      endGiveaway(msg.id, message.client).catch((err) =>
        logger.error({ err }, "Erreur fin giveaway auto")
      );
    }, dureeMin * 60 * 1000);
  } else if (sub === "end") {
    const msgId = args[1];
    if (!msgId) {
      await message.reply("❌ Usage: `!giveaway end <message_id>`");
      return;
    }
    if (!giveaways.get(msgId)) {
      await message.reply("❌ Giveaway introuvable.");
      return;
    }
    await endGiveaway(msgId, message.client);
    await message.react("✅");
  } else if (sub === "reroll") {
    const msgId = args[1];
    if (!msgId) {
      await message.reply("❌ Usage: `!giveaway reroll <message_id>`");
      return;
    }
    const g = giveaways.get(msgId);
    if (!g || g.participants.length === 0) {
      await message.reply("❌ Introuvable ou aucun participant.");
      return;
    }
    const winner = g.participants[Math.floor(Math.random() * g.participants.length)];
    await message.channel.send(`🎊 Nouveau gagnant: <@${winner}> pour **${g.prize}** !`);
  } else if (sub === "list") {
    const active = [...giveaways.values()].filter(
      (g) => !g.ended && g.guildId === message.guild!.id
    );
    if (active.length === 0) {
      await message.reply("📭 Aucun giveaway actif.");
      return;
    }
    const embed = new EmbedBuilder()
      .setTitle("🎉 Giveaways actifs")
      .setColor(0xfee75c)
      .setDescription(
        active
          .map(
            (g) =>
              `**${g.prize}** — <#${g.channelId}> — Fin: <t:${Math.floor(g.endTime.getTime() / 1000)}:R> — ${g.participants.length} participants`
          )
          .join("\n")
      );
    await message.reply({ embeds: [embed] });
  } else {
    await message.reply(
      "**Commandes giveaway :**\n" +
      "`!giveaway start <durée_min> [w<gagnants>] <prix>`\n" +
      "`!giveaway end <message_id>`\n" +
      "`!giveaway reroll <message_id>`\n" +
      "`!giveaway list`"
    );
  }
}
