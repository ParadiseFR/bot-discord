import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { Guild } from 'discord.js'
import z, { ZodSchema } from 'zod'

import { Logger } from './Logger'
import { FixedSizeMap } from './FixedSizeMap'

const CONFIG_DIR = `${homedir()}/.mybot`
const CONFIG_PATH = join(CONFIG_DIR, 'guilds.json')

const snowflakeOrEmpty = z.string().refine((val) => val === '' || /^\d{17,20}$/.test(val), {
  message: 'Invalid channel ID: must be empty string or a valid Discord snowflake (17-20 digits).'
})

const logsSchema = z
  .object({
    WELCOME_CHANNEL_ID: snowflakeOrEmpty.optional().default(''),
    LOG_CHANNEL_ID: snowflakeOrEmpty.optional().default(''),
    ADMIN_ANNOUNCE_CHANNEL_ID: snowflakeOrEmpty.optional().default(''),
    TICKET_CHANNEL_ID: snowflakeOrEmpty.optional().default('')
  })
  .strict()

const ticketSchema = z
  .object({
    LIMIT: z.number().int().min(1).optional().default(3)
  })
  .strict()

const musicSchema = z
  .object({
    MAX_PLAYLIST_SIZE: z.number().int().min(1).optional().default(10),
    PRUNING: z.boolean().optional().default(true),
    STAY_TIME: z.number().int().nonnegative().optional().default(30),
    DEFAULT_VOLUME: z.number().int().min(0).max(200).optional().default(100)
  })
  .strict()

const guildschema = z
  .object({
    LOGS: logsSchema.optional().default(() => ({})),
    TICKET: ticketSchema.optional().default(() => ({})),
    MUSIC: musicSchema.optional().default(() => ({}))
  })
  .strict()

type schemaType = z.infer<typeof guildschema>

class GuildSettingsManager {
  private readonly _cache: FixedSizeMap<string, schemaType>

  constructor(cacheSize: number = 100) {
    this._cache = new FixedSizeMap<string, schemaType>(cacheSize)
    this.load()
  }

  private load(): void {
    try {
      if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true })
      }

      if (existsSync(CONFIG_PATH)) {
        let rawData: unknown
        try {
          rawData = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
        } catch (error) {
          Logger.error('Failed to parse guild config file:', error)
          return
        }

        if (!this.isValidConfig(rawData, z.record(z.any(), z.any()))) {
          return Logger.warn('Guild config is not a valid object, skipping load.')
        }

        const data = rawData as Record<string, unknown>

        for (const [guildId, settings] of Object.entries(data)) {
          if (!/^\d{17,20}$/.test(guildId)) {
            Logger.warn(`Skipping invalid guild ID: ${guildId}`)
            continue
          }

          const result = guildschema.safeParse(settings)
          if (result.success) {
            this._cache.add(guildId, result.data)
          } else {
            Logger.warn(
              `Invalid config for guild ${guildId}, skipping: ${JSON.stringify(result.error.issues, null, 2)}`
            )
          }
        }
      }
    } catch (error) {
      Logger.error('Error loading guild config:', error)
    }
  }

  private save(): void {
    try {
      const data = Object.fromEntries(this._cache.entries())
      writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8')
    } catch (error) {
      Logger.error('Error saving guild config:', error)
    }
  }

  public get(guild: Guild): schemaType {
    let config = this._cache.get(guild.id)

    if (config == null) {
      config = this.getDefaultConfig()
      this._cache.add(guild.id, config)
      this.save()
    }

    return config
  }

  private getDefaultConfig(): schemaType {
    return guildschema.parse({})
  }

  public set(guild: Guild, config: unknown): void {
    const result = guildschema.safeParse(config)
    if (result.success) {
      this._cache.add(guild.id, result.data)
      this.save()
    } else {
      Logger.error(`Invalid config provided for guild ${guild.id}: ${JSON.stringify(result.error.issues, null, 2)}`)
    }
  }

  private isValidConfig<T>(data: unknown, schema: ZodSchema<T>): data is T {
    const result = schema.safeParse(data)
    return result.success
  }
}

export const GuildSettings = new GuildSettingsManager()
