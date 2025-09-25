// src/index.js
import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, Events } from 'discord.js';
import { allCommands, commandMap } from './commands/index.js';
import { loadAll } from './state.js';

// --- Load env variables ---
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.APP_ID;
const guildId = process.env.GUILD_ID; // optional
const nodeEnv = process.env.NODE_ENV || 'development';

// --- Create client ---
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// --- Register slash commands ---
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('🔧 Registering slash commands...');

    // Always register global commands
    await rest.put(Routes.applicationCommands(clientId), { body: allCommands.map(c => c.data) });
    console.log('✅ Global slash commands registered.');

    // Register guild commands only if GUILD_ID is set and in dev mode
    if (guildId && nodeEnv === 'development') {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: allCommands.map(c => c.data),
      });
      console.log(`✅ Guild slash commands registered for ${guildId}`);
    }
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
}

// --- On ready ---
client.once(Events.ClientReady, () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

// --- Handle interactions ---
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = commandMap.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (error) {
    console.error(`[${interaction.commandName}]`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: '❌ Oops! Something went wrong.',
        flags: 64, // ephemeral
      });
    } else {
      await interaction.reply({
        content: '❌ Oops! Something went wrong.',
        flags: 64,
      });
    }
  }
});

// --- Start bot ---
(async () => {
  await registerCommands();
  await loadAll(); // preload state
  client.login(token);
})();
