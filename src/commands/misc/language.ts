import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

import { GuildSettings, command, tWithLocale } from '../../tools'

const meta = new SlashCommandBuilder()
  .setName('language')
  .setDescription('Set the language for this server.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((option) =>
    option
      .setName('locale')
      .setDescription('The language to set.')
      .setRequired(true)
      .addChoices({ name: 'English', value: 'en-US' }, { name: 'Español', value: 'es-ES' })
  )

export default command({
  meta: meta as any,
  cooldown: 5,
  execute: async ({ interaction }) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const locale = interaction.options.getString('locale', true)

    if (interaction.guild != null) {
      GuildSettings.update(interaction.guild, { locale })
    }

    await interaction.editReply(tWithLocale(interaction, 'language.responses.success', { locale }))
  }
})
