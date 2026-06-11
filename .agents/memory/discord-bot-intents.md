---
name: Discord bot privileged intents
description: Pattern pour gérer les intents privilégiés Discord sans bloquer le démarrage
---

Discord privileged intents (GuildMembers, MessageContent, GuildPresences) doivent être activés manuellement dans le portail développeur Discord → Bot → Privileged Gateway Intents. Si le bot essaie de les utiliser sans activation, il reçoit "Used disallowed intents" et ne démarre pas.

**Why:** Le bot doit démarrer même si l'utilisateur n'a pas encore configuré les intents privilégiés dans le portail Discord.

**How to apply:** Rendre les intents privilégiés conditionnels via des variables d'env (ex: `DISCORD_INTENT_MEMBERS=true`). Le bot démarre avec les intents de base, et les fonctionnalités avancées (anti-spam par contenu, comptage présence) se débloquent quand les env vars sont activées.
