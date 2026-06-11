# LJI Market Bot

Bot Discord complet avec tickets, évaluations, giveaways, modération et statistiques.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — démarrer le serveur + bot Discord (port 5000)
- `pnpm run typecheck` — typecheck complet
- `pnpm run build` — typecheck + build

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Discord: discord.js v14
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/bot/` — tout le code Discord
  - `index.ts` — démarrage du client Discord
  - `store.ts` — état en mémoire (tickets, giveaways, spam, warns)
  - `commands/` — commandes slash (ticket, giveaway, mod, stats, evaluation)
  - `events/` — events Discord (ready, interactionCreate, messageCreate, guildMemberAdd)
  - `handlers/` — logique métier (ticketHandler, ratingHandler, giveawayHandler, commandLoader)

## Architecture decisions

- Le bot tourne dans le même process que le serveur Express pour simplifier le déploiement.
- L'état (tickets, giveaways, warns) est en mémoire — réinitialisé au redémarrage. Pour persister, brancher la DB Drizzle.
- Les intents privilégiés (GuildMembers, MessageContent, GuildPresences) sont opt-in via variables d'env pour ne pas bloquer le démarrage si non activés dans le portail Discord.
- Anti-spam détecte 5 messages en 5 secondes → mute 5 min via `member.timeout()`.

## Fonctionnalités

- **Tickets** : `/ticket setup` crée un panneau, ouverture/fermeture automatique, transcript en DM, évaluation à la fermeture
- **Évaluations** : menu 1-5 étoiles, panneau `/evaluation panel`, résultats `/evaluation resultats`
- **Giveaways** : `/giveaway start/end/reroll/list`, participation via bouton, tirage automatique
- **Modération** : `/mod mute/unmute/kick/ban/warn/warns/clearwarn`
- **Stats** : `/stats serveur/utilisateur/support`
- **Anti-spam** : mute auto 5 min si 5+ messages en 5 secondes

## Secrets requis

- `DISCORD_TOKEN` — Token du bot
- `DISCORD_CLIENT_ID` — Application ID

## Variables d'env optionnelles (intents privilégiés)

Activer dans le Portail Discord → Bot → Privileged Gateway Intents, puis setEnvVars:
- `DISCORD_INTENT_MEMBERS=true` — Server Members Intent (pour stats membres)
- `DISCORD_INTENT_PRESENCE=true` — Presence Intent (pour compter les membres en ligne)
- `DISCORD_INTENT_MESSAGES=true` — Message Content Intent (pour anti-spam par contenu)

## Gotchas

- Les intents privilégiés doivent être activés dans le portail développeur Discord ET dans les env vars
- Le bot doit avoir les permissions `Manage Channels`, `Moderate Members`, `Kick Members`, `Ban Members` sur le serveur
- Pour l'anti-spam complet (contenu du message), activer `DISCORD_INTENT_MESSAGES=true`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._
