import { Event } from '../interfaces'
import database from '../database/database'
import {
	initModels,
	guild as DbGuild,
	guildCreationAttributes,
	caseGlobalCreationAttributes,
	caseGlobal,
} from '../database/models/init-models'
import * as dotenv from 'dotenv'
dotenv.config()
import { Guild, Message, MessageEmbed, TextChannel } from 'discord.js'
import { urlToColours } from '../utils'

export const event: Event = {
	name: `guildCreate`,
	run: async (client, guild: Guild): Promise<Message | void> => {
		initModels(database)

		const attr: guildCreationAttributes = {
			guildID: BigInt(guild.id),
			guildName: guild.name,
			prefix: process.env.prefix as string,
			tiktok: true,
			leaderboard: true,
			media: true,
			icon: (guild.iconURL() as string)
				? (guild.iconURL() as string)
				: `https://cdn.discordapp.com/icons/714496317522444352/ebfb32b4ee4b60ed457d36c03654b260.png?size=1024`,
			memberCount: guild.memberCount,
		}

		const caseGlobalAttr: caseGlobalCreationAttributes = {
			guildID: BigInt(guild.id),
			serverName: false,
			reason: false,
		}

		const newGuild = await DbGuild.create(attr)
		await caseGlobal.create(caseGlobalAttr)
		console.log(
			`New guild were added to the database. It is called: ` + newGuild.guildName + `, ID: ` + newGuild.guildID,
		)
		try {
			const channelNames = [`general`, `general-chat`, `chat`, `main-chat`, `welcome`]
			const channel = guild.channels.cache.find((ch) => channelNames.includes(ch.name))

			if (channel) {
				const messageLogChannel: TextChannel = client.channels.cache.get(`${channel.id}`) as TextChannel
				const embed = new MessageEmbed()
					.setAuthor(client?.user?.username, client?.user?.avatarURL() as string, `https://www.bentobot.xyz/`)
					.setTitle(`Hello! My name is Bento 🍱`)
					.setColor(`${await urlToColours(client?.user?.avatarURL({ format: `png` }) as string)}`)
					.setDescription(
						`Thank you for choosing me to service your server!\nMy default prefix is \`${process.env.prefix}\`.\nIf the prefix is conflicting because of other bots, you can change it by writing \`${process.env.prefix}prefix <NEW PREFIX>\`\nUse \`${process.env.prefix}settings\` to check what features I've enabled or disabled by default.\nUse \`${process.env.prefix}commands\` to see a list of all my commands and \`${process.env.prefix}help <command name>\` to get help or info about a command.`,
					)
					.addField(
						`Check out the website for more information and help with all commands and settings`,
						`https://www.bentobot.xyz/`,
					)
					.addField(
						`Need help? Or do you have some ideas or feedback to Bento 🍱? Feel free to join the support server`,
						`https://discord.gg/dd68WwP`,
					)
					.addField(`Want to check out the code for Bento 🍱?`, `https://github.com/thebentobot/bentoTS`)
					.addField(`Want additional benefits when using Bento 🍱?`, `https://www.patreon.com/bentobot`)
					.addField(`Get a Bento 🍱 for each tip`, `https://ko-fi.com/bentobot`)
					.addField(`Vote on top.gg and receive 5 Bento 🍱`, `https://top.gg/bot/787041583580184609/vote`)
					.setFooter(
						`Bento 🍱 is created by Banner#1017`,
						(await client.users.fetch(`232584569289703424`)).avatarURL({
							dynamic: true,
						}) as string,
					)
					.setTimestamp()
				await messageLogChannel.send(embed)
			} else {
				return
			}
		} catch {
			return
		}
	},
}
