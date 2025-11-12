import { promisify } from 'node:util'

import {
  AudioPlayer,
  AudioPlayerPlayingState,
  AudioPlayerState,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionState,
  VoiceConnectionStatus
} from '@discordjs/voice'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  Guild,
  GuildMember,
  Interaction,
  Message,
  TextChannel
} from 'discord.js'

import { Song } from './Song'
import { BOT_INSTANCE } from '../app'
import { Logger } from './Logger'
import { GuildSettings } from './Guild'
import { Text } from './Text'

export const safeReply = async (
  interaction: CommandInteraction | ButtonInteraction,
  content: string
): Promise<void> => {
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(content)
    } else {
      await interaction.reply(content)
    }
  } catch (error: any) {
    Logger.error(error)
  }
}

export interface QueueOptions {
  interaction: CommandInteraction
  textChannel: TextChannel
  connection: VoiceConnection
}

const wait = promisify(setTimeout)

export class MusicQueue {
  public readonly interaction!: CommandInteraction
  public readonly connection!: VoiceConnection
  public readonly player: AudioPlayer
  public readonly textChannel!: TextChannel
  public readonly bot = BOT_INSTANCE

  public resource!: AudioResource
  public songs: Song[] = []
  public volume = GuildSettings.get(this.interaction.guild as Guild).MUSIC.DEFAULT_VOLUME
  public loop = false
  public muted = false
  public waitTimeout!: NodeJS.Timeout | null
  private queueLock = false
  private readyLock = false
  private stopped = false

  public constructor(options: QueueOptions) {
    Object.assign(this, options)

    this.player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } })
    this.connection.subscribe(this.player)

    const networkStateChangeHandler = (
      _oldNetworkState: VoiceConnectionState,
      newNetworkState: VoiceConnectionState
    ): void => {
      const newUdp = Reflect.get(newNetworkState, 'udp')
      clearInterval(newUdp?.keepAliveInterval)
    }

    this.connection.on('stateChange', async (oldState: VoiceConnectionState, newState: VoiceConnectionState) => {
      Reflect.get(oldState, 'networking')?.off('stateChange', networkStateChangeHandler)
      Reflect.get(newState, 'networking')?.on('stateChange', networkStateChangeHandler)

      if (newState.status === VoiceConnectionStatus.Disconnected) {
        if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
          try {
            this.stop()
          } catch (error) {
            console.log(error)
            this.stop()
          }
        } else if (this.connection.rejoinAttempts < 5) {
          await wait((this.connection.rejoinAttempts + 1) * 5_000)
          this.connection.rejoin()
        } else {
          this.connection.destroy()
        }
      } else if (
        !this.readyLock &&
        (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)
      ) {
        this.readyLock = true
        try {
          await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000)
        } catch {
          if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
            try {
              this.connection.destroy()
            } catch {}
          }
        } finally {
          this.readyLock = false
        }
      }
    })

    this.player.on('stateChange', async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
      if (oldState.status !== AudioPlayerStatus.Idle && newState.status === AudioPlayerStatus.Idle) {
        if (this.loop && this.songs.length > 0) {
          this.songs.push(this.songs.shift() as Song)
        } else {
          this.songs.shift()
          if (this.songs.length === 0) return this.stop()
        }

        if (this.songs.length > 0 || this.resource.audioPlayer != null) await this.processQueue()
      } else if (oldState.status === AudioPlayerStatus.Buffering && newState.status === AudioPlayerStatus.Playing) {
        await this.sendPlayingMessage(newState)
      }
    })

    this.player.on('error', async (error) => {
      Logger.error(error.message)

      if (this.loop && this.songs.length > 0) {
        this.songs.push(this.songs.shift() as Song)
      } else {
        this.songs.shift()
      }

      await this.processQueue()
    })
  }

  public enqueue(...songs: Song[]): void {
    if (this.waitTimeout !== null) clearTimeout(this.waitTimeout)
    this.waitTimeout = null
    this.stopped = false
    this.songs = this.songs.concat(songs)
    this.processQueue().catch(Logger.error)
  }

  public stop(): void {
    if (this.stopped) return

    this.stopped = true
    this.loop = false
    this.songs = []
    this.player.stop()

    const { MUSIC } = GuildSettings.get(this.interaction.guild as Guild)

    !MUSIC.PRUNING && this.textChannel.send("❌ File d'attente de musique terminée.").catch(Logger.error)

    if (this.waitTimeout !== null) return

    this.waitTimeout = setTimeout(() => {
      if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
        try {
          this.connection.destroy()
        } catch {}
      }
      this.bot.queues.delete(this.interaction.guild?.id as string)

      !MUSIC.PRUNING && this.textChannel.send('Quitte le salon vocal...').catch(Logger.error)
    }, MUSIC.STAY_TIME * 1000)
  }

  /**
   * Processes the song queue for playback. This method checks if the queue is locked or if the player
   * is busy. If not, it proceeds to play the next song in the queue. This method is also responsible
   * for handling playback errors and retrying song playback when necessary. It ensures that the queue
   * continues to play smoothly, handling transitions between songs, including loop and stop behaviors.
   */
  public async processQueue(): Promise<void> {
    if (this.queueLock || this.player.state.status !== AudioPlayerStatus.Idle) {
      return
    }

    if (this.songs.length === 0) {
      return this.stop()
    }

    this.queueLock = true

    const next = this.songs[0]

    try {
      const resource = await next.makeResource()

      this.resource = resource as NonNullable<typeof resource>
      this.player.play(this.resource)
      this.resource.volume?.setVolumeLogarithmic(this.volume / 100)
    } catch (error) {
      return await this.processQueue()
    } finally {
      this.queueLock = false
    }
  }

  private canModifyQueue(member: GuildMember): boolean {
    return member.voice.channelId === member.guild.members.me?.voice.channelId
  }

  private async handleSkip(interaction: any): Promise<void> {
    await this.bot.slashCommands.get('skip')?.execute(interaction)
  }

  private async handlePlayPause(interaction: any): Promise<void> {
    if (this.player.state.status === AudioPlayerStatus.Playing) {
      await this.bot.slashCommands.get('pause')?.execute(interaction)
    } else {
      await this.bot.slashCommands.get('resume')?.execute(interaction)
    }
  }

  private async handleMute(interaction: ButtonInteraction): Promise<void> {
    if (!this.canModifyQueue(interaction.member as GuildMember)) return

    this.muted = !this.muted

    if (this.muted) {
      this.resource.volume?.setVolumeLogarithmic(0)

      safeReply(
        interaction,
        `${Text.mention.user(interaction.user.displayName)} 🔇 a coupé le son de la musique !`
      ).catch(Logger.error)
    } else {
      this.resource.volume?.setVolumeLogarithmic(this.volume / 100)

      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      safeReply(interaction, `${Text.mention.user(interaction.user.id)} 🔊 a réactivé le son de la musique !`).catch(
        Logger.error
      )
    }
  }

  private async handleDecreaseVolume(interaction: ButtonInteraction): Promise<void> {
    if (this.volume === 0) return

    if (!this.canModifyQueue(interaction.member as GuildMember)) return

    this.volume = Math.max(this.volume - 10, 0)

    this.resource.volume?.setVolumeLogarithmic(this.volume / 100)

    safeReply(
      interaction,
      `${Text.mention.user(interaction.user.id)} 🔊 a réduit le volume, le volume est maintenant de ${this.volume}%`
    ).catch(Logger.error)
  }

  private async handleIncreaseVolume(interaction: ButtonInteraction): Promise<void> {
    if (this.volume === 100) return

    if (!this.canModifyQueue(interaction.member as GuildMember)) return

    this.volume = Math.min(this.volume + 10, 100)

    this.resource.volume?.setVolumeLogarithmic(this.volume / 100)

    safeReply(
      interaction,
      `${Text.mention.user(interaction.user.id)} 🔊 a augmenté le volume, le volume est maintenant de ${this.volume}%`
    ).catch(Logger.error)
  }

  private async handleLoop(interaction: any): Promise<void> {
    await this.bot.slashCommands.get('loop')?.execute(interaction)
  }

  private async handleShuffle(interaction: any): Promise<void> {
    await this.bot.slashCommands.get('shuffle')?.execute(interaction)
  }

  private async handleStop(interaction: any): Promise<void> {
    await this.bot.slashCommands.get('stop')?.execute(interaction)
  }

  private readonly commandHandlers = new Map([
    ['skip', this.handleSkip],
    ['play_pause', this.handlePlayPause],
    ['mute', this.handleMute],
    ['decrease_volume', this.handleDecreaseVolume],
    ['increase_volume', this.handleIncreaseVolume],
    ['loop', this.handleLoop],
    ['shuffle', this.handleShuffle],
    ['stop', this.handleStop]
  ])

  private createButtonRow(): Array<ActionRowBuilder<ButtonBuilder>> {
    const firstRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('skip').setLabel('⏭').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('play_pause').setLabel('⏯').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('mute').setLabel('🔇').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('decrease_volume').setLabel('🔉').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('increase_volume').setLabel('🔊').setStyle(ButtonStyle.Secondary)
    )
    const secondRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('loop').setLabel('🔁').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('shuffle').setLabel('🔀').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('stop').setLabel('⏹').setStyle(ButtonStyle.Secondary)
    )

    return [firstRow, secondRow]
  }

  /**
   * Sets up a message component collector for the playing message to handle
   * button interactions. This collector listens for button clicks and dispatches
   * commands based on the custom ID of the clicked button. It supports functionalities
   * like skip, stop, play/pause, volume control, and more. The collector is also
   * responsible for stopping itself when the corresponding song is skipped or stopped,
   * ensuring that interactions are only valid for the current playing song.
   */
  private async sendPlayingMessage(newState: AudioPlayerPlayingState): Promise<void> {
    const song = (newState.resource as AudioResource<Song>).metadata

    let playingMessage: Message

    try {
      playingMessage = await this.textChannel.send({
        content: song.startMessage(),
        components: this.createButtonRow()
      })
    } catch (error: any) {
      Logger.error(error)
      if (error instanceof Error) this.textChannel.send(error.message).catch(Logger.error)
      return
    }

    const filter = (i: Interaction): boolean => i.isButton() && i.message.id === playingMessage.id

    const collector = playingMessage.createMessageComponentCollector({
      filter,
      time: song.duration > 0 ? song.duration * 1000 : 60000
    })

    collector.on('collect', async (interaction) => {
      if (!interaction.isButton()) return
      if (this.songs.length === 0) return

      const handler = this.commandHandlers.get(interaction.customId)

      if (['skip', 'stop'].includes(interaction.customId)) collector.stop()

      if (handler != null) await handler.call(this, interaction)
    })

    collector.on('end', () => {
      // Remove the buttons when the song ends
      playingMessage.edit({ components: [] }).catch(Logger.error)

      const { MUSIC } = GuildSettings.get(this.interaction.guild as Guild)

      // Delete the message if pruning is enabled
      if (MUSIC.PRUNING) {
        setTimeout((): void => {
          playingMessage.delete().catch(Logger.error)
        }, 3000)
      }
    })
  }
}
