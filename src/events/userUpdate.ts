import { Event } from '../interfaces'
import database from '../database/database'
import { initModels, user } from '../database/models/init-models'
import { User } from 'discord.js'

export const event: Event = {
	name: `userUpdate`,
	run: async (client, oldUser: User, newUser: User): Promise<void> => {
		initModels(database)

		if (
			oldUser.avatarURL({ dynamic: true, format: `png`, size: 1024 }) !==
			newUser.avatarURL({ dynamic: true, format: `png`, size: 1024 })
		) {
			try {
				await user.update(
					{
						avatarURL: newUser.avatarURL({
							dynamic: true,
							format: `png`,
							size: 1024,
						}) as string,
					},
					{ where: { userID: oldUser.id } },
				)
			} catch {
				return
			}
		}

		if (oldUser.username !== newUser.username) {
			try {
				await user.update({ username: newUser.username }, { where: { userID: oldUser.id } })
			} catch {
				return
			}
		}

		if (oldUser.discriminator !== newUser.discriminator) {
			try {
				await user.update({ discriminator: newUser.discriminator }, { where: { userID: oldUser.id } })
			} catch {
				return
			}
		}
	},
}
