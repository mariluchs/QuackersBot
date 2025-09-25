// src/index.js
import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, Events } from 'discord.js';
import { allCommands, commandMap } from './commands/index.js';
import { getGuildState, saveAll, defaultGuildState, loadAll } from './state.js';

// --- ENV ---
const token    = process.env.DISCORD_TOKEN;
const clientId = process.env.APP_ID;
const guildId  = process.env.GUILD_ID || null;     // optional (dev)
const nodeEnv  = process.env.NODE_ENV || 'production';

if (!token || !clientId) {
  console.error('❌ Missing DISCORD_TOKEN or APP_ID environment variables.');
  process.exit(1);
}

// --- CLIENT ---
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once(Events.ClientReady, () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

// --- INTERACTIONS ---
client.on(Events.InteractionCreate, async (interaction) => {
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
    const reply = { content: '❌ Oops! Something went wrong.', ephemeral: true };
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
    (typeof c.data?.toJSON === 'function' ? c.data.toJSON() : c.data)
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

        g.lastReminderAt   ??= 0;
        g.reminderEveryMs  ??= 30 * 60 * 1000; // 30 min default
        g.cooldownMs       ??= 2 * 60 * 60 * 1000; // 2h default
        g.lastFedAt        ??= now - 3 * 60 * 60 * 1000;

        const overdue   = (now - g.lastFedAt) > g.cooldownMs;
        const canRemind = (now - g.lastReminderAt) > g.reminderEveryMs;

        if (!overdue || !canRemind) continue;

        const guild = client.guilds.cache.get(guildId)
          || await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) continue;

        const channel = guild.channels.cache.get(g.reminderChannelId)
          || await guild.channels.fetch(g.reminderChannelId).catch(() => null);
        if (!channel?.isTextBased()) continue;

        await channel.send({
          content: `<@&${g.reminderRoleId}> Quackers needs food!`,
          allowedMentions: { roles: [g.reminderRoleId] },
        }).catch(() => null);

        g.lastReminderAt = now;

        // 🕒 React to the last feed message if available
        if (g.lastFeedMessageId && g.lastFeedChannelId) {
          try {
            const feedChannel = guild.channels.cache.get(g.lastFeedChannelId)
              || await guild.channels.fetch(g.lastFeedChannelId).catch(() => null);
            const feedMsg = feedChannel
              ? await feedChannel.messages.fetch(g.lastFeedMessageId).catch(() => null)
              : null;

            if (feedMsg) {
              await feedMsg.react('⏰').catch(() => null);
              // clear so it only reacts once per feed
              g.lastFeedMessageId = null;
              g.lastFeedChannelId = null;
            }
          } catch {
            // ignore silently
          }
        }
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
