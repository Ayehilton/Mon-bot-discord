import { type Message, PermissionFlagsBits } from "discord.js";

export async function sayMessage(message: Message, args: string[]) {
  const isMod = message.member?.permissions.has(PermissionFlagsBits.ManageMessages);
  if (!isMod) {
    await message.reply("🚫 Seuls les modérateurs peuvent utiliser `!say`.");
    return;
  }

  const text = args.join(" ").trim();
  if (!text) {
    await message.reply("❌ Syntaxe : `!say <ton message>`");
    return;
  }
  if (text.length > 2000) {
    await message.reply("❌ Message trop long (max 2000 caractères).");
    return;
  }

  try { await message.delete(); } catch {}

  await message.channel.send({
    content: text,
    allowedMentions: { parse: [] },
  });
}
