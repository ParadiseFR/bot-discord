import { ChannelType, Guild, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

import { GuildSettings, Logger, command } from '../../tools'
import { BOT_INSTANCE } from '../../app'

const meta = new SlashCommandBuilder()
  .setName('membercount')
  .setDescription('Update the members count channel manually.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((subcommand) =>
    subcommand.setName('update').setDescription('Update the member count in the configured channel.')
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('set')
      .setDescription('Set the voice channel for member count updates.')
      .addChannelOption((option) =>
        option
          .setName('channel')
          .setDescription('The voice channel to use for member count.')
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildVoice)
      )
  )

export default command({
  meta,
  cooldown: 5,
  execute: async ({ interaction }) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const subcommand = interaction.options.getSubcommand(true)

    if (subcommand === 'update') {
      try {
        const wasUpdated = await BOT_INSTANCE.updateMemberCount(interaction.guild as Guild)

        if (wasUpdated) {
          await interaction.editReply('✅ Member count has been updated successfully!')
        } else {
          await interaction.editReply('ℹ️ Member count is already up to date. Nothing to change.')
        }
      } catch (error) {
        Logger.error('Error updating member count:', error)
        await interaction.editReply('❌ Failed to update member count. Please try again.')
      }
    } else if (subcommand === 'set') {
      const channel = interaction.options.getChannel('channel', true)

      if (channel.type === ChannelType.GuildVoice) {
        GuildSettings.update(interaction.guild as Guild, { MEMBER_COUNTER_CHANNEL_ID: channel.id })
        await interaction.editReply(`✅ Member counter channel set to ${channel.name}.`)
      } else {
        await interaction.editReply('❌ Please select a valid voice channel.')
      }
    }
  }
})
