import { Command } from '../../interfaces'
import { trim, urlToColours } from '../../utils/index'
import database from '../../database/database'
import { Message, MessageEmbed, MessageReaction, User, Util } from 'discord.js'
import { initModels, guild, tag, tagCreationAttributes } from '../../database/models/init-models'
import { Sequelize, QueryTypes } from 'sequelize'
import moment from 'moment'

// eslint-disable-next-line no-useless-escape
const regex = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/

export const command: Command = {
	name: `tag`,
	aliases: [`t`],
	category: `features`,
	description: `Add, delete, search, edit tags, get info about a tag or a list of all tags on a server`,
	usage: `tag <add> <tag name> <tag content>\ntag <delete> <tag name>\ntag <edit> <tag name> <tag content being edit>\ntag <info> <tag name>\ntag <list>\ntag <random> [search query]\ntag <rename> <tag name> <new tag name>\ntag <search> <query>\ntag <author> [mention a user or userID]\ntag <top>`,
	website: `https://www.bentobot.xyz/commands#tag`,
	run: async (client, message, args): Promise<Message | undefined> => {
		if (!args.length) {
			initModels(database)
			const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })
			return message.channel.send(
				`If you need help with tags, please use \`${guildData?.prefix}help tag\` to see instructions`,
			)
		}

		if (args[0] === `add`) {
			if (!args[1]) {
				return message.channel.send(`You didn't specify a tag name!`)
			}

			if (args[1].length > 20) {
				return message.channel.send(`Your tag name is too long. It must be under 20 characters.`)
			}

			if (!args[2] && !message.attachments.array()) {
				return message.channel.send(`You didn't attach any content for the tag \`${args[1]}\``)
			}

			return addTag(message, args[1])
		}

		if (args[0] === `delete`) {
			if (!args[1]) {
				return message.channel.send(`You didn't specify a tag name!`)
			}

			return removeTag(message, args[1])
		}

		if (args[0] === `edit`) {
			if (!args[1]) {
				return message.channel.send(`You didn't specify a tag name!`)
			}

			return editTag(message, args[1])
		}

		if (args[0] === `info`) {
			if (!args[1]) {
				return message.channel.send(`You didn't specify a tag name!`)
			}

			return infoTag(message, args[1])
		}

		if (args[0] === `list`) {
			return listTags(message)
		}

		if (args[0] === `random`) {
			return randomTag(message, args.slice(1).join(` `))
		}

		if (args[0] === `rename`) {
			return renameTag(message, args[1], args[2])
		}

		if (args[0] === `search`) {
			if (!args[1]) {
				return message.channel.send(`You didn't write a query!`)
			}

			return searchTag(message, args.slice(1).join(` `))
		}

		if (args[0] === `author`) {
			return authorTag(message, args[1])
		}

		if (args[0] === `top`) {
			return usageCountList(message)
		}

		if (args[0]) {
			initModels(database)
			const customCommand = await tag.findOne({ raw: true, where: { guildID: message.guild?.id, command: args[0] } })
			if (customCommand) {
				await tag.increment(`count`, {
					where: {
						command: customCommand.command,
						guildID: customCommand.guildID,
						content: customCommand.content,
						userID: customCommand.userID,
					},
				})
				return message.channel.send(customCommand.content)
			} else {
				const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })
				return message.channel.send(
					`Sorry, the tag ${args[0]} is not a tag on this server.\nIf you didn't intent to get a tag, please use \`${guildData?.prefix}help tag\` for help with tags.`,
				)
			}
		}

		async function addTag(message: Message, nameOfTag?: string) {
			const tagName = nameOfTag?.toLowerCase()
			if (regex.test(tagName as string) === true) {
				return message.channel.send(`You can't add special characters to your tag name \`${tagName}\``)
			}

			initModels(database)
			const cmdNameArray: string[] = client.commands.mapValues((values) => values.name).array() // returns cmd names of the bot
			const aliasesNameArray: string[] = client.aliases
				.each((values) => values.aliases)
				.mapValues((value) => value.aliases)
				.keyArray() // returns cmd aliases of the bot
			const tagArgs: string[] = [`add`, `delete`, `edit`, `info`, `list`, `random`, `rename`, `search`, `author`, `top`]

			if (cmdNameArray.includes(tagName as string)) {
				return message.channel.send(
					`The tag name \`${tagName}\` is either a command or an alias for a Bento 🍱 command.\nName your tag something else please.`,
				)
			}

			if (aliasesNameArray.includes(tagName as string)) {
				return message.channel.send(
					`The tag name \`${tagName}\` is either a command or an alias for a Bento 🍱 command.\nName your tag something else please.`,
				)
			}

			if (tagArgs.includes(tagName as string)) {
				return message.channel.send(
					`The tag name \`${tagName}\` is either a command or an alias for a Bento 🍱 command.\nName your tag something else please.`,
				)
			}

			let files: string | undefined
			let text: string | undefined
			let tagContent: string | undefined

			if (message.attachments.array() !== undefined) {
				const getUrl = message.attachments.array()
				files = getUrl[0] ? getUrl[0].url : ``
			}

			if (args.slice(2).join(` `) !== undefined) {
				text = args.slice(2).join(` `)
			}

			if (files && text) {
				tagContent = `${Util.escapeMarkdown(text)}\n${files}`
			} else if (text && !files) {
				tagContent = Util.escapeMarkdown(text)
			} else if (!text && files) {
				tagContent = files
			} else if (!text && !files) {
				return message.channel.send(`You didn't attach any content for the tag \`${tagName}\``)
			}

			const tagAttr: tagCreationAttributes = {
				userID: BigInt(message.author.id),
				guildID: BigInt(message.guild?.id as string),
				command: tagName as string,
				content: tagContent as string,
				count: 0,
			}

			const tagExists = await tag.findOrCreate({
				raw: true,
				where: { guildID: message.guild?.id, command: tagName },
				defaults: tagAttr,
			})

			if (tagExists[1] === false) {
				return message.channel.send(
					`The tag name \`${tagName}\` already exists on this server.\nName your tag something else please.`,
				)
			} else {
				return message.channel.send(
					`The tag \`${tagExists[0].command}\` was successfully saved!\nContent:\n${tagExists[0].content}`,
				)
			}
		}

		async function removeTag(message: Message, nameOfTag?: string) {
			const tagName = nameOfTag?.toLowerCase()
			initModels(database)

			const tagData = await tag.findOne({ raw: true, where: { guildID: message.guild?.id, command: tagName } })

			if (tagData === null) {
				const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })
				return message.channel.send(
					`The tag name \`${tagName}\` doesn't exist on this server.\nTry to search for the tag by using \`${guildData?.prefix}tag [query]\` or get help with tags by using \`${guildData?.prefix}help tag\``,
				)
			}

			if (message.author.id === `${tagData.userID}` || message.member?.permissions.has(`BAN_MEMBERS`)) {
				await tag.destroy({
					where: {
						guildID: tagData.guildID,
						userID: tagData.userID,
						command: tagData.command,
						content: tagData.content,
					},
				})
				return message.channel.send(`Successfully deleted the tag \`${tagName}\``)
			} else {
				const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })
				return message.channel.send(
					// eslint-disable-next-line no-useless-escape
					`You are not authorised to delete this tag.\nCheck who owns this tag by using the command \´${guildData?.prefix}tag info ${tagName}\´`,
				)
			}
		}

		async function editTag(message: Message, nameOfTag?: string) {
			const tagName = nameOfTag?.toLowerCase()
			initModels(database)

			const tagData = await tag.findOne({ raw: true, where: { guildID: message.guild?.id, command: tagName } })

			if (tagData === null) {
				const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })
				return message.channel.send(
					`The tag name \`${tagName}\` doesn't exist on this server.\nTry to search for the tag by using \`${guildData?.prefix}tag [query]\` or get help with tags by using \`${guildData?.prefix}help tag\``,
				)
			}

			if (message.author.id !== `${tagData.userID}` || !message.member?.permissions.has(`BAN_MEMBERS`)) {
				const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })
				return message.channel.send(
					`You are not authorised to edit this tag.\nCheck who owns this tag by using the command ${guildData?.prefix}tag info ${tagName}`,
				)
			}

			let files: string | undefined
			let text: string | undefined
			let tagContent: string | undefined

			if (message.attachments.array() !== undefined) {
				const getUrl = message.attachments.array()
				files = getUrl[0] ? getUrl[0].url : ``
			}

			if (args.slice(2).join(` `) !== undefined) {
				text = args.slice(2).join(` `)
			}

			if (files && text) {
				tagContent = `${Util.escapeMarkdown(text)}\n${files}`
			} else if (text && !files) {
				tagContent = Util.escapeMarkdown(text)
			} else if (!text && files) {
				tagContent = files
			} else if (!text && !files) {
				return message.channel.send(`You didn't attach any content for the tag \`${tagName}\``)
			}

			await tag.update(
				{ content: tagContent },
				{ where: { guildID: tagData.guildID, userID: tagData.userID, command: tagData.command } },
			)
			return message.channel.send(`The tag \`${tagData.command}\` got updated!\nThe content is now: \`${tagContent}\``)
		}

		async function infoTag(message: Message, nameOfTag?: string) {
			const tagName = nameOfTag?.toLowerCase()
			initModels(database)

			const tagData = await tag.findOne({ raw: true, where: { guildID: message.guild?.id, command: tagName } })

			if (tagData === null) {
				const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })
				return message.channel.send(
					`The tag name \`${tagName}\` doesn't exist on this server.\nTry to search for the tag by using \`${guildData?.prefix}tag [query]\` or get help with tags by using \`${guildData?.prefix}help tag\``,
				)
			}

			const embed = new MessageEmbed()
				.setTitle(tagData.command)
				.setAuthor(message.guild?.name, message.guild?.iconURL() as string)
				.setThumbnail(
					message.guild?.members.cache
						.get(`${tagData.userID}`)
						?.user.displayAvatarURL({ format: `png`, dynamic: true }) as string,
				)
				.setColor(
					`${await urlToColours(
						message.guild?.members.cache.get(`${tagData.userID}`)?.user.displayAvatarURL({ format: `png` }) as string,
					)}`,
				)
				.addField(
					`Author of the tag`,
					message.guild?.members.cache.get(`${tagData.userID}`)?.nickname
						? `${message.guild?.members.cache.get(`${tagData.userID}`)?.nickname} (${
								message.guild?.members.cache.get(`${tagData.userID}`)?.user.username +
								`#` +
								message.guild?.members.cache.get(`${tagData.userID}`)?.user.discriminator
						  })`
						: `${
								message.guild?.members.cache.get(`${tagData.userID}`)?.user.username +
								`#` +
								message.guild?.members.cache.get(`${tagData.userID}`)?.user.discriminator
						  }`,
				)
				.addField(`Content`, trim(tagData.content, 1024))
				.addField(`Date made`, `<t:${moment(tagData.date).format(`X`)}:F>`)
				.addField(`Usage count`, tagData.count > 1 ? `${tagData.count} times` : `${tagData.count} time`)

			return message.channel.send(embed)
		}

		async function listTags(message: Message) {
			initModels(database)

			const tagData = await tag.findAndCountAll({
				raw: true,
				where: { guildID: message.guild?.id },
				order: [
					[`command`, `DESC`],
					[`count`, `DESC`],
				],
			})
			if (tagData.count === 0) return message.channel.send(`This server does not have any tags.`)
			let currentPage = 0
			const embeds = await generateTagListEmbed(tagData)
			const queueEmbed = await message.channel.send(
				`Current Page: ${currentPage + 1}/${embeds.length}`,
				embeds[currentPage],
			)
			await queueEmbed.react(`⬅️`)
			await queueEmbed.react(`➡️`)
			await queueEmbed.react(`❌`)
			const filter = (reaction: MessageReaction, user: User) =>
				[`⬅️`, `➡️`, `❌`].includes(reaction.emoji.name) && message.author.id === user.id
			const collector = queueEmbed.createReactionCollector(filter, { idle: 300000, dispose: true })

			collector.on(`collect`, async (reaction, user) => {
				if (reaction.emoji.name === `➡️`) {
					if (currentPage < embeds.length - 1) {
						currentPage++
						reaction.users.remove(user)
						queueEmbed.edit(`Current Page: ${currentPage + 1}/${embeds.length}`, embeds[currentPage])
					}
				} else if (reaction.emoji.name === `⬅️`) {
					if (currentPage !== 0) {
						--currentPage
						reaction.users.remove(user)
						queueEmbed.edit(`Current Page ${currentPage + 1}/${embeds.length}`, embeds[currentPage])
					}
				} else {
					collector.stop()
					await queueEmbed.delete()
				}
			})

			async function generateTagListEmbed(data: { rows: tag[]; count: number }) {
				const actualData = data.rows
				const tagCount = data.count
				const embeds = []
				let k = 10
				for (let i = 0; i < actualData.length; i += 10) {
					const current = actualData.slice(i, k)
					let j = i
					k += 10
					// det foroven skærer, så det kun bliver 10 pr. page.
					const info = current.map((command) => `${++j}. ${command.command}`).join(`\n`)
					const embed = new MessageEmbed()
						.setDescription(`${info}`)
						.setColor(
							message.guild?.iconURL()
								? `${await urlToColours(message.guild?.iconURL({ format: `png` }) as string)}`
								: `${await urlToColours(client.user?.displayAvatarURL({ format: `png` }) as string)}`,
						)
						.setTitle(`All tags for ${message.guild?.name}`)
						.setAuthor(
							message.guild?.iconURL() ? message.guild?.name : client.user?.username,
							message.guild?.iconURL()
								? (message.guild?.iconURL() as string)
								: (client.user?.displayAvatarURL() as string),
						)
						.setFooter(`Total tags: ${tagCount}`)
						.setTimestamp()
					// denne funktion skal skubbe siderne
					embeds.push(embed)
				}
				return embeds
			}
		}

		async function randomTag(message: Message, query?: string) {
			if (query) {
				query.toLowerCase()

				interface randomTagInterface {
					command: string
					content: string
				}

				const queryData: Array<randomTagInterface> = await database.query(
					`
                SELECT *
                FROM tag
                WHERE "guildID" = :guild AND command LIKE :query`,
					{
						replacements: { guild: message.guild?.id, query: `%` + query + `%` },
						type: QueryTypes.SELECT,
					},
				)

				if (!queryData.length) {
					return message.channel.send(`No tags found containing \`${query}\`.\nSearch for something else please.`)
				}

				const randomNumber: number = Math.floor(Math.random() * queryData.length)

				return message.channel.send(`\`${queryData[randomNumber].command}\`\n${queryData[randomNumber].content}`)
			} else {
				initModels(database)

				const randomTag = await tag.findAll({
					raw: true,
					where: { guildID: message.guild?.id },
					order: Sequelize.literal(`random()`),
					limit: 1,
				})
				if (!randomTag.length) return message.channel.send(`No tags found for this server.`)

				return message.channel.send(`\`${randomTag[0].command}\`\n${randomTag[0].content}`)
			}
		}

		async function renameTag(message: Message, oldTagNameInsert?: string, newTagNameInsert?: string) {
			const oldTagName = oldTagNameInsert?.toLowerCase()
			const newTagName = newTagNameInsert?.toLowerCase()

			if (regex.test(newTagName as string) === true) {
				return message.channel.send(`You can't add special characters to your new tag name \`${newTagName}\``)
			}

			initModels(database)

			const oldTagData = await tag.findOne({ raw: true, where: { guildID: message.guild?.id, command: oldTagName } })

			if (oldTagData === null) {
				const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })
				return message.channel.send(
					`The tag name \`${oldTagName}\` doesn't exist on this server.\nTry to search for the tag by using \`${guildData?.prefix}tag [query]\` or get help with tags by using \`${guildData?.prefix}help tag\``,
				)
			}

			if (!message.member?.permissions.has(`MANAGE_GUILD`) || message.author.id !== `${oldTagData.userID}`) {
				const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })
				return message.channel.send(
					`You are not authorised to rename this tag.\nCheck who owns this tag by using the command ${guildData?.prefix}tag info ${oldTagName}`,
				)
			}

			const cmdNameArray: string[] = client.commands.mapValues((values) => values.name).array() // returns cmd names of the bot
			const aliasesNameArray: string[] = client.aliases
				.each((values) => values.aliases)
				.mapValues((value) => value.aliases)
				.keyArray() // returns cmd aliases of the bot
			const tagArgs: string[] = [`add`, `delete`, `edit`, `info`, `list`, `random`, `rename`, `search`, `author`, `top`]

			if (cmdNameArray.includes(newTagName as string)) {
				return message.channel.send(
					`The new tag name \`${newTagName}\` is a command name for a Bento 🍱 command.\nRename your tag something else please.`,
				)
			}

			if (aliasesNameArray.includes(newTagName as string)) {
				return message.channel.send(
					`The new tag name \`${newTagName}\` is an alias for a Bento 🍱 command.\nRename your tag something else please.`,
				)
			}

			if (tagArgs.includes(newTagName as string)) {
				return message.channel.send(
					`The new tag name \`${newTagName}\` is a tag argument.\nRename your tag something else please.`,
				)
			}

			const NewTagData = await tag.findOne({ raw: true, where: { guildID: message.guild?.id, command: newTagName } })

			if (NewTagData === null) {
				await tag.update(
					{ command: newTagName },
					{ where: { guildID: oldTagData.guildID, userID: oldTagData.userID, command: oldTagData.command } },
				)
				return message.channel.send(`The tag \`${oldTagName}\` got rename!\nThe tag is now called: \`${newTagName}\``)
			}
		}

		async function searchTag(message: Message, queryInsert?: string) {
			const query = queryInsert?.toLowerCase()

			const queryData: tag[] = await database.query(
				`
            SELECT *
            FROM tag
            WHERE "guildID" = :guild AND command LIKE :query`,
				{
					replacements: { guild: message.guild?.id, query: `%` + query + `%` },
					type: QueryTypes.SELECT,
				},
			)

			if (!queryData.length) {
				return message.channel.send(`No tags found containing \`${query}\`.\nSearch for something else please.`)
			}

			let currentPage = 0
			const embeds = await generateTagSearchEmbed(queryData)
			const queueEmbed = await message.channel.send(
				`Current Page: ${currentPage + 1}/${embeds.length}`,
				embeds[currentPage],
			)
			await queueEmbed.react(`⬅️`)
			await queueEmbed.react(`➡️`)
			await queueEmbed.react(`❌`)
			const filter = (reaction: MessageReaction, user: User) =>
				[`⬅️`, `➡️`, `❌`].includes(reaction.emoji.name) && message.author.id === user.id
			const collector = queueEmbed.createReactionCollector(filter, { idle: 300000, dispose: true })

			collector.on(`collect`, async (reaction, user) => {
				if (reaction.emoji.name === `➡️`) {
					if (currentPage < embeds.length - 1) {
						currentPage++
						reaction.users.remove(user)
						queueEmbed.edit(`Current Page: ${currentPage + 1}/${embeds.length}`, embeds[currentPage])
					}
				} else if (reaction.emoji.name === `⬅️`) {
					if (currentPage !== 0) {
						--currentPage
						reaction.users.remove(user)
						queueEmbed.edit(`Current Page ${currentPage + 1}/${embeds.length}`, embeds[currentPage])
					}
				} else {
					collector.stop()
					await queueEmbed.delete()
				}
			})

			async function generateTagSearchEmbed(data: tag[]) {
				const embeds = []
				let k = 10
				for (let i = 0; i < data.length; i += 10) {
					const current = data.slice(i, k)
					let j = i
					k += 10
					// det foroven skærer, så det kun bliver 10 pr. page.
					const info = current.map((command) => `${++j}. ${command.command}`).join(`\n`)
					const embed = new MessageEmbed()
						.setDescription(`${info}`)
						.setColor(
							message.guild?.iconURL()
								? `${await urlToColours(message.guild?.iconURL({ format: `png` }) as string)}`
								: `${await urlToColours(client.user?.displayAvatarURL({ format: `png` }) as string)}`,
						)
						.setTitle(`All tags that includes \`${query}\``)
						.setAuthor(
							message.guild?.iconURL() ? message.guild?.name : client.user?.username,
							message.guild?.iconURL() ? (message.guild?.iconURL() as string) : client.user?.displayAvatarURL(),
						)
						.setTimestamp()
					// denne funktion skal skubbe siderne
					embeds.push(embed)
				}
				return embeds
			}
		}

		async function authorTag(message: Message, user?: string) {
			initModels(database)

			let userID: string | undefined
			let commands: tag[]
			let commandCount: number

			try {
				const mentionedUser = message.mentions.members?.first() || (await message.guild?.members.fetch(user as string))
				if (mentionedUser?.user.bot === true) return message.channel.send(`This command doesn't work with bots.`)
				userID = mentionedUser?.id
				const tagData = await tag.findAndCountAll({
					raw: true,
					where: { userID: userID, guildID: message.guild?.id },
					order: [
						[`command`, `DESC`],
						[`count`, `DESC`],
					],
				})
				commands = tagData.rows
				commandCount = tagData.count
				if (tagData?.count === 0) {
					return message.channel.send(
						`Your mentioned user ${
							mentionedUser?.nickname
								? `${Util.removeMentions(mentionedUser?.nickname as string)} (${
										mentionedUser?.user.username + `#` + mentionedUser?.user.discriminator
								  })`
								: mentionedUser?.user.username + `#` + mentionedUser?.user.discriminator
						} hasn't created any tags.`,
					)
				}
			} catch {
				try {
					userID = message.author.id
					const tagData = await tag.findAndCountAll({
						raw: true,
						where: { userID: userID, guildID: message.guild?.id },
						order: [
							[`command`, `DESC`],
							[`count`, `DESC`],
						],
					})
					commands = tagData.rows
					commandCount = tagData.count
					if (tagData?.count === 0) {
						const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })
						return message.channel.send(
							`You haven't made any tags\nUse \`${guildData?.prefix}tag add <tag name> <tag content>\` to create a tag.\nUse \`${guildData?.prefix}help tag\` for help with your request.`,
						)
					}
				} catch {
					const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })
					return message.channel.send(
						`You haven't made any tags\nUse \`${guildData?.prefix}tag add <tag name> <tag content>\` to create a tag.\nUse \`${guildData?.prefix}help tag\` for help with your request.`,
					)
				}
			}

			let currentPage = 0
			const embeds = await generateTagAuthorEmbed(commands, commandCount)
			const queueEmbed = await message.channel.send(
				`Current Page: ${currentPage + 1}/${embeds.length}`,
				embeds[currentPage],
			)
			await queueEmbed.react(`⬅️`)
			await queueEmbed.react(`➡️`)
			await queueEmbed.react(`❌`)
			const filter = (reaction: MessageReaction, user: User) =>
				[`⬅️`, `➡️`, `❌`].includes(reaction.emoji.name) && message.author.id === user.id
			const collector = queueEmbed.createReactionCollector(filter, { idle: 300000, dispose: true })

			collector.on(`collect`, async (reaction, user) => {
				if (reaction.emoji.name === `➡️`) {
					if (currentPage < embeds.length - 1) {
						currentPage++
						reaction.users.remove(user)
						queueEmbed.edit(`Current Page: ${currentPage + 1}/${embeds.length}`, embeds[currentPage])
					}
				} else if (reaction.emoji.name === `⬅️`) {
					if (currentPage !== 0) {
						--currentPage
						reaction.users.remove(user)
						queueEmbed.edit(`Current Page ${currentPage + 1}/${embeds.length}`, embeds[currentPage])
					}
				} else {
					collector.stop()
					await queueEmbed.delete()
				}
			})

			async function generateTagAuthorEmbed(data: tag[], count: number) {
				const embeds = []
				let k = 10
				for (let i = 0; i < data.length; i += 10) {
					const current = data.slice(i, k)
					let j = i
					k += 10
					// det foroven skærer, så det kun bliver 10 pr. page.
					const info = current.map((command) => `${++j}. ${command.command}`).join(`\n`)
					const embed = new MessageEmbed()
						.setDescription(`${info}`)
						.setColor(
							`${
								userID
									? await urlToColours(
											message.guild?.members.cache.get(userID)?.user.avatarURL({ format: `png` }) as string,
									  )
									: await urlToColours(message.author?.avatarURL({ format: `png` }) as string)
							}`,
						)
						.setTitle(
							`All tags on ${message.guild?.name} created by ${
								message.guild?.members.cache.get(userID as string)?.nickname
									? `${message.guild?.members.cache.get(userID as string)?.nickname} (${
											message.guild?.members.cache.get(userID as string)?.user.username +
											`#` +
											message.guild?.members.cache.get(userID as string)?.user.discriminator
									  })`
									: message.guild?.members.cache.get(userID as string)?.user.username +
									  `#` +
									  message.guild?.members.cache.get(userID as string)?.user.discriminator
							}`,
						)
						.setAuthor(
							`${userID ? message.guild?.members.cache.get(userID)?.user.username : message.author.username}`,
							userID
								? (message.guild?.members.cache
										.get(userID as string)
										?.user.avatarURL({ format: `png`, dynamic: true }) as string)
								: (message.author.avatarURL({ format: `png`, dynamic: true }) as string),
						)
						.setFooter(`Total tags: ${count}`)
						.setThumbnail(
							userID
								? (message.guild?.members.cache.get(userID)?.user.avatarURL({ format: `png`, dynamic: true }) as string)
								: message.author.displayAvatarURL({ format: `png`, dynamic: true }),
						)
						.setTimestamp()
					// denne funktion skal skubbe siderne
					embeds.push(embed)
				}
				return embeds
			}
		}

		async function usageCountList(message: Message) {
			initModels(database)

			//let userID: string;
			let commands: tag[]
			let commandCount: number

			try {
				const tagData = await tag.findAndCountAll({
					raw: true,
					where: { guildID: message.guild?.id },
					order: [[`count`, `DESC`]],
				})
				commands = tagData.rows
				commandCount = tagData.count
				if (tagData?.count === 0) {
					const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })
					return message.channel.send(
						`This server hasn't made any tags\nUse \`${guildData?.prefix}tag add <tag name> <tag content>\` to create a tag.\nUse \`${guildData?.prefix}help tag\` for help with your request.`,
					)
				}
			} catch {
				const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })
				return message.channel.send(
					`This server hasn't made any tags\nUse \`${guildData?.prefix}tag add <tag name> <tag content>\` to create a tag.\nUse \`${guildData?.prefix}help tag\` for help with your request.`,
				)
			}

			let currentPage = 0
			const embeds = await generateTagAuthorEmbed(commands, commandCount)
			const queueEmbed = await message.channel.send(
				`Current Page: ${currentPage + 1}/${embeds.length}`,
				embeds[currentPage],
			)
			await queueEmbed.react(`⬅️`)
			await queueEmbed.react(`➡️`)
			await queueEmbed.react(`❌`)
			const filter = (reaction: MessageReaction, user: User) =>
				[`⬅️`, `➡️`, `❌`].includes(reaction.emoji.name) && message.author.id === user.id
			const collector = queueEmbed.createReactionCollector(filter, { idle: 300000, dispose: true })

			collector.on(`collect`, async (reaction, user) => {
				if (reaction.emoji.name === `➡️`) {
					if (currentPage < embeds.length - 1) {
						currentPage++
						reaction.users.remove(user)
						queueEmbed.edit(`Current Page: ${currentPage + 1}/${embeds.length}`, embeds[currentPage])
					}
				} else if (reaction.emoji.name === `⬅️`) {
					if (currentPage !== 0) {
						--currentPage
						reaction.users.remove(user)
						queueEmbed.edit(`Current Page ${currentPage + 1}/${embeds.length}`, embeds[currentPage])
					}
				} else {
					collector.stop()
					await queueEmbed.delete()
				}
			})

			async function generateTagAuthorEmbed(data: tag[], count: number) {
				const embeds = []
				let k = 10
				for (let i = 0; i < data.length; i += 10) {
					const current = data.slice(i, k)
					let j = i
					k += 10
					const info = current
						.map(
							(command) =>
								`**${++j}. ${command.command} - ${
									command.count > 1 ? `${command.count} uses` : `${command.count} use`
								}**`,
						)
						.join(`\n`)
					const embed = new MessageEmbed()
						.setDescription(`${info}`)
						.setColor(`${await urlToColours(message.guild?.iconURL({ format: `png` }) as string)}`)
						.setTitle(`Top tags used on ${message.guild?.name}`)
						.setFooter(`Total tags: ${count}`)
						.setThumbnail(message.guild?.iconURL({ format: `png`, dynamic: true }) as string)
						.setTimestamp()
					embeds.push(embed)
				}
				return embeds
			}
		}
	},
}
