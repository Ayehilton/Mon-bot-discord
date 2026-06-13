typescript
import { type Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export interface CatalogueItem {
  id: number;
  name: string;
  description: string;
  authorId: string;
  createdAt: Date;
}

const catalogues = new Map<string, CatalogueItem[]>();
let nextId = 1;

function getList(guildId: string): CatalogueItem[] {
  if (!catalogues.has(guildId)) catalogues.set(guildId, []);
  return catalogues.get(guildId)!;
}

export async function catalogueMessage(message: Message, args: string[]) {
  if (!message.guild) return;

  const sub = (args[0] ?? "list").toLowerCase();
  const rest = args.slice(1);

  switch (sub) {
    case "add":
    case "ajouter":
    case "ajoute": {
      const full = rest.join(" ").trim();
      if (!full || !full.includes("|")) {
        await message.reply("❌ Syntaxe : `!catalogue add <nom> | <description>`\nExemple : `!catalogue add iPhone 15 Pro | Comme neuf, 800€ négociable`");
        return;
      }
      const [rawName, ...descParts] = full.split("|");
      const name = rawName.trim().slice(0, 100);
      const description = descParts.join("|").trim().slice(0, 500);
      if (!name || !description) {
        await message.reply("❌ Il faut un **nom** et une **description** séparés par `|`.");
        return;
      }
      const list = getList(message.guild.id);
      const item: CatalogueItem = { id: nextId++, name, description, authorId: message.author.id, createdAt: new Date() };
      list.push(item);
      const embed = new EmbedBuilder()
        .setTitle("✅ Produit ajouté au catalogue")
        .setColor(0x57f287)
        .addFields(
          { name: "🆔 ID", value: `#${item.id}`, inline: true },
          { name: "📦 Nom", value: item.name, inline: true },
          { name: "📝 Description", value: item.description },
        )
        .setFooter({ text: `Ajouté par ${message.author.username} • !catalogue pour tout voir` })
        .setTimestamp();
      await message.reply({ embeds: [embed] });
      return;
    }
    case "remove":
    case "supprimer":
    case "delete":
    case "del": {
      const isMod = message.member?.permissions.has(PermissionFlagsBits.ManageMessages);
      if (!isMod) { await message.reply("🚫 Seuls les modérateurs peuvent supprimer un produit."); return; }
      const id = parseInt(rest[0] ?? "", 10);
      if (!id) { await message.reply("❌ Syntaxe : `!catalogue remove <id>`"); return; }
      const list = getList(message.guild.id);
      const idx = list.findIndex((i) => i.id === id);
      if (idx === -1) { await message.reply(`❌ Aucun produit avec l'ID #${id}.`); return; }
      const removed = list.splice(idx, 1)[0];
      await message.reply(`🗑️ Produit **#${removed.id} — ${removed.name}** supprimé du catalogue.`);
      return;
    }
    case "clear":
    case "reset": {
      const isAdmin = message.member?.permissions.has(PermissionFlagsBits.Administrator);
      if (!isAdmin) { await message.reply("🚫 Seuls les administrateurs peuvent vider le catalogue."); return; }
      catalogues.set(message.guild.id, []);
      await message.reply("🗑️ Catalogue vidé.");
      return;
    }
    case "list":
    case "voir":
    case "show":
    default: {
      const list = getList(message.guild.id);
      if (list.length === 0) {
        await message.reply("📦 Le catalogue est vide.\nAjoute un produit : `!catalogue add <nom> | <description>`");
        return;
      }
      const items = list.slice(-25);
      const embed = new EmbedBuilder()
        .setTitle(`📦 Catalogue — ${message.guild.name}`)
        .setColor(0x5865f2)
        .setDescription(`**${list.length}** produit(s) disponible(s).\nAjouter : \`!catalogue add <nom> | <desc>\``)
        .addFields(items.map((i) => ({ name: `#${i.id} — ${i.name}`, value: i.description.slice(0, 200) })))
        .setFooter({ text: list.length > 25 ? `Affichage des 25 derniers / ${list.length} total` : `${list.length} produit(s) • !catalogue add pour ajouter` })
        .setTimestamp();
      await message.channel.send({ embeds: [embed] });
      return;
    }
  }
}
