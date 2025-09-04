import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

import { command } from '../../tools'

const meta = new SlashCommandBuilder()
  .setName('limit')
  .setDescription('Définir la limite de tickets par utilisateur')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

meta.addNumberOption((option) =>
  option.setName('limit').setDescription('Limite de tickets par utilisateur').setRequired(true)
)

export default command({
  meta,
  cooldown: 5,
  execute: async ({ interaction }) => {
    await interaction.deferReply({ ephemeral: true })

    const limit = interaction.options.getNumber('limit', true)

    await interaction.editReply(`✅ Limite de tickets par utilisateur définie sur ${limit}.`)
  }
})
