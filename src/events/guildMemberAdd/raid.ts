import { Events, GuildVerificationLevel } from 'discord.js'

import { Logger, event } from '../../tools'

const RAID_SETTINGS = {
  threshold: 10,
  interval: 10000
}

const raidMode = new Map()
const joinRecords = new Map()

export default event(Events.GuildMemberAdd, async (_, member) => {
  if (!member.user.bot) {
    const now = Date.now()
    const gid = member.guild.id

    if (!Boolean(joinRecords.has(gid))) {
      joinRecords.set(gid, [])
      raidMode.set(gid, false)
    }
    const timestamps = joinRecords.get(gid)

    while (timestamps.length > 0 && now - timestamps[0] > RAID_SETTINGS.interval) {
      timestamps.shift()
    }

    timestamps.push(now)

    // if already in raid mode, kick new joins
    if (Boolean(raidMode.get(gid))) {
      await member.kick('Auto-raid active')
      return
    }

    // if threshold reached, trigger mitigation
    if (timestamps.length >= RAID_SETTINGS.threshold) {
      raidMode.set(gid, true)

      Logger.warn(`⚠️ Raid detected: ${timestamps.length} joins in ${RAID_SETTINGS.interval / 1000}s.`)

      await member.kick('Raid protection: mass join')
      await member.guild.setVerificationLevel(GuildVerificationLevel.High, 'Lockdown due to raid')

      // reset raid mode after 5 minutes
      setTimeout(() => raidMode.set(gid, false), 5 * 60 * 1000)
    }
  }
})
