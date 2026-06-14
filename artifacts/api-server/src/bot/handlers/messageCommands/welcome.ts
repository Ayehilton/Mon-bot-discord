import {
  type Message,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { guildConfigs } from "../../store.js";

export async function welcomeMessage(message: Message, args: string[]) {
  if (!message.guild) return;

  if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await message.reply("🚫 Permission refusée (Gérer le serveur).");
    return;
  }

  const guildId = message.guild.id;
  const sub = args[0]?.toLowerCase() ?? "help";

  if (sub === "setup" || sub === "salon") {
    const channel = message.mentions.channels.first();
    if (!channel || channel.type !== ChannelType.GuildText) {
      await message.reply("❌ Syntaxe : `!welcome setup #salon`");
      return;
    }
    const config = guildConfigs.get(guildId) ?? {};
    config.welcomeChannelId = channel.id;
    guildConfigs.set(guildId, config);
    await message.reply(`✅ Salon de bienvenue configuré sur ${channel}.`);
    return;
  }

  if (sub === "off" || sub === "disable" || sub === "desactiver") {
    const config = guildConfigs.get(guildId) ?? {};
    delete config.welcomeChannelId;
    guildConfigs.set(guildId, config);
    await message.reply("🔕 Messages de bienvenue désactivés.");
    return;
  }

  if (sub === "test" || sub === "preview") {
    const config = guildConfigs.get(guildId);
    if (!config?.welcomeChannelId) {
      await message.reply(
        "❌ Configure d'abord un salon avec `!welcome setup #salon`.",
      );
      return;
    }
    const channel = await message.guild.channels
      .fetch(config.welcomeChannelId)
      .catch(() => null);
    if (!channel?.isTextBased()) {
      await message.reply("❌ Salon de bienvenue introuvable.");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("👋 Bienvenue !")
      .setDescription(
        `Salut <@${message.author.id}> ! Bienvenue sur **${message.guild.name}** 🎉\n\n` +
          "Lis les règles avec `!rules` et découvre notre boutique avec `!catalogue` !",
      )
      .setThumbnail(message.author.displayAvatarURL({ size: 256 }))
      .setColor(0x57f287)
      .addFields(
        { name: "👤 Membre", value: message.author.username, inline: true },
        {
          name: "📊 Membres",
          value: `${message.guild.memberCount}`,
          inline: true,
        },
      )
      .setFooter({ text: `${message.guild.name}` })
      .setTimestamp();

    await channel.send({
      content: `<@${message.author.id}>`,
      embeds: [embed],
    });
    await message.reply("✅ Test envoyé.");
    return;
  }

  await message.reply(
    "**Commandes welcome :**\n" +
      "`!welcome setup #salon` — Définir le salon de bienvenue\n" +
      "`!welcome test` — Tester le message\n" +
      "`!welcome off` — Désactiver",
  );
}
