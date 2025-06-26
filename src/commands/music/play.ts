import { GuildMember, TextChannel, SlashCommandBuilder } from 'discord.js'
import { DiscordGatewayAdapterCreator, joinVoiceChannel } from '@discordjs/voice'

import { command } from '../../tools/Command'
import { Song } from '../../tools/Song'
import { BOT_INSTANCE } from '../../app'
import { Logger, MusicQueue } from '../../tools'

export const playlistPattern = /^.*(list=)([^#&?]*).*/

const meta = new SlashCommandBuilder().setName('play').setDescription('Joue une musique Youtube/Spotify')

meta.addStringOption((option) => {
  return option.setName('url').setDescription('URL Youtube/Spotify').setRequired(true)
})

export default command({
  meta,
  permissions: ['Administrator'],
  execute: async ({ interaction }) => {
    const url = interaction.options.getString('url')
    const guild = interaction.guild
    const guildMember = guild?.members.cache.get(interaction.user.id)
    const { channel } = (guildMember as GuildMember).voice

    if (channel == null)
      return await interaction.reply({ content: "Vous devez d'abord être sur un salon 🎶 Musique", ephemeral: true })

    const queue = BOT_INSTANCE.queues.get(guild?.id as string)

    if (queue != null && channel.id !== queue.connection.joinConfig.channelId) {
      return await interaction
        .reply({
          content: `Vous devez être dans le même salon que ${BOT_INSTANCE.client.user?.username}`,
          ephemeral: true
        })
        .catch(Logger.error)
    }

    if (interaction.replied) await interaction.editReply('⏳ Loading...').catch(console.error)
    else await interaction.reply('⏳ Loading...')

    // Start the playlist if playlist url was provided
    if (playlistPattern.test(url as string)) {
      await interaction.editReply('🔗 Link is playlist').catch(console.error)

      return BOT_INSTANCE.slashCommands.get('playlist')?.execute({ interaction })
    }

    let song: Song

    try {
      song = await Song.from(url as string, url as string)
    } catch (error: any) {
      console.log(error)
      if (error.name === 'NoResults')
        return await interaction
          .reply({ content: `Aucun résultat trouvé pour <${url}>`, ephemeral: true })
          .catch(console.error)
      if (error.name === 'InvalidURL')
        return await interaction.reply({ content: `URL Invalide pour <${url}>`, ephemeral: true }).catch(console.error)

      if (interaction.replied)
        return await interaction.editReply({ content: 'erruer commande mdr' }).catch(console.error)
      else return await interaction.reply({ content: 'erreur commande mdr', ephemeral: true }).catch(console.error)
    }

    if (queue != null) {
      queue.enqueue(song)

      return await (interaction.channel as TextChannel)
        .send({ content: `✅ **${song.title}** a été ajouté à la file d'attente par <@${interaction.user.id}>` })
        .catch(console.error)
    }

    const newQueue = new MusicQueue({
      interaction,
      textChannel: interaction.channel as TextChannel,
      connection: joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
      })
    })

    BOT_INSTANCE.queues.set(interaction.guild?.id as string, newQueue)
    newQueue.enqueue(song)
    interaction.deleteReply().catch(console.error)
  }
})
