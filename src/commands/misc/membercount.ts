import { ChannelType, type Guild, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

import { GuildSettings, Logger, command, tWithLocale } from '../../tools'
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
          await interaction.editReply(tWithLocale(interaction, 'membercount.responses.updated'))
        } else {
          await interaction.editReply(tWithLocale(interaction, 'membercount.responses.up_to_date'))
        }
      } catch (error) {
        Logger.error('Error updating member count:', error)
        await interaction.editReply(tWithLocale(interaction, 'membercount.responses.error'))
      }
    } else if (subcommand === 'set') {
      const channel = interaction.options.getChannel('channel', true)

      if (channel.type === ChannelType.GuildVoice) {
        GuildSettings.update(interaction.guild as Guild, {
          MEMBER_COUNTER_CHANNEL_ID: channel.id
        })
        await interaction.editReply(
          tWithLocale(interaction, 'membercount.responses.channel_set', {
            channel: channel.name
          })
        )
      } else {
        await interaction.editReply(tWithLocale(interaction, 'membercount.responses.invalid_channel'))
      }
    }
  }
})
