import {
  type Message,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ButtonInteraction,
  type GuildMember,
  PermissionFlagsBits,
} from "discord.js";

const ROLE_NAME = "Restock";

export async function restockNotifMessage(message: Message): Promise<void> {
  if (!message.guild) {
    await message.reply("❌ Cette commande doit être utilisée dans un serveur.");
    return;
  }

  const member = message.member as GuildMember;
  if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
    await message.reply("❌ Tu dois être **administrateur** pour utiliser cette commande.");
    return;
  }

  const restockRole = message.guild.roles.cache.find((r) => r.name === ROLE_NAME);
  if (!restockRole) {
    await message.reply(`❌ Le rôle **${ROLE_NAME}** est introuvable.\nCrée-le dans **Paramètres du serveur → Rôles** puis réessaie.`);
    return;
  }

  await message.delete().catch(() => {});

  const embed = new EmbedBuilder()
    .setColor(0x00ff88)
    .setTitle("🔔 Notifications Restock")
    .setDescription(
      "Tu veux être notifié dès qu'un produit est de nouveau dispo ?\n\n" +
      `✅ **Clique une fois** → Tu reçois le rôle <@&${restockRole.id}>\n` +
      `🔕 **Reclique** → Tu retires le rôle\n\n` +
      `*Les membres avec ce rôle sont pingés à chaque restock.*`
    )
    .setFooter({ text: "Clique pour activer / désactiver les notifs" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("toggle_restock_role")
      .setLabel("🔔 Recevoir les notifs Restock")
      .setStyle(ButtonStyle.Success)
  );

  await message.channel.send({ embeds: [embed], components: [row] });
}

export async function handleRestockButton(interaction: ButtonInteraction): Promise<void> {
  const guild = interaction.guild;
  if (!guild) return;

  const member = interaction.member as GuildMember;
  const restockRole = guild.roles.cache.find((r) => r.name === ROLE_NAME);

  if (!restockRole) {
    await interaction.reply({ content: `❌ Le rôle **${ROLE_NAME}** est introuvable.`, ephemeral: true });
    return;
  }

  const hasRole = member.roles.cache.has(restockRole.id);

  if (hasRole) {
    await member.roles.remove(restockRole);
    await interaction.reply({ content: "🔕 Tu ne recevras **plus** les notifications de restock.", ephemeral: true });
  } else {
    await member.roles.add(restockRole);
    await interaction.reply({ content: `🔔 Tu recevras désormais les **notifications de restock** !`, ephemeral: true });
  }
}