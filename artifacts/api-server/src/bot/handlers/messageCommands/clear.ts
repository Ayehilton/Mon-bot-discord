import { type Message, PermissionFlagsBits } from "discord.js";

export async function clearMessage(message: Message, args: string[]) {
  if (!message.guild || !message.channel.isTextBased()) return;

  if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
    await message.reply("❌ Tu n'as pas la permission de supprimer des messages.");
    return;
  }

  const amount = parseInt(args[0] ?? "0");

  if (!amount || amount < 1 || amount > 100) {
    await message.reply("❌ Usage: `!clear <nombre>` (entre 1 et 100)");
    return;
  }

  try {
    if (!("bulkDelete" in message.channel)) {
      await message.reply("❌ Impossible de supprimer des messages dans ce salon.");
      return;
    }

    await message.delete();
    const deleted = await message.channel.bulkDelete(amount, true);

    const confirm = await message.channel.send(
      `🗑️ **${deleted.size}** message${deleted.size > 1 ? "s" : ""} supprimé${deleted.size > 1 ? "s" : ""}.`
    );

    setTimeout(() => confirm.delete().catch(() => {}), 4000);
  } catch {
    await message.channel.send("❌ Erreur : les messages de plus de 14 jours ne peuvent pas être supprimés en masse.").then(
      (m) => setTimeout(() => m.delete().catch(() => {}), 5000)
    );
  }
}
