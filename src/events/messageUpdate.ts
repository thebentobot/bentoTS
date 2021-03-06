import { Event } from '../interfaces'
import { Message, TextChannel, MessageEmbed } from 'discord.js'
import database from '../database/database'
import { initModels, messageLog } from '../database/models/init-models'

export const event: Event = {
	name: `messageUpdate`,
	run: async (client, oldMessage: Message, newMessage: Message): Promise<Message | void> => {
		if (oldMessage.author.bot) return

		if (oldMessage.content === newMessage.content) return

		initModels(database)

		try {
			const log = await messageLog.findOne({
				where: { guildID: oldMessage?.guild?.id },
			})
			const messageLogChannel: TextChannel = client.channels.cache.get(`${log?.channel}`) as TextChannel
			if (!messageLogChannel.permissionsFor(client.user?.id as string)?.has(`VIEW_CHANNEL`)) return
			if (!messageLogChannel.permissionsFor(client.user?.id as string)?.has(`SEND_MESSAGES`)) return
			const embed = new MessageEmbed()
				.setAuthor(
					`${oldMessage.author.username + `#` + oldMessage.author.discriminator} (userID: ${oldMessage.author.id})`,
					oldMessage.author.displayAvatarURL(),
				)
				.setColor(`#FFF000`)
				.setDescription(
					`[Message](${oldMessage.url}) edited in <#${oldMessage.channel.id}>\n**Before:** ${oldMessage.content}\n**After:** ${newMessage.content}`,
				)
				.addField(`Channel ID`, oldMessage.channel.id)
				.addField(`Old Message ID`, oldMessage.id)
				.addField(`New Message ID`, newMessage.id)
				.setFooter(`Edited at`)
				.setTimestamp(oldMessage.createdAt)

			await messageLogChannel.send(embed)
		} catch {
			return
		}
	},
}
