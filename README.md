# Discord Economy Bot

A comprehensive Discord economy bot built with Discord.js v14 and MongoDB, featuring a complete leveling system, interactive commands, and dynamic announcements.

## Features

### 🎮 Core Economy System
- **User Registration**: Required before accessing economy features
- **Multiple Currency Earning Methods**: Daily rewards, work commands, and more
- **Inventory System**: Collectible items with different rarities
- **Leveling System**: XP tracking with level-based rewards and bonuses

### 📊 Leaderboards & Rankings
- **Wealth Leaderboard**: Richest users by total currency
- **Level Leaderboard**: Highest level users
- **Activity Leaderboard**: Most active users with "grind hours" tracking

### 📢 Announcement System
- **Owner Announcements**: Bot owner can create announcements via commands
- **Channel Monitoring**: Automatic announcement creation from designated channel
- **Non-intrusive Delivery**: Announcements appear as follow-up messages

### ⚡ Advanced Features
- **Rate Limiting & Cooldowns**: Prevents spam and maintains balance
- **Scalable Database Design**: Efficient MongoDB schemas with proper indexing
- **Comprehensive Error Handling**: Graceful error management and logging
- **Modern Discord.js**: Built with Discord.js v14 and slash commands

## Prerequisites

- **Node.js** 18+ or **Bun** (recommended)
- **MongoDB** database (local or cloud)
- **Discord Application** with bot token

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd discord-economy-bot
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   # Discord Bot Configuration
   DISCORD_TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_discord_application_id_here

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/discord-economy-bot

   # Bot Configuration
   BOT_OWNER_ID=your_discord_user_id_here
   ANNOUNCEMENT_CHANNEL_ID=your_announcement_channel_id_here

   # Economy Settings (optional - defaults provided)
   DAILY_REWARD_MIN=100
   DAILY_REWARD_MAX=500
   WORK_REWARD_MIN=50
   WORK_REWARD_MAX=200
   WORK_COOLDOWN=300000    # 5 minutes
   DAILY_COOLDOWN=86400000 # 24 hours

   # Leveling Settings (optional - defaults provided)
   BASE_XP_REQUIRED=100
   XP_PER_COMMAND=5
   XP_MULTIPLIER=1.5
   ```

4. **Deploy slash commands**
   ```bash
   bun run deploy
   # or
   npm run deploy
   ```

5. **Start the bot**
   ```bash
   bun run dev    # Development with auto-reload
   # or
   bun start      # Production
   ```

## Commands

### 📊 General Commands
- `/register` - Create your economy account
- `/profile [user]` - View detailed profile information
- `/leaderboard <type> [page]` - View server rankings
- `/help [category]` - Get help with bot commands

### 💰 Economy Commands
- `/balance [user]` - Check current balance and wealth
- `/daily` - Claim daily reward (24h cooldown)
- `/work` - Work to earn coins (5min cooldown)
- `/inventory [user] [page]` - View collected items

### ⚙️ Admin Commands (Bot Owner Only)
- `/announce <message> [preview]` - Create bot announcements
- `/manage-announcements` - Manage existing announcements
  - `list` - View all announcements
  - `disable/enable <id>` - Toggle announcement status
  - `stats <id>` - View delivery statistics

## Database Schema

### User Collection
```javascript
{
  userId: String,           // Discord user ID
  guildId: String,          // Discord guild ID
  username: String,         // Display username
  balance: Number,          // Wallet balance
  bank: Number,             // Bank balance
  level: Number,            // Current level
  xp: Number,              // Current level XP
  totalXp: Number,         // Total XP earned
  commandsUsed: Number,    // Commands used counter
  inventory: [             // User inventory
    {
      itemId: String,
      name: String,
      quantity: Number,
      rarity: String,      // common, uncommon, rare, epic, legendary
      value: Number
    }
  ],
  lastDaily: Date,         // Last daily claim
  lastWork: Date,          // Last work command
  registeredAt: Date,      // Account creation
  lastActive: Date         // Last activity
}
```

### Announcement Collection
```javascript
{
  id: String,              // Unique announcement ID
  content: String,         // Announcement content
  authorId: String,        // Creator's Discord ID
  createdAt: Date,         // Creation timestamp
  isActive: Boolean,       // Active status
  deliveredTo: [String]    // User IDs who received it
}
```

## Bot Architecture

### 🏗️ Project Structure
```
src/
├── commands/           # Slash commands organized by category
│   ├── economy/       # Economy-related commands
│   ├── general/       # General bot commands
│   └── admin/         # Admin-only commands
├── events/            # Discord.js event handlers
├── models/            # MongoDB schemas
├── utils/             # Utility functions and helpers
├── types/             # TypeScript type definitions
└── index.ts           # Main bot entry point
```

### 🔧 Key Components

**Command Handler**: Automatically loads and registers slash commands with cooldown management and permission checking.

**Event System**: Modular event handling for Discord.js events and custom bot events.

**Database Layer**: MongoDB integration with Mongoose for data persistence and efficient querying.

**Announcement System**: Dynamic announcement delivery that integrates seamlessly with command usage.

**Economy Engine**: Balanced economy with multiple earning methods, level-based scaling, and anti-abuse measures.

## Configuration

### Economy Balance
Adjust economy settings in your `.env` file:

- **Daily Rewards**: Configure min/max daily reward amounts
- **Work Earnings**: Set base work payment ranges
- **Cooldowns**: Customize command cooldown periods
- **Leveling**: Modify XP requirements and progression

### Scaling Considerations
- **Database Indexing**: Optimized indexes for leaderboard queries
- **Memory Management**: Efficient data structures and caching
- **Rate Limiting**: Built-in cooldown system prevents abuse
- **Error Handling**: Comprehensive error catching and logging

## Development

### Adding New Commands
1. Create command file in appropriate category folder
2. Follow the `Command` interface structure
3. Export as default
4. Run `bun run deploy` to register

### Database Migrations
The bot automatically handles schema updates through Mongoose. For major changes:
1. Update the model schemas
2. Test with development database
3. Plan migration strategy for production data

### Testing
- Test commands in a development Discord server
- Use different permission levels to verify access controls
- Monitor database performance with realistic user loads

## Deployment

### Production Checklist
- [ ] Set up production MongoDB database
- [ ] Configure all environment variables
- [ ] Deploy slash commands to production
- [ ] Set up process monitoring (PM2, Docker, etc.)
- [ ] Configure backup strategy for database
- [ ] Set up logging and error monitoring

### Hosting Options
- **VPS/Dedicated Server**: Full control, requires server management
- **Cloud Platforms**: Heroku, Railway, DigitalOcean Apps
- **Container Deployment**: Docker support for scalable deployments

## Support & Contributing

### Getting Help
- Check the `/help` command in Discord for user guidance
- Review console logs for technical issues
- Verify environment configuration

### Contributing
1. Fork the repository
2. Create feature branch
3. Follow existing code patterns
4. Test thoroughly
5. Submit pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with Discord.js v14, MongoDB, and TypeScript**