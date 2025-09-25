// src/index.js
import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, Events } from 'discord.js';
import { allCommands, commandMap } from './commands/index.js';
import { getGuildState, saveAll, defaultGuildState, loadAll } from './state.js';

const token   = process.env.DISCORD_TOKEN;
const clientId = process.env.APP_ID;
const guildId  = process.env.GUILD_ID;            // optional
const nodeEnv  = process.env.NODE_ENV || 'production';

if (!token || !clientId) {
  console.error('❌ Missing DISCORD_TOKEN or APP_ID environment variables.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = commandMap.get(interaction.commandName);
  if (!cmd) return;

  try {
    // Always fetch/create guild state from DB
    const { state, g } = await getGuildState(interaction.guildId);

    // Safety net: if somehow missing, recreate and persist
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
    const reply = { content: '❌ Oops! Something went wrong.', flags: 64 }; // ephemeral
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

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

(async () => {
  try {
    await loadAll().catch(() => {}); // warm-up (safe no-op with Mongo)
    console.log('⏳ Logging in…');
    await client.login(token);
    registerCommands();              // don’t block startup
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
})();
