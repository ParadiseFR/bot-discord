import fs from 'node:fs'
import path from 'node:path'
import { homedir } from 'node:os'

import { Logger } from './Logger'

const CONFIG_DIR = `${homedir()}/.mybot`
const CONFIG_PATH = path.join(CONFIG_DIR, 'guilds.json')

interface IGuildConfig {
  [guildId: string]: {
    logChannelId: string
  }
}

class GuildConfigManager {
  private data: IGuildConfig = {}

  constructor() {
    this.load()
  }

  private load(): void {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true })
      }
      if (fs.existsSync(CONFIG_PATH)) {
        this.data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
      }
    } catch (error) {
      Logger.error('Error loading guild config:', error)
      this.data = {}
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.data, null, 2), 'utf8')
    } catch (error) {
      Logger.error('Error saving guild config:', error)
    }
  }

  public setLogChannel(guildId: string, channelId: string): void {
    this.data[guildId] = { logChannelId: channelId }
    this.save()
  }

  public getLogChannel(guildId: string): string | null {
    return this.data[guildId]?.logChannelId ?? null
  }
}

export const GuildConfig = new GuildConfigManager()
