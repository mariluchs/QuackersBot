// src/index.js
import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, Events } from 'discord.js';
import { commandsJSON, commandMap } from './commands/index.js';
import { loadAll, getGuildState, saveAll } from './state.js';

const token    = process.env.DISCORD_TOKEN;
const clientId = process.env.APP_ID;
const guildId  = process.env.GUILD_ID; // optional
const nodeEnv  = process.env.NODE_ENV || 'development';

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
    // Load or create guild state and pass it to the command
    const { state, g } = await getGuildState(interaction.guildId);

    await cmd.execute(interaction, g, state);

    // Persist any changes the command made
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
  try {
    console.log(`🔧 Registering slash commands (env=${nodeEnv}, guildId=${guildId ? 'set' : 'not set'})…`);
    // Global commands
    await rest.put(Routes.applicationCommands(clientId), { body: commandsJSON });
    console.log('✅ Global slash commands registered.');

    // Optional: dev-only guild registration
    if (guildId && nodeEnv === 'development') {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandsJSON });
      console.log(`✅ Guild slash commands registered for ${guildId}.`);
    }
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
  }
}

(async () => {
  try {
    await loadAll().catch(() => {}); // safe no-op preload for Mongo version
    console.log('⏳ Logging in…');
    await client.login(token);       // login first so we see presence immediately
    registerCommands();              // don’t block startup on registration
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
})();
