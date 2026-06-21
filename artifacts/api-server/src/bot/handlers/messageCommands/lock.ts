import {
  type Message,
  PermissionFlagsBits,
  type GuildMember,
  type TextChannel,
  EmbedBuilder,
} from "discord.js";

export async function lockMessage(message: Message): Promise<void> {
  const member = message.member as GuildMember;
  if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    await message.reply("❌ Tu dois avoir la permission **Gérer les salons**.");
    return;
  }

  const channel = message.channel as TextChannel;
  const everyoneRole = message.guild?.roles.everyone;
  if (!everyoneRole) return;

  await channel.permissionOverwrites.edit(everyoneRole, {
    SendMessages: false,
  });

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle("🔒 Salon verrouillé")
    .setDescription("Ce salon a été verrouillé par un administrateur.")
    .setFooter({ text: `Par ${message.author.tag}` })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}

export async function unlockMessage(message: Message): Promise<void> {
  const member = message.member as GuildMember;
  if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    await message.reply("❌ Tu dois avoir la permission **Gérer les salons**.");
    return;
  }

  const channel = message.channel as TextChannel;
  const everyoneRole = message.guild?.roles.everyone;
  if (!everyoneRole) return;

  await channel.permissionOverwrites.edit(everyoneRole, {
    SendMessages: null,
  });

  const embed = new EmbedBuilder()
    .setColor(0x00ff88)
    .setTitle("🔓 Salon déverrouillé")
    .setDescription("Ce salon est de nouveau ouvert.")
    .setFooter({ text: `Par ${message.author.tag}` })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}