import { Events, ChatInputCommandInteraction, Collection } from 'discord.js';
import { ExtendedClient } from '../types/index.js';
import { isUserRegistered, createErrorEmbed, checkAndDeliverAnnouncements, addXpToUser } from '../utils/helpers.js';
import { User } from '../models/User.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const client = interaction.client as ExtendedClient;
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`❌ No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      // Check if command requires registration (except for register command)
      if (command.requiresRegistration && interaction.commandName !== 'register') {
        const isRegistered = await isUserRegistered(interaction.user.id, interaction.guild?.id || '');
        if (!isRegistered) {
          const embed = createErrorEmbed(
            'Registration Required',
            'You need to register an account first! Use `/register` to get started.'
          );
          await interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        }
      }

      // Check cooldowns
      if (command.cooldown) {
        const { cooldowns } = client;
        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name) || new Collection();
        const cooldownAmount = command.cooldown * 1000;

        if (timestamps.has(interaction.user.id)) {
          const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

          if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            const embed = createErrorEmbed(
              'Command Cooldown',
              `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.data.name}\` command.`
            );
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
          }
        }

        timestamps.set(interaction.user.id, now);
        cooldowns.set(command.data.name, timestamps);

        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
      }

      // Execute the command
      await command.execute(interaction);

      // Add XP and update command usage (if user is registered and it's not the register command)
      if (interaction.commandName !== 'register') {
        const isRegistered = await isUserRegistered(interaction.user.id, interaction.guild?.id || '');
        if (isRegistered) {
          const xpAmount = parseInt(process.env.XP_PER_COMMAND || '5');
          const leveledUp = await addXpToUser(interaction.user.id, interaction.guild?.id || '', xpAmount);

          // Update command usage counter
          await User.updateOne(
            { userId: interaction.user.id, guildId: interaction.guild?.id || '' },
            { $inc: { commandsUsed: 1 } }
          );

          // Notify user if they leveled up
          if (leveledUp) {
            const user = await User.findOne({ userId: interaction.user.id, guildId: interaction.guild?.id || '' });
            if (user) {
              const embed = createSuccessEmbed(
                'Level Up!',
                `🎉 Congratulations! You've reached **Level ${user.level}**!\n+${xpAmount} XP gained from using commands.`
              );
              await interaction.followUp({ embeds: [embed] });
            }
          }

          // Check for announcements (non-intrusive delivery)
          setTimeout(() => {
            checkAndDeliverAnnouncements(interaction).catch(console.error);
          }, 1000);
        }
      }

    } catch (error) {
      console.error(`❌ Error executing command ${interaction.commandName}:`, error);

      const embed = createErrorEmbed(
        'Command Error',
        'There was an error while executing this command! Please try again later.'
      );

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },
};