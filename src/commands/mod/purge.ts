import { SlashCommandBuilder } from 'discord.js'

import { command } from '../../tools/Command'

const meta = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Supprimer les messages dans un salon');

meta.addNumberOption((option) =>
  option
    .setName('amount')
    .setDescription('Nombre de messages à supprimer')
    .setMinValue(1)
    .setMaxValue(100)
    .setRequired(true)
);

export default command({
  meta,
  cooldown: 3,
  execute: async ({ interaction }) => {
    const amount = interaction.options.getNumber('amount') as number
    const messages = await interaction.channel?.messages.fetch({ limit: amount })

    if (messages != null && messages.size > 0) {
      messages.map(async (message) => await interaction.channel?.messages.delete(message))

      const reply = await interaction.reply(`${amount} message(s) seront supprimés.`)

      return setTimeout(async () => {
        if (!Boolean(reply)) return
        return await reply.delete()
      }, 2000)
    } else return await interaction.reply('Pas de messages à supprimer')
  }
})
