import { Event } from '../interfaces'
import { Message, TextChannel, MessageEmbed, MessageReaction, User } from 'discord.js'
import database from '../database/database'
import { initModels, messageLog } from '../database/models/init-models'

export const event: Event = {
	name: `messageReactionAdd`,
	run: async (client, messageReaction: MessageReaction, user: User): Promise<void> => {
		let reactionMessage: MessageReaction | undefined
		if (messageReaction.partial) {
			messageReaction
				.fetch()
				.then((fullMessage) => {
					reactionMessage = fullMessage
				})
				.catch((error) => {
					console.log(`Something went wrong when fetching the message: `, error)
				})
		} else {
			reactionMessage = messageReaction
		}

		//const channelExampleID = `913131094864461874`
		const messageExampleID = `913136900188016740`

		if (reactionMessage?.message.id === messageExampleID) {
			const channelParse = reactionMessage.message.channel as TextChannel
			channelParse.overwritePermissions([{ id: user.id, allow: [`SEND_MESSAGES`] }])
		}
		initModels(database)
	},
}
