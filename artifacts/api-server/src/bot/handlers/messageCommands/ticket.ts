import {
  type Message,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from "discord.js";
import { tickets } from "../../store.js";

export async function ticketMessage(message: Message, args: string[]) {
  if (!message.guild) return;
  const sub = args[0]?.toLowerCase();

  if (sub === "setup") {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await message.reply("❌ Tu n'as pas la permission.");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🎫 Support")
      .setDescription(
        "Clique sur le bouton ci-dessous pour ouvrir un ticket de support.\n\nUn membre du staff te répondra dans les plus brefs délais."
      )
      .setColor(0x5865f2)
      .setFooter({ text: "Un ticket par utilisateur" });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_open")
        .setLabel("Ouvrir un ticket")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🎫")
    );

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.react("✅");
  } else if (sub === "list") {
    const guildTickets = [...tickets.entries()].filter(([key]) =>
      key.endsWith("_" + message.guild!.id)
    );

    if (guildTickets.length === 0) {
      await message.reply("📭 Aucun ticket ouvert.");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("📋 Tickets ouverts")
      .setColor(0x5865f2)
      .setDescription(
        guildTickets.map(([, t]) => `<#${t.channelId}> — <@${t.userId}>`).join("\n")
      );

    await message.reply({ embeds: [embed] });
  } else {
    await message.reply(
      "**Commandes ticket :**\n`!ticket setup` — Créer le panneau\n`!ticket list` — Voir les tickets ouverts"
    );
  }
}
