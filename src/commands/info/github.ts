import { Message } from 'discord.js'
import { Command } from '../../interfaces'

export const command: Command = {
	name: `github`,
	aliases: [],
	category: `info`,
	description: `Link to the Bento 🍱 GitHub organisation`,
	usage: `github`,
	website: `https://www.bentobot.xyz/commands#github`,
	run: async (client, message, args): Promise<Message> => {
		return message.channel.send(`https://github.com/thebentobot`)
	},
}
