import { appendFileSync, existsSync, mkdirSync, renameSync } from 'node:fs'
import { join } from 'node:path'

import chalk from 'chalk'
import { Guild } from 'discord.js'

import { Config, GUILDS_CONFIG_DIR } from './Config'

chalk.level = 3

interface PrefixConfig {
  bg: `#${string}`
  text: `#${string}`
  icon?: string
  title?: string
}

interface MainPrefixConfig {
  label: string | ((guild: Guild) => string)
  bg: `#${string}`
  text: `#${string}`
}

export class Logger {
  public static LOG_DEBUG = true
  public static LOG_WARN = true
  public static LOG_ERROR = true
  public static LOG_EVENTS = true

  private static hasInitializedLogs = false
  private static readonly logsDir = join(GUILDS_CONFIG_DIR, 'logs')
  private static readonly latestLogPath = join(this.logsDir, 'latest.log')

  private static readonly defaultMainPrefix: MainPrefixConfig = {
    label: Config.PREFIX,
    bg: '#3742fa',
    text: '#FFF'
  }

  private static customMainPrefixes: Record<string, MainPrefixConfig> = {}

  private static readonly defaultPrefixes = {
    debug: { bg: '#353b48', text: '#FFF', icon: '🪲', title: 'DEBUG' },
    warn: { bg: '#f39c12', text: '#000', icon: '⚠', title: 'WARNING' },
    error: { bg: '#c0392b', text: '#FFF', icon: '🚨', title: 'ERROR' },
    events: { bg: '#27ae60', text: '#FFF', icon: '📢', title: 'EVENTS' },
    perf: { bg: '#093a52', text: '#FFF', icon: '⏱️', title: 'BENCHMARK' }
  }

  private static customPrefixes: Record<string, PrefixConfig> = {}

  public static addMainPrefix(key: string, config: MainPrefixConfig): void {
    this.customMainPrefixes[key] = config
  }

  public static setPrefix(type: string, config: Partial<PrefixConfig>): void {
    this.customPrefixes[type] = {
      ...(this.defaultPrefixes[type as keyof typeof this.defaultPrefixes] ?? {}),
      ...config
    } as PrefixConfig
  }

  private static _PREFIX(type: string, mainPrefixKey?: string, guild?: Guild): string {
    const prefixConfig = this.customPrefixes[type] ?? this.defaultPrefixes[type as keyof typeof this.defaultPrefixes]
    if (prefixConfig == null) {
      throw new Error(`Unknown log type: ${type}`)
    }

    let mainPrefix: MainPrefixConfig

    if (mainPrefixKey != null && this.customMainPrefixes[mainPrefixKey] != null) {
      mainPrefix = this.customMainPrefixes[mainPrefixKey]
    } else {
      mainPrefix = this.defaultMainPrefix
    }

    let labelText: string

    if (typeof mainPrefix.label === 'function') {
      if (guild != null) {
        labelText = mainPrefix.label(guild)
      } else {
        labelText =
          typeof this.defaultMainPrefix.label === 'function'
            ? this.defaultMainPrefix.label(guild as any) // should never happen with default config
            : this.defaultMainPrefix.label
      }
    } else {
      labelText = mainPrefix.label
    }

    const { bg, text, icon, title } = prefixConfig
    const mainPrefixStr = chalk.bgHex(mainPrefix.bg).hex(mainPrefix.text).bold(` ${labelText} `)

    const logPrefixStr = chalk
      .bgHex(bg)
      .hex(text)
      .bold(` ${icon != null ? icon + ' ' : ''}${title} `)

    return mainPrefixStr + logPrefixStr
  }

  public static logWithGuild(guild: Guild, message: string, ...optionalParams: any[]): void {
    if (!this.LOG_DEBUG) return

    const prefix = this._PREFIX('debug', guild?.id, guild)
    this._writeLogs(prefix, message, ...optionalParams)
  }

  public static log(mainPrefixKeyOrMsg: string, ...messages: any[]): void {
    if (!this.LOG_DEBUG) return

    const [mainPrefixKey, msg] = this._parseArgs(mainPrefixKeyOrMsg, ...messages)
    this._writeLogs(this._PREFIX('debug', mainPrefixKey), msg)
  }

  public static guildEvent(guild: Guild, message: string): void {
    if (!this.LOG_EVENTS) return

    const prefix = this._PREFIX('events', guild?.id, guild)
    this._writeLogs(prefix, message)
  }

  public static guildCommand(guild: Guild, message: string): void {
    const prefix = this._PREFIX('commands', guild?.id, guild)
    this._writeLogs(prefix, message)
  }

  public static warn(mainPrefixKeyOrMsg: string, ...messages: any[]): void {
    if (!this.LOG_WARN) return

    const [mainPrefixKey, msg] = this._parseArgs(mainPrefixKeyOrMsg, ...messages)
    this._writeLogs(this._PREFIX('warn', mainPrefixKey), msg)
  }

  public static error(mainPrefixKeyOrMsg: string, ...messages: any[]): void {
    if (!this.LOG_ERROR) return

    const [mainPrefixKey, msg] = this._parseArgs(mainPrefixKeyOrMsg, ...messages)
    console.error(this._PREFIX('error', mainPrefixKey), msg)
  }

  public static events(mainPrefixKeyOrMsg: string, skipLogger: boolean = false, ...messages: any[]): void {
    if (!this.LOG_EVENTS || skipLogger) return

    const [mainPrefixKey, msg] = this._parseArgs(mainPrefixKeyOrMsg, ...messages)
    this._writeLogs(this._PREFIX('events', mainPrefixKey), msg)
  }

  public static perf(mainPrefixKeyOrMsg: string, ...messages: any[]): void {
    const [mainPrefixKey, msg] = this._parseArgs(mainPrefixKeyOrMsg, ...messages)
    this._writeLogs(this._PREFIX('perf', mainPrefixKey), msg)
  }

  public static custom(type: string, mainPrefixKeyOrMsg: string, ...messages: any[]): void {
    const [mainPrefixKey, msg] = this._parseArgs(mainPrefixKeyOrMsg, ...messages)
    this._writeLogs(this._PREFIX(type, mainPrefixKey), msg)
  }

  private static _parseArgs(mainPrefixKeyOrMsg: string, ...messages: any[]): [string | undefined, string] {
    if (mainPrefixKeyOrMsg in this.customMainPrefixes) {
      return [mainPrefixKeyOrMsg, messages.join(' ')]
    }

    return [undefined, [mainPrefixKeyOrMsg, ...messages].join(' ')]
  }

  private static _writeLogs(...args: Parameters<typeof console.log>): void {
    if (Config.WRITE_LOGS && process.env.NODE_ENV === 'production') {
      if (!this.hasInitializedLogs) {
        mkdirSync(this.logsDir, { recursive: true })

        if (existsSync(this.latestLogPath)) {
          const now = new Date()
          const year = now.getFullYear()
          const month = String(now.getMonth() + 1).padStart(2, '0')
          const day = String(now.getDate()).padStart(2, '0')
          const hour = String(now.getHours()).padStart(2, '0')
          const minute = String(now.getMinutes()).padStart(2, '0')
          const second = String(now.getSeconds()).padStart(2, '0')

          renameSync(
            this.latestLogPath,
            join(this.logsDir, `${year}-${month}-${day}-${hour}H-${minute}M-${second}S.log`)
          )
        }

        this.hasInitializedLogs = true
      }

      const rawLog = args.map((arg): string => String(arg)).join(' ')
      // eslint-disable-next-line no-control-regex
      const logLine = rawLog.replace(/\u001B\[[\d;]*m/g, '') + '\n'
      appendFileSync(this.latestLogPath, logLine)
    }

    return console.log(...args)
  }
}
