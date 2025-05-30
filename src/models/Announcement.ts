import mongoose, { Schema, Document } from 'mongoose';
import { Announcement } from '../types/index.js';

const AnnouncementSchema = new Schema<Announcement>({
  id: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  authorId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  deliveredTo: [{ type: String }] // Array of user IDs who have seen this announcement
});

// Index for efficient queries
AnnouncementSchema.index({ isActive: 1, createdAt: -1 });
AnnouncementSchema.index({ deliveredTo: 1 });

// Static methods
AnnouncementSchema.statics.getActiveAnnouncements = function() {
  return this.find({ isActive: true }).sort({ createdAt: -1 });
};

AnnouncementSchema.statics.getUndeliveredAnnouncements = function(userId: string) {
  return this.find({
    isActive: true,
    deliveredTo: { $ne: userId }
  }).sort({ createdAt: -1 });
};

// Instance methods
AnnouncementSchema.methods.markAsDelivered = function(userId: string) {
  if (!this.deliveredTo.includes(userId)) {
    this.deliveredTo.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

export interface AnnouncementDocument extends Announcement, Document {
  markAsDelivered(userId: string): Promise<AnnouncementDocument>;
}

export interface AnnouncementModel extends mongoose.Model<AnnouncementDocument> {
  getActiveAnnouncements(): Promise<AnnouncementDocument[]>;
  getUndeliveredAnnouncements(userId: string): Promise<AnnouncementDocument[]>;
}

export const AnnouncementModel = mongoose.model<AnnouncementDocument, AnnouncementModel>('Announcement', AnnouncementSchema);