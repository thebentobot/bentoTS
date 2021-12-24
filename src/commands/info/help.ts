import { Message, MessageEmbed } from 'discord.js'
import ExtendedClient from '../../client/index'
import { Command } from '../../interfaces'
import database from '../../database/database'
import { initModels, guild } from '../../database/models/init-models'
import { stringify } from 'querystring'
import { urlToColours } from '../../utils/urlToColours'

export const command: Command = {
	name: `help`,
	aliases: [`about`],
	category: `info`,
	description: `Displays bot help message or info for a command`,
	usage: `help [command name]`,
	website: `https://www.bentobot.xyz/commands#help`,
	run: async (client, message, args): Promise<Message | void> => {
		try {
			if (args[0]) {
				return getCMD(client, message, args[0])
			} else {
				return helpMSG(client, message)
			}
		} catch (err) {
			console.log(`Error at help.ts, server ${message.guild?.id}\n\n${err}`)
		}

		async function helpMSG(client: ExtendedClient, message: Message) {
			initModels(database)

			const guildDB = await guild.findOne({
				raw: true,
				where: { guildID: message.guild?.id },
			})

			const embed = new MessageEmbed()
				.setColor(`${await urlToColours(client.user?.avatarURL({ format: `png` }) as string)}`)
				.setTitle(`Help`)
				.setThumbnail(client.user?.avatarURL() as string)
				.setDescription(
					`For a full list of commands, please type \`${guildDB?.prefix}commands\` \nTo see more info about a specific command, please type \`${guildDB?.prefix}help <command>\` without the \`<>\``,
				)
				.addField(
					`About Bento Bot 🍱`,
					`A Discord bot for chat moderation and fun features you did not know you needed on Discord.`,
				)
				.addField(`Get a full list and more details for each command`, `https://www.bentobot.xyz/commands`)
				.addField(`Want additional benefits when using Bento 🍱?`, `https://www.patreon.com/bentobot`)
				.addField(`Get a Bento 🍱 for each tip`, `https://ko-fi.com/bentobot`)
				.addField(`Vote on top.gg and receive 5 Bento 🍱`, `https://top.gg/bot/787041583580184609/vote`)
				.addField(`Want to check out the code for Bento 🍱?`, `https://github.com/thebentobot/bentoTS`)
				.addField(
					`Need help? Or do you have some ideas or feedback to Bento 🍱? Feel free to join the support server`,
					`https://discord.gg/dd68WwP`,
				)
				.setFooter(
					`Bento 🍱 is created by Banner#1017`,
					(await client.users.fetch(`232584569289703424`))?.avatarURL({
						dynamic: true,
					}) as string,
				)
			return await message.channel.send(embed).catch((error) => {
				console.error(`Could not send message, missing permission`, error)
			})
		}

		async function getCMD(client: ExtendedClient, message: Message, input: string) {
			const guildDB = await guild.findOne({
				raw: true,
				where: { guildID: message.guild?.id },
			})

			const embed = new MessageEmbed()

			const cmd =
				client.commands.get(input.toLowerCase()) ||
				client.commands.get(`${client.aliases.get(input.toLowerCase())?.name}`)

			let info = `No information found for command **${input.toLowerCase()}**`

			if (!cmd) {
				return message.channel.send(
					embed
						.setColor(`${await urlToColours(client.user?.avatarURL({ format: `png` }) as string)}`)
						.setDescription(info),
				)
			}

			cmd.aliases = Array.prototype.slice.call(cmd.aliases)
			if (cmd.name) info = `**Command Name**: ${cmd.name}`
			if (cmd.aliases) info += `\n**Aliases**: ${cmd.aliases.map((a) => `\`${stringify({ a }).slice(2)}\``).join(`, `)}`
			if (cmd.description) info += `\n**Description**: ${cmd.description}`
			if (cmd.usage) {
				info += `\n**Usage**: ${guildDB?.prefix}${cmd.usage}`
				embed.setFooter(`<> = REQUIRED | [] = OPTIONAL`)
			}
			if (cmd.website) info += `\n**Website**: ${cmd.website}`

			return message.channel
				.send(
					embed
						.setColor(`${await urlToColours(client.user?.avatarURL({ format: `png` }) as string)}`)
						.setDescription(info),
				)
				.catch((error) => {
					console.error(`Could not send message, missing permission`, error)
				})
		}
	},
}
