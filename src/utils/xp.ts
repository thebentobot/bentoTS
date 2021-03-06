import database from '../database/database'
import { initModels, guildMember, user } from '../database/models/init-models'

const cooldownServer = new Set()
const cooldownGlobal = new Set()

export async function addXpServer(guildID: string, userID: string, xpToAdd: number): Promise<void> {
	try {
		initModels(database)

		if (cooldownServer.has(userID)) {
			return
		}

		const result = await guildMember.increment(`xp`, {
			by: xpToAdd,
			where: { guildID: guildID, userID: userID },
		})
		// https://sequelize.org/master/manual/model-instances.html
		// bottom about incrementing
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const xp = result[0][0][0].xp
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const level = result[0][0][0].level
		const getNeededXP = (level: number) => level * level * 100
		const needed = getNeededXP(level)
		if (xp >= needed) {
			await guildMember.increment(`level`, {
				by: 1,
				where: { guildID: guildID, userID: userID },
			})
			await guildMember.update({ xp: 0 }, { where: { userID: userID, guildID: guildID } })
		}

		cooldownServer.add(userID)
		setTimeout(() => {
			cooldownServer.delete(userID)
		}, 60000) // 1 minute
	} catch (err) {
		console.log(err)
	}
}

export async function addXpGlobal(userID: string, xpToAdd: number): Promise<void> {
	try {
		initModels(database)

		if (cooldownGlobal.has(userID)) {
			return
		}

		const result = await user.increment(`xp`, {
			by: xpToAdd,
			where: { userID: userID },
		})
		// https://sequelize.org/master/manual/model-instances.html
		// bottom about incrementing
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const xp = result[0][0][0].xp
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const level = result[0][0][0].level
		const getNeededXP = (level: number) => level * level * 100
		const needed = getNeededXP(level)
		if (xp >= needed) {
			await user.increment(`level`, { by: 1, where: { userID: userID } })
			await user.update({ xp: 0 }, { where: { userID: userID } })
		}

		cooldownGlobal.add(userID)
		setTimeout(() => {
			cooldownGlobal.delete(userID)
		}, 60000) // 1 minute
	} catch (err) {
		console.log(err)
	}
}
