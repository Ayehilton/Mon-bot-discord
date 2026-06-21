import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelType,
  MessageFlags,
} from "discord.js";
import { tickets } from "../store.js";
import { logger } from "../../lib/logger.js";

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: number }> = {
  remboursement: { label: "Demande de remboursement", emoji: "💸", color: 0xed4245 },
  achat: { label: "Passer une commande / Achat", emoji: "🛒", color: 0x57f287 },
  probleme: { label: "Signaler un problème", emoji: "⚠️", color: 0xfee75c },
  autre: { label: "Autre demande", emoji: "💬", color: 0x5865f2 },
};

// Génère un ID de commande unique
function generateCommandeId(): string {
  return `CMD-${Date.now().toString(36).toUpperCase()}`;
}

export async function handleTicketButton(interaction: ButtonInteraction) {
  if (interaction.customId === "ticket_open") {
    await showCategoryMenu(interaction);
  } else if (interaction.customId.startsWith("ticket_close_")) {
    await closeTicket(interaction);
  } else if (interaction.customId.startsWith("ticket_claim_")) {
    await claimTicket(interaction);
  }
}

export async function handleTicketCategorySelect(
  interaction: StringSelectMenuInteraction
) {
  if (!interaction.customId.startsWith("ticket_category_")) return;
  const category = interaction.values[0] ?? "autre";
  await openTicket(interaction, category);
}

async function showCategoryMenu(interaction: ButtonInteraction) {
  if (!interaction.guild) return;

  const existing = tickets.get(interaction.user.id + "_" + interaction.guild.id);
  if (existing) {
    await interaction.reply({
      content: `❌ Tu as déjà un ticket ouvert: <#${existing.channelId}>`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`ticket_category_${interaction.user.id}`)
      .setPlaceholder("Sélectionne la raison de ton ticket")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("💸 Demande de remboursement")
          .setDescription("Tu souhaites être remboursé pour une commande")
          .setValue("remboursement"),
        new StringSelectMenuOptionBuilder()
          .setLabel("🛒 Passer une commande / Achat")
          .setDescription("Tu veux acheter un produit ou un service")
          .setValue("achat"),
        new StringSelectMenuOptionBuilder()
          .setLabel("⚠️ Signaler un problème")
          .setDescription("Tu as rencontré un problème avec ta commande")
          .setValue("probleme"),
        new StringSelectMenuOptionBuilder()
          .setLabel("💬 Autre demande")
          .setDescription("Toute autre question ou demande")
          .setValue("autre")
      )
  );

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("🎫 Ouvrir un ticket")
        .setDescription("Pour quelle raison ouvres-tu ce ticket ?")
        .setColor(0x5865f2),
    ],
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}

async function openTicket(
  interaction: StringSelectMenuInteraction,
  category: string
) {
  if (!interaction.guild) return;

  const existing = tickets.get(interaction.user.id + "_" + interaction.guild.id);
  if (existing) {
    await interaction.reply({
      content: `❌ Tu as déjà un ticket ouvert: <#${existing.channelId}>`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const cat = CATEGORY_LABELS[category] ?? CATEGORY_LABELS["autre"]!;

  // Génère un ID de commande uniquement pour les tickets d'achat
  const commandeId = category === "achat" ? generateCommandeId() : null;

  try {
    const channel = await interaction.guild.channels.create({
      name: `${cat.emoji}-${interaction.user.username}`,
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

    const ticketKey = interaction.user.id + "_" + interaction.guild.id;
    const ticketData = {
      channelId: channel.id,
      userId: interaction.user.id,
      guildId: interaction.guild.id,
      createdAt: new Date(),
      reason: cat.label,
      category,
      commandeId: commandeId ?? undefined,
      messages: [] as { author: string; content: string; timestamp: Date }[],
    };

    tickets.set(ticketKey, ticketData);
    tickets.set("chan_" + channel.id, ticketData);

    // Embed principal du ticket
    const embedFields: { name: string; value: string; inline?: boolean }[] = [
      { name: "Catégorie", value: `${cat.emoji} ${cat.label}`, inline: true },
    ];

    // ✅ Si c'est un ticket achat → affiche l'ID de commande
    if (commandeId) {
      embedFields.push({
        name: "🆔 ID de commande",
        value: `\`${commandeId}\``,
        inline: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`${cat.emoji} ${cat.label}`)
      .setDescription(
        `Bienvenue <@${interaction.user.id}> !\n\nExplique ton problème avec le plus de détails possible, un membre du staff te répondra rapidement.` +
        (commandeId ? `\n\n📦 Ton **ID de commande** est \`${commandeId}\` — garde-le précieusement !` : "")
      )
      .addFields(embedFields)
      .setColor(cat.color)
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_claim_${interaction.user.id}`)
        .setLabel("Claim")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🛎️"),
      new ButtonBuilder()
        .setCustomId(`ticket_close_${interaction.user.id}`)
        .setLabel("Fermer le ticket")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔒")
    );

    await channel.send({
      content: `<@${interaction.user.id}>`,
      embeds: [embed],
      components: [row],
    });

    await interaction.editReply({ content: `✅ Ticket créé: <#${channel.id}>` });
  } catch (err) {
    logger.error({ err }, "Erreur création ticket");
    await interaction.editReply({ content: "❌ Impossible de créer le ticket. Vérifie les permissions du bot." });
  }
}

async function claimTicket(interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.channel || !interaction.message) return;

  const isMod = interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages);
  if (!isMod) {
    await interaction.reply({
      content: "🚫 Ce bouton est réservé au staff.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const userId = interaction.customId.replace("ticket_claim_", "");

  const newRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_claimed_${interaction.user.id}`)
      .setLabel(`Pris par ${interaction.user.username}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("✋")
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`ticket_close_${userId}`)
      .setLabel("Fermer le ticket")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🔒")
  );

  try {
    await interaction.message.edit({ components: [newRow] });
  } catch (err) {
    logger.warn({ err }, "Impossible de mettre à jour les boutons du ticket");
  }

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("🛎️ Ticket pris en charge")
        .setDescription(`<@${interaction.user.id}> s'occupe désormais de ce ticket.`)
        .setColor(0x57f287)
        .setTimestamp(),
    ],
  });
}

async function closeTicket(interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.channel) return;

  await interaction.deferReply({ ephemeral: true });

  const userId = interaction.customId.replace("ticket_close_", "");
  const ticketKey = userId + "_" + interaction.guild.id;
  const chanKey = "chan_" + interaction.channel.id;

  const ticketData = tickets.get(ticketKey) ?? tickets.get(chanKey);
  const transcript = ticketData ? buildTranscript(ticketData) : "";

  if (ticketData) {
    try {
      const user = await interaction.client.users.fetch(ticketData.userId);
      await user.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🔒 Ticket fermé")
            .setDescription(`Ton ticket dans **${interaction.guild.name}** a été fermé.`)
            .addFields(
              { name: "Catégorie", value: ticketData.reason ?? "Support", inline: true },
              ...(ticketData.commandeId ? [{ name: "🆔 ID Commande", value: `\`${ticketData.commandeId}\``, inline: true }] : []),
              { name: "Ouvert le", value: ticketData.createdAt.toLocaleString("fr-FR"), inline: true },
              { name: "Fermé le", value: new Date().toLocaleString("fr-FR"), inline: true },
            )
            .setColor(0xed4245)
            .setTimestamp(),
        ],
      });

      if (transcript) {
        await user.send({
          content: `📋 **Transcript de ton ticket:**\n\`\`\`\n${transcript.slice(0, 1900)}\n\`\`\``,
        });
      }
    } catch (err) {
      logger.warn({ err }, "Impossible d'envoyer le DM transcript");
    }

    tickets.delete(ticketKey);
    tickets.delete(chanKey);
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
        .setDescription("Comment s'est passée ton expérience ? (optionnel)")
        .setColor(0xfee75c),
    ],
    components: [ratingRow],
  });

  await interaction.editReply({
    content: "✅ Ticket fermé. Le canal sera supprimé dans 10 secondes.",
  });

  setTimeout(async () => {
    try {
      await interaction.channel?.delete("Ticket fermé");
    } catch {}
  }, 10000);
}

function buildTranscript(ticketData: {
  messages: { author: string; content: string; timestamp: Date }[];
}): string {
  if (!ticketData.messages || ticketData.messages.length === 0) return "";
  return ticketData.messages
    .map(
      (m) =>
        `[${m.timestamp.toLocaleString("fr-FR")}] ${m.author}: ${m.content}`
    )
    .join("\n");
}
