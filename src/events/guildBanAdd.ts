import { Event } from '../interfaces'
import database from '../database/database'
import {
	initModels,
	guildMember,
	user as DbUser,
	bento,
	horoscope,
	lastfm,
	weather,
	reminder,
	notificationMessage,
	rpsGame,
	profile,
	tag,
} from '../database/models/init-models'
import { Guild, User } from 'discord.js'

export const event: Event = {
	name: `guildBanAdd`,
	run: async (client, guild: Guild, user: User): Promise<void> => {
		initModels(database)

		try {
			const bannedMemberCheck = await guildMember.findOne({ raw: true, where: { guildID: guild.id, userID: user.id } })
			if (bannedMemberCheck !== null) {
				await guildMember.destroy({ where: { guildID: guild.id, userID: user.id } })

				const guildMemberData = await guildMember.findAll({
					where: { userID: user.id },
				})
				if (!guildMemberData.length) {
					await bento.destroy({ where: { userID: user.id } })
					await rpsGame.destroy({ where: { userID: user.id } })
					await profile.destroy({ where: { userID: user.id } })
					await horoscope.destroy({ where: { userID: user.id } })
					await lastfm.destroy({ where: { userID: user.id } })
					await weather.destroy({ where: { userID: user.id } })
					await reminder.destroy({ where: { userID: user.id } })
					await notificationMessage.destroy({ where: { userID: user.id } })
					await tag.destroy({ where: { userID: user.id } })
					await DbUser.destroy({ where: { userID: user.id } })
				}
			}
		} catch (err) {
			console.log(`Error at guildbanadd.ts, server ${guild.id}\n\n${err}`)
		}
	},
}
