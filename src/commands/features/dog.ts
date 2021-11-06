import axios from 'axios'
import { Message } from 'discord.js'
import { Command } from '../../interfaces'

export const command: Command = {
	name: `dog`,
	aliases: [],
	category: `features`,
	description: `Make Bento send a random dog 🐶🥺`,
	usage: `dog`,
	website: `https://www.bentobot.xyz/commands#dog`,
	run: async (client, message): Promise<Message> => {
		const dogData = await axios.get(`https://dog.ceo/api/breeds/image/random`)
		return message.channel.send(dogData.data.message)
	},
}
