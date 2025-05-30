import { Events, ActivityType } from 'discord.js';
import { ExtendedClient } from '../types/index.js';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: ExtendedClient) {
    console.log(`🚀 ${client.user?.tag} is online and ready!`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds`);

    // Set bot activity
    client.user?.setActivity('the economy | /help', {
      type: ActivityType.Watching
    });

    // Log some statistics
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    console.log(`👥 Total members across all guilds: ${totalUsers}`);

    console.log('📝 Bot is fully initialized and ready to receive commands!');
  },
};