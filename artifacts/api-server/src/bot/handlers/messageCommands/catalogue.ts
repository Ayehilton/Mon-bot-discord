import { type Message, PermissionFlagsBits } from "discord.js";

export interface CatalogueItem {
  id: number;
  name: string;
  bullets: string[];
  price: string | null;
  authorId: string;
  createdAt: Date;
}

const catalogues = new Map<string, CatalogueItem[]>();
let nextId = 1;

const SEP = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
const HEADER = "━━━━━━━━━━ LYGE SHOP ━━━━━━━━━━";

function getList(guildId: string): CatalogueItem[] {
  if (!catalogues.has(guildId)) catalogues.set(guildId, []);
  return catalogues.get(guildId)!;
}

function looksLikePrice(s: string): boolean {
  const lower = s.toLowerCase();
  return (
    lower.includes("€") ||
    lower.includes("$") ||
    lower.includes("ticket") ||
    lower.includes("price") ||
    lower.includes("prix") ||
    /\d+([.,]\d+)?\s*(eur|euro|euros|ctm|cts|cent)/i.test(s)
  );
}

function renderItem(item: CatalogueItem): string {
  const lines: string[] = [];
  lines.push(`**#${item.id}**  •  **${item.name}**`);
  for (const b of item.bullets) {
    lines.push(`➡️ ${b}`);
  }
  if (item.price) {
    lines.push(`🌟  Price: ${item.price}`);
  }
  return lines.join("\n");
}

function renderCatalogue(list: CatalogueItem[]): string[] {
  const parts: string[] = [HEADER];
  for (const item of list) {
    parts.push(SEP);
    parts.push(renderItem(item));
  }
  parts.push(SEP);

  // Split into chunks under 2000 chars (Discord limit)
  const chunks: string[] = [];
  let current = "";
  for (const part of parts) {
    if (current.length + part.length + 2 > 1900) {
      chunks.push(current);
      current = "";
    }
    current += (current ? "\n\n" : "") + part;
  }
  if (current) chunks.push(current);
  return chunks;
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
        await message.reply(
          "❌ Syntaxe : `!catalogue add <nom> | <détail 1> | <détail 2> | <prix>`\n" +
            "Exemple : `!catalogue add Roblox Account | Full access | 10k Robux spent | 50€`",
        );
        return;
      }

      const parts = full.split("|").map((p) => p.trim()).filter((p) => p.length > 0);
      if (parts.length < 2) {
        await message.reply("❌ Il faut au moins un nom et un détail.");
        return;
      }

      const name = parts[0].slice(0, 100);
      let bullets = parts.slice(1).map((p) => p.slice(0, 200));
      let price: string | null = null;

      const last = bullets[bullets.length - 1];
      if (last && looksLikePrice(last)) {
        price = last;
        bullets = bullets.slice(0, -1);
      }

      const list = getList(message.guild.id);
      const item: CatalogueItem = {
        id: nextId++,
        name,
        bullets,
        price,
        authorId: message.author.id,
        createdAt: new Date(),
      };
      list.push(item);

      await message.reply(
        "✅ Produit ajouté :\n\n" + renderItem(item),
      );
      return;
    }
    case "remove":
    case "supprimer":
    case "delete":
    case "del": {
      const isMod = message.member?.permissions.has(PermissionFlagsBits.ManageMessages);
      if (!isMod) {
        await message.reply("🚫 Seuls les modérateurs peuvent supprimer un produit.");
        return;
      }
      const id = parseInt(rest[0] ?? "", 10);
      if (!id) {
        await message.reply("❌ Syntaxe : `!catalogue remove <id>`");
        return;
      }
      const list = getList(message.guild.id);
      const idx = list.findIndex((i) => i.id === id);
      if (idx === -1) {
        await message.reply(`❌ Aucun produit avec l'ID #${id}.`);
        return;
      }
      const removed = list.splice(idx, 1)[0];
      await message.reply(`🗑️ Produit **#${removed.id} — ${removed.name}** supprimé.`);
      return;
    }
    case "clear":
    case "reset": {
      const isAdmin = message.member?.permissions.has(PermissionFlagsBits.Administrator);
      if (!isAdmin) {
        await message.reply("🚫 Seuls les administrateurs peuvent vider le catalogue.");
        return;
      }
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
        await message.reply("📦 Le catalogue est vide.");
        return;
      }
      const chunks = renderCatalogue(list);
      for (const chunk of chunks) {
        await message.channel.send({ content: chunk });
      }
      return;
    }
  }
}
