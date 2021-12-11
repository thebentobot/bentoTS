import { Event } from '../interfaces'
import { TextChannel, MessageReaction, User, Message } from 'discord.js'
import database from '../database/database'
import { initModels } from '../database/models/init-models'

export const event: Event = {
	name: `messageReactionRemoveAll`,
	run: async (client, message: Message): Promise<void> => {
		// check if the message id equals one of those saved in the db
		// if yes, then delete in the db and notify if there's a mod log channel
		initModels(database)
	},
}
