import {
  ButtonInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelType,
} from "discord.js";
import { tickets } from "../store.js";
import { logger } from "../../lib/logger.js";

export async function handleTicketButton(interaction: ButtonInteraction) {
  if (interaction.customId === "ticket_open") {
    await openTicket(interaction);
  } else if (interaction.customId.startsWith("ticket_close_")) {
    await closeTicket(interaction);
  }
}

async function openTicket(interaction: ButtonInteraction) {
  if (!interaction.guild) return;

  const existing = tickets.get(interaction.user.id + "_" + interaction.guild.id);
  if (existing) {
    await interaction.reply({
      content: `❌ Tu as déjà un ticket ouvert: <#${existing.channelId}>`,
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
    });

    const ticketData = {
      channelId: channel.id,
      userId: interaction.user.id,
      guildId: interaction.guild.id,
      createdAt: new Date(),
      reason: "Support",
      messages: [] as { author: string; content: string; timestamp: Date }[],
    };

    tickets.set(interaction.user.id + "_" + interaction.guild.id, ticketData);

    const embed = new EmbedBuilder()
      .setTitle("🎫 Ticket de support")
      .setDescription(
        `Bienvenue <@${interaction.user.id}>!\n\nDécris ton problème et un membre du staff te répondra rapidement.`
      )
      .setColor(0x5865f2)
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_close_${interaction.user.id}`)
        .setLabel("Fermer le ticket")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔒")
    );

    await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
    await interaction.editReply({ content: `✅ Ticket créé: <#${channel.id}>` });
  } catch (err) {
    logger.error({ err }, "Erreur création ticket");
    await interaction.editReply({ content: "❌ Impossible de créer le ticket." });
  }
}

async function closeTicket(interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.channel) return;

  const userId = interaction.customId.replace("ticket_close_", "");
  const ticketKey = userId + "_" + interaction.guild.id;
  const ticketData = tickets.get(ticketKey);

  if (!ticketData) {
    await interaction.reply({ content: "❌ Ticket introuvable.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const transcript = buildTranscript(ticketData);

  try {
    const user = await interaction.client.users.fetch(ticketData.userId);
    await user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔒 Ticket fermé")
          .setDescription(`Ton ticket dans **${interaction.guild.name}** a été fermé.`)
          .addFields(
            { name: "Ouvert le", value: ticketData.createdAt.toLocaleString("fr-FR"), inline: true },
            { name: "Fermé le", value: new Date().toLocaleString("fr-FR"), inline: true }
          )
          .setColor(0xed4245)
          .setTimestamp(),
      ],
    });

    if (transcript) {
      await user.send({ content: `📋 **Transcript de ton ticket:**\n\`\`\`\n${transcript}\n\`\`\`` });
    }
  } catch (err) {
    logger.warn({ err }, "Impossible d'envoyer le DM transcript");
  }

  const ratingRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`rating_${userId}`)
      .setPlaceholder("Évalue le support (1-5 étoiles)")
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel("⭐ 1 étoile").setValue("1"),
        new StringSelectMenuOptionBuilder().setLabel("⭐⭐ 2 étoiles").setValue("2"),
        new StringSelectMenuOptionBuilder().setLabel("⭐⭐⭐ 3 étoiles").setValue("3"),
        new StringSelectMenuOptionBuilder().setLabel("⭐⭐⭐⭐ 4 étoiles").setValue("4"),
        new StringSelectMenuOptionBuilder().setLabel("⭐⭐⭐⭐⭐ 5 étoiles").setValue("5")
      )
  );

  await interaction.channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("📊 Évalue notre support")
        .setDescription("Comment s'est passé ton expérience ?")
        .setColor(0xfee75c),
    ],
    components: [ratingRow],
  });

  tickets.delete(ticketKey);

  setTimeout(async () => {
    try {
      await interaction.channel?.delete();
    } catch {}
  }, 10000);

  await interaction.editReply({ content: "✅ Ticket fermé. Le canal sera supprimé dans 10 secondes." });
}

function buildTranscript(ticketData: { messages: { author: string; content: string; timestamp: Date }[] }): string {
  if (ticketData.messages.length === 0) return "";
  return ticketData.messages
    .map((m) => `[${m.timestamp.toLocaleString("fr-FR")}] ${m.author}: ${m.content}`)
    .join("\n");
}
