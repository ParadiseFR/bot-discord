import { Guild, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

import { command } from '../../tools/Command'

const meta = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Exclure un membre du serveur')
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)

export default command({
  meta,
  cooldown: 3,
  execute: async ({ interaction }): Promise<void> => {
    const datestr = '2025-08-25'
    const start = new Date(`${datestr}T00:00:00.000Z`)
    const end = new Date(`${datestr}T23:59:59.999Z`)

    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const members = await (interaction.guild as Guild).members.fetch()
    const toKick = members.filter((m) => m.joinedAt != null && m.joinedAt >= start && m.joinedAt <= end)

    /* await interaction.editReply(
      toKick.size === 0
        ? '✅ No members matched the 9-day & 2-month criteria.'
        : `🔍 Found **${toKick.size}** member(s).\n\n`
    ) */

    for (const member of toKick.values()) {
      try {
        await member.kick(`Joined on ${datestr} (UTC)`)
      } catch (error) {
        console.error(`Failed to kick ${member.user.tag}:`, error)
      }
    }

    await interaction.editReply(`✅ Kicked ${toKick.size} member(s) who joined on ${datestr} (UTC).`)
  }
})
