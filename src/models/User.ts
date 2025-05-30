import mongoose, { Schema, Document } from 'mongoose';
import { UserProfile, InventoryItem } from '../types/index.js';

const InventoryItemSchema = new Schema<InventoryItem>({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    required: true
  },
  value: { type: Number, required: true, default: 0 }
});

const UserSchema = new Schema<UserProfile>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  username: { type: String, required: true },
  balance: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  totalXp: { type: Number, default: 0 },
  commandsUsed: { type: Number, default: 0 },
  inventory: [InventoryItemSchema],
  lastDaily: { type: Date, default: null },
  lastWork: { type: Date, default: null },
  registeredAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

// Create compound index for efficient queries
UserSchema.index({ userId: 1, guildId: 1 }, { unique: true });
UserSchema.index({ balance: -1 }); // For leaderboards
UserSchema.index({ level: -1, totalXp: -1 }); // For level leaderboards
UserSchema.index({ commandsUsed: -1 }); // For activity leaderboards

// Methods
UserSchema.methods.addXp = function(amount: number): boolean {
  this.xp += amount;
  this.totalXp += amount;
  this.lastActive = new Date();

  const xpRequired = this.getXpRequired();
  if (this.xp >= xpRequired) {
    this.level += 1;
    this.xp -= xpRequired;
    return true; // Level up occurred
  }
  return false;
};

UserSchema.methods.getXpRequired = function(): number {
  const baseXp = parseInt(process.env.BASE_XP_REQUIRED || '100');
  const multiplier = parseFloat(process.env.XP_MULTIPLIER || '1.5');
  return Math.floor(baseXp * Math.pow(multiplier, this.level - 1));
};

UserSchema.methods.addItem = function(item: Omit<InventoryItem, 'quantity'>, quantity: number = 1) {
  const existingItem = this.inventory.find(i => i.itemId === item.itemId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.inventory.push({ ...item, quantity });
  }
};

UserSchema.methods.removeItem = function(itemId: string, quantity: number = 1): boolean {
  const item = this.inventory.find(i => i.itemId === itemId);
  if (!item || item.quantity < quantity) return false;

  item.quantity -= quantity;
  if (item.quantity <= 0) {
    this.inventory = this.inventory.filter(i => i.itemId !== itemId);
  }
  return true;
};

export interface UserDocument extends UserProfile, Document {
  addXp(amount: number): boolean;
  getXpRequired(): number;
  addItem(item: Omit<InventoryItem, 'quantity'>, quantity?: number): void;
  removeItem(itemId: string, quantity?: number): boolean;
}

export const User = mongoose.model<UserDocument>('User', UserSchema);