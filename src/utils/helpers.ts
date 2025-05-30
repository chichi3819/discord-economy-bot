import { User, UserDocument } from '../models/User.js';
import { AnnouncementModel } from '../models/Announcement.js';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

/**
 * Get or create a user profile
 */
export async function getOrCreateUser(userId: string, guildId: string, username: string): Promise<UserDocument> {
  let user = await User.findOne({ userId, guildId });

  if (!user) {
    user = new User({
      userId,
      guildId,
      username,
      balance: 1000, // Starting balance
      bank: 0,
      level: 1,
      xp: 0,
      totalXp: 0,
      commandsUsed: 0,
      inventory: [],
      lastDaily: null,
      lastWork: null,
      registeredAt: new Date(),
      lastActive: new Date()
    });
    await user.save();
    console.log(`📝 Created new user profile for ${username} (${userId})`);
  }

  return user;
}

/**
 * Check if user is registered
 */
export async function isUserRegistered(userId: string, guildId: string): Promise<boolean> {
  const user = await User.findOne({ userId, guildId });
  return !!user;
}

/**
 * Add XP to user and handle level ups
 */
export async function addXpToUser(userId: string, guildId: string, amount: number): Promise<boolean> {
  const user = await User.findOne({ userId, guildId });
  if (!user) return false;

  const leveledUp = user.addXp(amount);
  await user.save();

  return leveledUp;
}

/**
 * Format currency display
 */
export function formatCurrency(amount: number): string {
  return `💰 ${amount.toLocaleString()} coins`;
}

/**
 * Format time duration
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Check if user is on cooldown
 */
export function isOnCooldown(lastUsed: Date | null, cooldownMs: number): boolean {
  if (!lastUsed) return false;
  return Date.now() - lastUsed.getTime() < cooldownMs;
}

/**
 * Get remaining cooldown time
 */
export function getRemainingCooldown(lastUsed: Date | null, cooldownMs: number): number {
  if (!lastUsed) return 0;
  const remaining = cooldownMs - (Date.now() - lastUsed.getTime());
  return Math.max(0, remaining);
}

/**
 * Generate random number between min and max (inclusive)
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Create error embed
 */
export function createErrorEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#ff0000')
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Create success embed
 */
export function createSuccessEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Create info embed
 */
export function createInfoEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Check and deliver unread announcements to user
 */
export async function checkAndDeliverAnnouncements(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    const undeliveredAnnouncements = await AnnouncementModel.getUndeliveredAnnouncements(interaction.user.id);

    if (undeliveredAnnouncements.length > 0) {
      const announcement = undeliveredAnnouncements[0]; // Get the latest undelivered announcement

      const embed = new EmbedBuilder()
        .setColor('#ffaa00')
        .setTitle('📢 Bot Announcement')
        .setDescription(announcement.content)
        .setTimestamp(announcement.createdAt)
        .setFooter({ text: 'This is an automated announcement from the bot owner.' });

      await interaction.followUp({ embeds: [embed], ephemeral: true });
      await announcement.markAsDelivered(interaction.user.id);
    }
  } catch (error) {
    console.error('Error delivering announcements:', error);
  }
}

/**
 * Get leaderboard data
 */
export async function getLeaderboard(type: 'balance' | 'level' | 'commands', guildId: string, limit: number = 10) {
  let sortField: string;
  let displayField: string;

  switch (type) {
    case 'balance':
      sortField = 'balance';
      displayField = 'balance';
      break;
    case 'level':
      sortField = 'totalXp';
      displayField = 'level';
      break;
    case 'commands':
      sortField = 'commandsUsed';
      displayField = 'commandsUsed';
      break;
  }

  const users = await User.find({ guildId })
    .sort({ [sortField]: -1 })
    .limit(limit)
    .lean();

  return users.map((user, index) => ({
    userId: user.userId,
    username: user.username,
    value: user[displayField as keyof typeof user] as number,
    rank: index + 1
  }));
}