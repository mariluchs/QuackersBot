// src/index.js
import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Events,
} from 'discord.js';
import { allCommands, commandMap } from './commands/index.js';
import {
  getGuildState,
  saveAll,
  defaultGuildState,
  loadAll,
  upsertGuildInfo,
  deleteGuildInfo,
} from './state.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.APP_ID;
const guildId = process.env.GUILD_ID || null;
const nodeEnv = process.env.NODE_ENV || 'production';

if (!token || !clientId) {
  console.error('❌ Missing DISCORD_TOKEN or APP_ID environment variables.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  // ✅ Log all guilds at startup
  console.log('🌐 Connected guilds:');
  for (const guild of client.guilds.cache.values()) {
    console.log(`- ${guild.name} (${guild.id}) with ${guild.memberCount} members`);
    await upsertGuildInfo(guild); // persist to DB
  }
});

// --- Guild Join / Leave Logging ---
client.on(Events.GuildCreate, async guild => {
  console.log(`➕ Joined new guild: ${guild.name} (${guild.id}) with ${guild.memberCount ?? '??'} members`);
  await upsertGuildInfo(guild);
});

client.on(Events.GuildDelete, async guild => {
  console.log(`➖ Removed from guild: ${guild.name} (${guild.id})`);
  await deleteGuildInfo(guild.id);
});

// --- INTERACTIONS ---
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = commandMap.get(interaction.commandName);
  if (!cmd) return;

  try {
    const { state, g } = await getGuildState(interaction.guildId);

    let guildState = g;
    if (!guildState || typeof guildState !== 'object') {
      guildState = defaultGuildState();
      state[interaction.guildId] = guildState;
      await saveAll(state);
      console.log(`[state] Recreated missing state for guild ${interaction.guildId}`);
    }

    await cmd.execute(interaction, guildState, state);
    await saveAll(state);
  } catch (err) {
    console.error(`[${interaction.commandName}]`, err);
    const reply = { content: '❌ Oops! Something went wrong.', flags: 64 };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

// --- SLASH COMMAND REGISTRATION ---
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(token);
  const body = allCommands.map(c =>
    typeof c.data?.toJSON === 'function' ? c.data.toJSON() : c.data
  );

  try {
    console.log('🔧 Registering slash commands...');
    await rest.put(Routes.applicationCommands(clientId), { body });
    console.log('✅ Global slash commands registered.');

    if (guildId && nodeEnv === 'development') {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
      console.log(`✅ Guild slash commands registered for ${guildId}`);
    }
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
  }
}

// --- REMINDER LOOP ---
async function startReminderLoop(client, { intervalMs = 60_000 } = {}) {
  async function tick() {
    try {
      const state = await loadAll();
      const now = Date.now();

      for (const [guildId, g] of Object.entries(state)) {
        if (!g?.reminderRoleId || !g?.reminderChannelId) continue;

        g.lastFedAt ??= 0;
        g.cooldownMs ??= 2 * 60 * 60 * 1000; // 2h default

        const delta = now - g.lastFedAt;

        // Decide reminder stage
        let stage = null;
        if (delta >= g.cooldownMs && !g.hungryReminded) {
          stage = 'hungry';
        }
        if (delta >= 2 * g.cooldownMs && !g.starvingReminded) {
          stage = 'starving';
        }

        if (!stage) continue;

        // Resolve guild + channel
        const guild = client.guilds.cache.get(guildId) ||
          (await client.guilds.fetch(guildId).catch(() => null));
        if (!guild) continue;

        const channel = guild.channels.cache.get(g.reminderChannelId) ||
          (await guild.channels.fetch(g.reminderChannelId).catch(() => null));
        if (!channel?.isTextBased()) continue;

        // --- Custom emojis from utils/emojis.js ---
        const { EMOJIS } = await import('./utils/emojis.js');
        let content;

        if (stage === 'hungry') {
          content = `<@&${g.reminderRoleId}> Quackers is hungry! ${EMOJIS.feed}`;
          g.hungryReminded = true;
        } else if (stage === 'starving') {
          content = `<@&${g.reminderRoleId}> Quackers is STARVING!! ${EMOJIS.mood.sad}`;
          g.starvingReminded = true;
        }

        await channel.send({
          content,
          allowedMentions: { roles: [g.reminderRoleId] },
        }).catch(() => null);
      }

      await saveAll(state);
    } catch (e) {
      console.error('[reminder loop]', e);
    }
  }

  setInterval(tick, intervalMs);
  setTimeout(tick, 5_000);
}


// --- STARTUP ---
(async () => {
  try {
    await loadAll().catch(() => {});
    console.log('⏳ Logging in…');
    await client.login(token);
    registerCommands();
    startReminderLoop(client);
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
})();
