import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

import { Guild } from 'discord.js'
import z, { ZodSchema } from 'zod'

import { Logger } from './Logger'
import { FixedSizeMap } from './FixedSizeMap'
import { GUILDS_CONFIG_DIR, GUILDS_CONFIG_PATH } from './Config'

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>
}

const snowflakeOrEmpty = z.string().refine((val) => val === '' || /^\d{17,20}$/.test(val), {
  message: 'Invalid channel ID: must be empty string or a valid Discord snowflake (17-20 digits).'
})

const logsSchema = z.strictObject({
  WELCOME_CHANNEL_ID: snowflakeOrEmpty.optional().default(''),
  LOG_CHANNEL_ID: snowflakeOrEmpty.optional().default(''),
  ADMIN_ANNOUNCE_CHANNEL_ID: snowflakeOrEmpty.optional().default(''),
  TICKET_CHANNEL_ID: snowflakeOrEmpty.optional().default('')
})

const ticketSchema = z.strictObject({
  LIMIT: z.number().int().min(1).optional().default(3),
  CATEGORIES: z
    .array(
      z.strictObject({
        name: z.string(),
        roles: z.array(z.string())
      })
    )
    .optional()
    .default([])
})

const musicSchema = z.strictObject({
  MAX_PLAYLIST_SIZE: z.number().int().min(1).optional().default(10),
  PRUNING: z.boolean().optional().default(true),
  STAY_TIME: z.number().int().nonnegative().optional().default(30),
  DEFAULT_VOLUME: z.number().int().min(0).max(200).optional().default(100)
})

const autoMod = z.strictObject({
  IGNORED_CHANNEL_IDS: z.array(z.string()).optional().default([]),
  IGNORED_ROLE_IDS: z.array(z.string()).optional().default([]),
  CAPS: z
    .strictObject({
      MIN_LENGTH: z.number().int().min(1).optional().default(8),
      PERCENT: z.number().int().min(1).max(100).optional().default(70)
    })
    .optional()
    .default({}),
  FLOOD: z
    .strictObject({
      MESSAGE_LIMIT: z.number().int().min(1).optional().default(15),
      TIME_INTERVAL: z.number().int().min(1).optional().default(30)
    })
    .optional()
    .default({})
})

const guildschema = z.object({
  LOGS: logsSchema.optional().default({}),
  TICKET: ticketSchema.optional().default({}),
  MUSIC: musicSchema.optional().default({}),
  AUTOMOD: autoMod.optional().default({}),

  LISTEN_ROLE_IDS: z.array(z.string()).optional().default([]),
  MEMBER_COUNTER_CHANNEL_ID: snowflakeOrEmpty.optional().default(''),
  locale: z.string().optional().default('en-US')
})

type schemaType = z.infer<typeof guildschema>

class GuildSettingsManager {
  private readonly _cache: FixedSizeMap<string, schemaType>

  constructor(cacheSize: number = 100) {
    this._cache = new FixedSizeMap<string, schemaType>(cacheSize)
    this.load()
  }

  private load(): void {
    try {
      if (!existsSync(GUILDS_CONFIG_DIR)) {
        mkdirSync(GUILDS_CONFIG_DIR, { recursive: true })
      }

      if (existsSync(GUILDS_CONFIG_PATH)) {
        let rawData: unknown
        try {
          rawData = JSON.parse(readFileSync(GUILDS_CONFIG_PATH, 'utf8'))
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
            Logger.addMainPrefix(guildId, {
              bg: '#000000',
              label: (guild: Guild): string => guild.name,
              text: '#ffffff'
            })
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
      writeFileSync(GUILDS_CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8')
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

  public update(guild: Guild, partialConfig: RecursivePartial<schemaType>): void {
    const currentConfig = this.get(guild)
    const updatedConfig = this.deepMerge(currentConfig, partialConfig)
    const result = guildschema.safeParse(updatedConfig)

    if (result.success) {
      this._cache.add(guild.id, result.data)
      this.save()
    } else {
      Logger.error(
        `Invalid partial config update for guild ${guild.id}: ${JSON.stringify(result.error.issues, null, 2)}`
      )
    }
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target }

    for (const key in source) {
      if (Object.hasOwn(source, key)) {
        if (Boolean(source[key]) && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          output[key] = this.deepMerge(target[key] ?? {}, source[key])
        } else {
          output[key] = source[key]
        }
      }
    }

    return output
  }

  private isValidConfig<T>(data: unknown, schema: ZodSchema<T>): data is T {
    const result = schema.safeParse(data)
    return result.success
  }
}

export const GuildSettings = new GuildSettingsManager()
