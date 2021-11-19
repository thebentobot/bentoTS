import { Event } from '../interfaces'
import database from '../database/database'
import {
	initModels,
	guild as DbGuild,
	welcome,
	tag,
	modLog,
	messageLog,
	guildMember,
	bye,
	muteRole,
	autoRole,
	caseGlobal,
	ban,
	kick,
	mute,
	warning,
	memberLog,
	role,
	roleChannel,
	availableRolesGuild,
	roleMessages,
	channelDisable,
	announcementSchedule,
	announcementTime,
} from '../database/models/init-models'
import { Guild } from 'discord.js'

export const event: Event = {
	name: `guildDelete`,
	run: async (client, guild: Guild): Promise<void> => {
		initModels(database)

		await welcome.destroy({ where: { guildID: guild.id } })
		await tag.destroy({ where: { guildID: guild.id } })
		await modLog.destroy({ where: { guildID: guild.id } })
		await messageLog.destroy({ where: { guildID: guild.id } })
		await memberLog.destroy({ where: { guildID: guild.id } })
		await guildMember.destroy({ where: { guildID: guild.id } })
		await bye.destroy({ where: { guildID: guild.id } })
		await muteRole.destroy({ where: { guildID: guild.id } })
		await autoRole.destroy({ where: { guildID: guild.id } })
		await caseGlobal.destroy({ where: { guildID: guild.id } })
		await channelDisable.destroy({ where: { guildID: guild.id } })
		await announcementSchedule.destroy({ where: { guildID: guild.id } })
		await announcementTime.destroy({ where: { guildID: guild.id } })
		await ban.destroy({ where: { guildID: guild.id } })
		await kick.destroy({ where: { guildID: guild.id } })
		await mute.destroy({ where: { guildID: guild.id } })
		await warning.destroy({ where: { guildID: guild.id } })
		await role.destroy({ where: { guildID: guild.id } })
		await roleChannel.destroy({ where: { guildID: guild.id } })
		await availableRolesGuild.destroy({ where: { guildID: guild.id } })
		await roleMessages.destroy({ where: { guildID: guild.id } })
		await DbGuild.destroy({ where: { guildID: guild.id } })
	},
}
