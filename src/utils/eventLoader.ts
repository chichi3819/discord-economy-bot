import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ExtendedClient } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadEvents(client: ExtendedClient): Promise<void> {
  const eventsPath = join(__dirname, '../events');

  try {
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

    let loadedCount = 0;

    for (const file of eventFiles) {
      const filePath = join(eventsPath, file);

      try {
        const eventModule = await import(`file://${filePath}`);
        const event = eventModule.default || eventModule;

        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args));
        } else {
          client.on(event.name, (...args) => event.execute(...args));
        }

        loadedCount++;
        console.log(`🎫 Loaded event: ${event.name}`);
      } catch (error) {
        console.error(`❌ Error loading event ${file}:`, error);
      }
    }

    console.log(`✅ Loaded ${loadedCount} events successfully`);
  } catch (error) {
    console.log(`📁 Events directory not found, skipping events...`);
  }
}