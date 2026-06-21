import { type Message, PermissionFlagsBits, type GuildMember, type TextChannel } from "discord.js";

export async function slowmodeMessage(message: Message, args: string[]): Promise<void> {
  const member = message.member as GuildMember;
  if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    await message.reply("❌ Tu dois avoir la permission **Gérer les salons**.");
    return;
  }

  const secondes = parseInt(args[0] ?? "0");
  if (isNaN(secondes) || secondes < 0 || secondes > 21600) {
    await message.reply("❌ Usage : `!slowmode <secondes>` (0 pour désactiver, max 21600)");
    return;
  }

  const channel = message.channel as TextChannel;
  await channel.setRateLimitPerUser(secondes);

  if (secondes === 0) {
    await message.reply("✅ Slowmode **désactivé** dans ce salon.");
  } else {
    await message.reply(`✅ Slowmode réglé sur **${secondes} secondes** dans ce salon.`);
  }
}