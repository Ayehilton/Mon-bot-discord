import { type Client, REST, Routes } from "discord.js";
import type { ExtendedClient } from "../types.js";
import { logger } from "../../lib/logger.js";

export async function onReady(client: Client) {
  const ext = client as ExtendedClient;
  logger.info(`Bot connecté en tant que ${client.user?.tag}`);

  const token = process.env["DISCORD_TOKEN"]!;
  const clientId = process.env["DISCORD_CLIENT_ID"]!;

  const rest = new REST().setToken(token);

  const commandsData = ext.commands.map((cmd) => cmd.data.toJSON());

  try {
    logger.info(`Enregistrement de ${commandsData.length} commandes slash...`);
    await rest.put(Routes.applicationCommands(clientId), {
      body: commandsData,
    });
    logger.info("Commandes slash enregistrées avec succès.");
  } catch (err) {
    logger.error({ err }, "Erreur lors de l'enregistrement des commandes");
  }
}
