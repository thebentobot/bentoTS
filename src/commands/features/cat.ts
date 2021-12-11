import axios from 'axios'
import { Message } from 'discord.js'
import { Command } from '../../interfaces'

export const command: Command = {
	name: `cat`,
	aliases: [],
	category: `features`,
	description: `Make Bento send a random cat 🐱🥺`,
	usage: `cat`,
	website: `https://www.bentobot.xyz/commands#cat`,
	run: async (client, message): Promise<Message> => {
		console.log(`Reached ${command.name}.ts, guildID: ${message.guild?.id}`)

		const catData = await axios.get(`http://aws.random.cat/meow`)
		return message.channel.send(catData.data.file)
	},
}
