import { Readable } from 'node:stream'

import type { AudioResource } from '@discordjs/voice'
import { createAudioResource } from '@discordjs/voice'
import { video_basic_info } from 'play-dl'
import { YouTube } from 'youtube-sr'
import ytdl from '@distube/ytdl-core'

export const videoPattern = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/
export const playlistPattern = /^.*(list=)([^#&?]*).*/
export const scRegex = /^https?:\/\/(soundcloud\.com)\/(.*)$/
export const mobileScRegex = /^https?:\/\/(soundcloud\.app\.goo\.gl)\/(.*)$/
export const isURL = /^https?:\/\/(www\.)?[\w#%+.:=@~-]{1,256}\.[\d()A-Za-z]{1,6}\b([\w#%&()+./:=?@~-]*)/

export interface SongData {
  url: string
  title: string
  duration: number
}

export class Song {
  public readonly url: string
  public readonly title: string
  public readonly duration: number

  public constructor({ url, title, duration }: SongData) {
    this.url = url
    this.title = title
    this.duration = duration
  }

  public static async from(url: string = '', search: string = ''): Promise<Song> {
    const isYoutubeUrl = videoPattern.test(url)

    let songInfo

    if (isYoutubeUrl) {
      songInfo = await video_basic_info(url)

      return new this({
        url: songInfo.video_details.url,
        title: songInfo.video_details.title as string,
        duration: songInfo.video_details.durationInSec
      })
    } else {
      const result = await YouTube.searchOne(search)

      if (result == null) {
        const err = new Error(`No search results found for ${search}`)
        err.name = 'NoResults'
        if (isURL.test(url)) err.name = 'InvalidURL'

        throw err
      }

      songInfo = await video_basic_info(`https://youtube.com/watch?v=${result.id}`)

      return new this({
        url: songInfo.video_details.url,
        title: songInfo.video_details.title as string,
        duration: songInfo.video_details.durationInSec
      })
    }
  }

  public async makeResource(): Promise<AudioResource<Song> | undefined> {
    let playStream!: Readable

    const source = this.url.includes('youtube') ? 'youtube' : 'soundcloud'

    if (source === 'youtube') {
      playStream = ytdl(this.url, {
        filter: 'audioonly',
        liveBuffer: 0,
        quality: 'lowestaudio'
      })
    }

    if (playStream == null) throw new Error('No stream found')

    return createAudioResource(playStream, { metadata: this, inlineVolume: true })
  }

  public startMessage(): string {
    return `🎶 Lecture en cours : ${this.title} ${this.url}`
  }
}
