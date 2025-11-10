import { Guild, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

import { Logger, command } from '../../tools'
import { BOT_INSTANCE } from '../../app'

const meta = new SlashCommandBuilder()
  .setName('membercount')
  .setDescription('Update the members count channel manually.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export default command({
  meta,
  cooldown: 5,
  execute: async ({ interaction }) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

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
  }
})
