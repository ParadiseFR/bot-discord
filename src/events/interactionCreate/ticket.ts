import {
  APIEmbedField,
  ActionRowBuilder,
  BaseGuildTextChannel,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Collection,
  EmbedBuilder,
  Events,
  Guild,
  GuildBasedChannel,
  GuildMember,
  PermissionFlagsBits,
  TextChannel,
  User
} from 'discord.js'

import { GuildSettings, HttpUtils, Logger, event } from '../../tools'

const parseTicketDetails = async (
  channel: BaseGuildTextChannel
): Promise<{ user: User; catName: string } | undefined> => {
  if (channel.topic == null || channel.topic.length === 0) return

  const split = channel.topic?.split('|')
  const userId = split[1]
  const catName = split[2] ?? 'Default'
  const user = await channel.client.users.fetch(userId, { cache: false })

  return { user, catName }
}

const isTicketChannel = (channel: GuildBasedChannel): channel is TextChannel => {
  return (
    channel.type === ChannelType.GuildText &&
    channel.name.startsWith('ticket-') &&
    channel.topic != null &&
    channel.topic.length > 0
  )
}

const closeTicket = async (channel: TextChannel, closedBy: User, reason?: string): Promise<string> => {
  if (
    !channel.deletable ||
    !channel
      .permissionsFor(channel.guild.members.me as GuildMember)
      .has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory])
  ) {
    return 'MISSING_PERMISSIONS'
  }

  try {
    const messages = await channel.messages.fetch()
    const reversed = Array.from(messages.values()).reverse()

    let content = ''

    for (const m of reversed) {
      content += `[${new Date(m.createdAt).toLocaleString('en-US')}] - ${m.author.username}\n`
      if (m.cleanContent !== '') content += `${m.cleanContent}\n`
      if (m.attachments.size > 0) content += `${m.attachments.map((att) => att.proxyURL).join(', ')}\n`
      content += '\n'
    }

    const logsUrl = await HttpUtils.uploadFile(content, `Ticket Logs for ${channel.name}`)
    const ticketDetails = await parseTicketDetails(channel)
    const components = []

    if (logsUrl != null) {
      components.push(
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(new ButtonBuilder().setLabel('Transcript').setURL(logsUrl).setStyle(ButtonStyle.Link))
          .toJSON()
      )
    }

    if (channel.deletable) await channel.delete()

    const embed = new EmbedBuilder().setAuthor({ name: 'Ticket Closed' }).setColor('#e17055')
    const fields = [] as APIEmbedField[]

    if (reason != null && reason.length > 0) {
      fields.push({ name: 'Reason', value: reason, inline: false })
    }

    fields.push(
      {
        name: 'Opened By',
        value: ticketDetails?.user != null ? ticketDetails.user.username : 'Unknown',
        inline: true
      },
      {
        name: 'Closed By',
        value: closedBy != null ? closedBy.username : 'Unknown',
        inline: true
      }
    )

    embed.setFields(fields)

    const { LOGS } = GuildSettings.get(channel.guild)
    if (LOGS.TICKET_CHANNEL_ID != null && LOGS.TICKET_CHANNEL_ID.length > 0) {
      const logChannel = channel.guild.channels.cache.get(LOGS.TICKET_CHANNEL_ID)

      if (logChannel != null && logChannel instanceof TextChannel) {
        await logChannel.send({ embeds: [embed], components })
      }
    }

    if (ticketDetails?.user != null) {
      const dmEmbed = embed
        .setDescription(`**Server:** ${channel.guild.name}\n**Category:** ${ticketDetails.catName}`)
        .setThumbnail(channel.guild.iconURL())

      await ticketDetails.user.send({ embeds: [dmEmbed], components })
    }

    return 'SUCCESS'
  } catch (error) {
    Logger.error('closeTicket', error)
    return 'ERROR'
  }
}

const getTicketChannels = (guild: Guild): Collection<string, TextChannel> => {
  return guild.channels.cache.filter((ch): ch is TextChannel => isTicketChannel(ch))
}

const getExistingTicketChannel = (guild: Guild, userId: string): TextChannel | undefined => {
  const tktChannels = getTicketChannels(guild)
  return tktChannels?.filter((ch): boolean => ch.topic?.split('|')[1] === userId).first()
}

export default event(Events.InteractionCreate, async (_, interaction) => {
  if (interaction.isButton()) {
    const { guild, user, channel, customId } = interaction

    switch (customId) {
      case 'TICKET_CREATE':
        await interaction.deferReply({ ephemeral: true })

        if (Boolean(guild?.members.me?.permissions.has(PermissionFlagsBits.ManageChannels))) {
          return await interaction.followUp('Cannot create ticket channel, missing `Manage Channel` permission')
        }

        if (getExistingTicketChannel(guild as Guild, user.id) != null) {
          return await interaction.followUp(`You already have an open ticket`)
        }

        const { TICKET } = GuildSettings.get(guild as Guild)
        const existing = getTicketChannels(guild as Guild).size
        if (existing != null && existing > TICKET.LIMIT)
          return await interaction.followUp('There are too many open tickets. Try again later')

        // INCOMPLETE

        break
      case 'TICKET_CLOSE':
        if (channel != null && 'guild' in channel) {
          if (channel.type === ChannelType.GuildText) {
            await interaction.deferReply({ ephemeral: true })

            const status = await closeTicket(channel, user)

            if (status === 'MISSING_PERMISSIONS') {
              return await interaction.followUp('Cannot close the ticket, missing permissions.')
            } else if (status === 'ERROR') {
              return await interaction.followUp('Failed to close the ticket, an error occurred!')
            }
          }
        }

        break
    }
  }
})
