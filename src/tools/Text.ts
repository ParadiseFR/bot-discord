const bold = (...messages: string[]): string => `**${messages.join(' ')}**`
const italic = (...messages: string[]): string => `_${messages.join(' ')}_`
const underline = (...messages: string[]): string => `__${messages.join(' ')}__`
const link = (url: string, ...messages: string[]): string => `[${messages.join(' ')}](${url})`
const code = (lang: string, multiline: boolean = false, ...messages: string[]): string => {
  const content = multiline ? messages.join('\n') : messages.join(' ')
  return `\`\`\`${lang}\n${content}\n\`\`\``
}

const channel = (id: string): string => `<#${id}>`
const mention = {
  user: (id: string): string => `<@${id}>`,
  role: (id: string): string => `<@&${id}>`
}

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)
const toUpperSnakeCase = (str: string): string =>
  str
    .replace(/([\da-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toUpperCase()

export const Text = { bold, italic, underline, code, link, channel, mention, capitalize, toUpperSnakeCase }
