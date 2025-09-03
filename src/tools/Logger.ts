import chalk from 'chalk'

import { Config } from './Config'

chalk.level = 3

interface PrefixConfig {
  bg: `#${string}`
  text: `#${string}`
  icon?: string
  title?: string
}

interface MainPrefixConfig {
  label: string
  bg: `#${string}`
  text: `#${string}`
}

export class Logger {
  public static LOG_DEBUG = true
  public static LOG_WARN = true
  public static LOG_ERROR = true
  public static LOG_EVENTS = true

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

  private static _PREFIX(type: string, mainPrefixKey?: string): string {
    const prefixConfig = this.customPrefixes[type] ?? this.defaultPrefixes[type as keyof typeof this.defaultPrefixes]
    if (prefixConfig == null) {
      throw new Error(`Unknown log type: ${type}`)
    }

    const mainPrefix = mainPrefixKey != null ? this.customMainPrefixes[mainPrefixKey] : this.defaultMainPrefix

    if (mainPrefix == null) {
      throw new Error(`Unknown main prefix key: ${mainPrefixKey}`)
    }

    const { bg, text, icon, title } = prefixConfig
    const mainPrefixStr = chalk.bgHex(mainPrefix.bg).hex(mainPrefix.text).bold(` ${mainPrefix.label} `)

    const logPrefixStr = chalk
      .bgHex(bg)
      .hex(text)
      .bold(` ${icon != null ? icon + ' ' : ''}${title} `)

    return mainPrefixStr + logPrefixStr
  }

  public static log(mainPrefixKeyOrMsg: string, ...messages: any[]): void {
    if (!this.LOG_DEBUG) return

    const [mainPrefixKey, msg] = this._parseArgs(mainPrefixKeyOrMsg, ...messages)
    console.log(this._PREFIX('debug', mainPrefixKey), msg)
  }

  public static warn(mainPrefixKeyOrMsg: string, ...messages: any[]): void {
    if (!this.LOG_WARN) return

    const [mainPrefixKey, msg] = this._parseArgs(mainPrefixKeyOrMsg, ...messages)
    console.warn(this._PREFIX('warn', mainPrefixKey), msg)
  }

  public static error(mainPrefixKeyOrMsg: string, ...messages: any[]): void {
    if (!this.LOG_ERROR) return

    const [mainPrefixKey, msg] = this._parseArgs(mainPrefixKeyOrMsg, ...messages)
    console.error(this._PREFIX('error', mainPrefixKey), msg)
  }

  public static events(mainPrefixKeyOrMsg: string, skipLogger: boolean = false, ...messages: any[]): void {
    if (!this.LOG_EVENTS || skipLogger) return

    const [mainPrefixKey, msg] = this._parseArgs(mainPrefixKeyOrMsg, ...messages)
    console.log(this._PREFIX('events', mainPrefixKey), msg)
  }

  public static perf(mainPrefixKeyOrMsg: string, ...messages: any[]): void {
    const [mainPrefixKey, msg] = this._parseArgs(mainPrefixKeyOrMsg, ...messages)
    console.log(this._PREFIX('perf', mainPrefixKey), msg)
  }

  public static custom(type: string, mainPrefixKeyOrMsg: string, ...messages: any[]): void {
    const [mainPrefixKey, msg] = this._parseArgs(mainPrefixKeyOrMsg, ...messages)
    console.log(this._PREFIX(type, mainPrefixKey), msg)
  }

  private static _parseArgs(mainPrefixKeyOrMsg: string, ...messages: any[]): [string | undefined, string] {
    if (mainPrefixKeyOrMsg in this.customMainPrefixes) {
      return [mainPrefixKeyOrMsg, messages.join(' ')]
    }

    return [undefined, [mainPrefixKeyOrMsg, ...messages].join(' ')]
  }
}
