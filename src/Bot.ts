import {
  Client,
  Guild,
  Snowflake,
  VoiceBasedChannel,
  ChannelType,
  Collection,
  Events,
  PermissionFlagsBits,
  GuildMember,
  PartialGuildMember
} from 'discord.js'
import { GlobalFonts } from '@napi-rs/canvas'
import { google } from 'googleapis'

import type { Command } from './types'
import { ASSETS_DIR, Config, Logger, MusicQueue, ROOT_DIR, registerEvents } from './tools'
import events from './events'

export class RypiBot {
  public readonly prefix = Config.PREFIX
  public slashCommands = new Collection<string, Command>()
  public cooldowns = new Collection<string, Collection<Snowflake, number>>()
  public queues = new Collection<Snowflake, MusicQueue>()

  public drive: ReturnType<typeof google.drive>

  public constructor(public readonly client: Client<true>) {
    Logger.custom('env', `Running on ${process.env.NODE_ENV?.toUpperCase()} mode`)

    GlobalFonts.registerFromPath(ASSETS_DIR('Alro.ttf'))

    const auth = new google.auth.GoogleAuth({
      keyFile: ROOT_DIR('credentials.json'),
      scopes: ['https://www.googleapis.com/auth/drive']
    })

    this.drive = google.drive({ version: 'v3', auth })

    Logger.log('Bot initiated successfully')

    this.client
      .login(process.env.TOKEN)
      .then((): void => Logger.log('Connection established successfully'))
      .catch((error): void => Logger.error(error))
      // TODO: execute finally only if no error has been catched
      .finally((): void => {
        this.client.on(Events.Warn, (warning): void => Logger.warn(warning))
        this.client.on(Events.Error, (error): void => Logger.error(error as any))

        registerEvents(client, events)
      })
  }

  public async findOrCreateMemberCounterChannel(guild: Guild): Promise<VoiceBasedChannel | undefined> {
    try {
      const voiceChannels = guild.channels.cache.filter(
        (channel): boolean => channel.type === ChannelType.GuildVoice
      ) as Collection<Snowflake, VoiceBasedChannel>

      const pattern = new RegExp(`^${Config.MEMBER_COUNTER_PATTERN.replace(/{count}/g, '\\d+')}$`)
      const existingChannel = voiceChannels.find((channel): boolean => pattern.test(channel.name))

      if (existingChannel == null) {
        const count = await this.membersCount(guild)
        const channelName = Config.MEMBER_COUNTER_PATTERN.replace(/{count}/, count.toString())

        const channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          reason: 'Member counter channel',
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.Connect]
            }
          ]
        })

        return channel
      } else return existingChannel
    } catch (error) {
      Logger.error('Error finding or creating member counter channel:', error)
    }
  }

  public async membersCount(guild: Guild): Promise<number> {
    const members = await guild.members.fetch()
    return members.filter((member): boolean => !member.user.bot).size
  }

  public async refinePartialMember(member: GuildMember | PartialGuildMember): Promise<GuildMember> {
    if (member.partial) {
      Logger.log(`Member ${member.user.tag} is partial, not catched yet, fetching full data...`)

      try {
        member = await member.fetch()
      } catch (error) {
        Logger.error(`Failed to fetch full member data for ${member.user.tag}:`, error)
      }
    }

    return member as GuildMember
  }

  public async updateMemberCount(guild: Guild): Promise<void> {
    try {
      const count = await this.membersCount(guild)
      const voiceChannel = (await this.findOrCreateMemberCounterChannel(guild)) as VoiceBasedChannel
      const newChannelName = Config.MEMBER_COUNTER_PATTERN.replace(/{count}/, count.toString())

      if (voiceChannel.name !== newChannelName) {
        await voiceChannel.setName(newChannelName)
        Logger.log(`Updated members count channel name to: ${newChannelName}`)
      }
    } catch (error) {
      Logger.error('Error updating member count:', error)
    }
  }
}
