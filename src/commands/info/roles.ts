import { Message, MessageEmbed } from 'discord.js'
import { Command } from '../../interfaces'
import { trim } from '../../utils'

export const command: Command = {
	name: `roles`,
	aliases: [],
	category: `info`,
	description: `Shows list of roles on the server.`,
	usage: `roles`,
	website: `https://www.bentobot.xyz/commands#roles`,
	run: async (client, message): Promise<Message> => {
		console.log(`Reached ${command.name}.ts, guildID: ${message.guild?.id}`)

		const embed = new MessageEmbed()
			.setAuthor(message.guild?.name, message.guild?.iconURL({ format: `png` }) as string)
			.setTitle(`All roles in ${message.guild?.name}`)
			.setThumbnail(
				message.guild?.iconURL({
					format: `png`,
					size: 1024,
					dynamic: true,
				}) as string,
			)
			.setFooter(`Amount of roles - ${message.guild?.roles.cache.size}`)
			.setTimestamp()
			.setDescription(trim(message.guild?.roles.cache.map((role) => `${role}`).join(` | `) as string, 4096))
		return await message.channel.send(embed)
	},
}
