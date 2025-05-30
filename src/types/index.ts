import { Collection, SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';

export interface ExtendedClient extends Client {
  commands: Collection<string, Command>;
  cooldowns: Collection<string, Collection<string, number>>;
}

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  category: 'economy' | 'admin' | 'general';
  cooldown?: number;
  requiresRegistration?: boolean;
}

export interface UserProfile {
  userId: string;
  guildId: string;
  username: string;
  balance: number;
  bank: number;
  level: number;
  xp: number;
  totalXp: number;
  commandsUsed: number;
  inventory: InventoryItem[];
  lastDaily: Date | null;
  lastWork: Date | null;
  registeredAt: Date;
  lastActive: Date;
}

export interface InventoryItem {
  itemId: string;
  name: string;
  quantity: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  value: number;
}

export interface Announcement {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  isActive: boolean;
  deliveredTo: string[];
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  value: number;
  rank: number;
}

export interface EconomyConfig {
  dailyRewardMin: number;
  dailyRewardMax: number;
  workRewardMin: number;
  workRewardMax: number;
  workCooldown: number;
  dailyCooldown: number;
  baseXpRequired: number;
  xpPerCommand: number;
  xpMultiplier: number;
}