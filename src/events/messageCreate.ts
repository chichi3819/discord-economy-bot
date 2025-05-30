import { Events, Message } from 'discord.js';
import { AnnouncementModel } from '../models/Announcement.js';
import { randomUUID } from 'node:crypto';

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Check if message is in announcement channel
    const announcementChannelId = process.env.ANNOUNCEMENT_CHANNEL_ID;
    if (!announcementChannelId || message.channel.id !== announcementChannelId) return;

    // Check if author is bot owner
    const botOwnerId = process.env.BOT_OWNER_ID;
    if (message.author.id !== botOwnerId) return;

    try {
      // Create announcement from message content
      const announcement = new AnnouncementModel({
        id: randomUUID(),
        content: message.content,
        authorId: message.author.id,
        createdAt: new Date(),
        isActive: true,
        deliveredTo: []
      });

      await announcement.save();

      // React to the message to confirm announcement creation
      await message.react('📢');
      await message.react('✅');

      console.log(`📢 Auto-announcement created from channel message: "${message.content.substring(0, 50)}..."`);

    } catch (error) {
      console.error('Error creating auto-announcement:', error);

      // React with error emoji
      await message.react('❌').catch(() => {});
    }
  },
};