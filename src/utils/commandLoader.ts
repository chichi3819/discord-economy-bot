import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ExtendedClient, Command } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client: ExtendedClient): Promise<void> {
  const commandsPath = join(__dirname, '../commands');
  const commandCategories = ['economy', 'admin', 'general'];

  let loadedCount = 0;

  for (const category of commandCategories) {
    const categoryPath = join(commandsPath, category);

    try {
      const commandFiles = readdirSync(categoryPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

      for (const file of commandFiles) {
        const filePath = join(categoryPath, file);

        try {
          const commandModule = await import(`file://${filePath}`);
          const command: Command = commandModule.default || commandModule;

          if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            loadedCount++;
            console.log(`📄 Loaded command: ${command.data.name} (${category})`);
          } else {
            console.warn(`⚠️ Command at ${filePath} is missing required "data" or "execute" property`);
          }
        } catch (error) {
          console.error(`❌ Error loading command ${file}:`, error);
        }
      }
    } catch (error) {
      // Category directory might not exist yet
      console.log(`📁 Category directory ${category} not found, skipping...`);
    }
  }

  console.log(`✅ Loaded ${loadedCount} commands successfully`);
}