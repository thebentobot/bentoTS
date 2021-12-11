import { Command } from '../../interfaces'
import { capitalize, horoSigns, horoSignsLow, urlToColours } from '../../utils'
import database from '../../database/database'
import {
	initModels,
	guild,
	horoscope,
	horoscopeCreationAttributes,
	horoscopeAttributes,
} from '../../database/models/init-models'
import { Message, MessageEmbed, MessageReaction, User } from 'discord.js'
//const aztroJs = require("aztro-js");
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as aztroJs from 'aztro-js'
import chroma from 'chroma-js'
import { QueryTypes } from 'sequelize'

export const command: Command = {
	name: `horoscope`,
	aliases: [`horo`, `astro`, `zodiac`, `hs`],
	category: `features`,
	description: `Provides a horoscope based on day and sign. If you search signs, it provides a list of signs and their date range`,
	usage: `**horoscope <save> <sign>** to save your horoscope\n**horoscope <today/tomorrow/yesterday> [sign or a user mention/id]** to show horoscope for a given day and for a given user\nIf you don't specify a user or sign, then it will check for yourself. If you don't mention anything and have a sign saved, it shows for today.\n**horoscope list** shows a list of all users on the server who has saved their horoscope.\n**horoscope search <query>** makes you able to search for users who has a specific horoscope.`,
	website: `https://www.bentobot.xyz/commands#horoscope`,
	run: async (client, message, args): Promise<Message | undefined> => {
		console.log(`Reached ${command.name}.ts, guildID: ${message.guild?.id}`)

		try {
			if (!args.length) {
				return horoToday(message)
			}

			if (args[0] === `save`) {
				return horoSave(message, args[1])
			}

			if (args[0] === `tomorrow`) {
				return horoTomorrow(message, args[1])
			}

			if (args[0] === `today`) {
				return horoToday(message, args[1])
			}

			if (args[0] === `yesterday`) {
				return horoYesterday(message, args[1])
			}

			if (args[0] === `search`) {
				return horoSearch(message, args[1])
			}

			if (args[0] === `list`) {
				return horoList(message)
			}

			if (args[0] === `sign`) {
				return message.channel.send(
					`https://i.pinimg.com/736x/43/aa/50/43aa50c918f3bd03abb71b6d4aaf93c7--new-zodiac-signs-zodiac-signs-and-dates.jpg`,
				)
			}

			if (args[0] === `signs`) {
				return message.channel.send(
					`https://i.pinimg.com/736x/43/aa/50/43aa50c918f3bd03abb71b6d4aaf93c7--new-zodiac-signs-zodiac-signs-and-dates.jpg`,
				)
			}

			if (args[0]) {
				return horoToday(message, args[0])
			}
		} catch (err) {
			console.log(`Error at horoscope.ts, server ${message.guild?.id}\n\n${err}`)
		}

		async function horoSave(message: Message, input?: string) {
			try {
				if (!input) return message.channel.send(``)
				initModels(database)

				let sign: string

				const userID = message.author.id

				if (horoSigns.includes(input) || horoSignsLow.includes(input)) {
					sign = capitalize(input)
				} else {
					const guildData = await guild.findOne({
						raw: true,
						where: { guildID: message.guild?.id },
					})
					return message.channel.send(
						`Your request was invalid. You wrote the wrong sign or misspelled the sign.\nUse \`${guildData?.prefix}signs\` to see a list of horoscopes, or \`${guildData?.prefix}help horoscope\` for help with your request.`,
					)
				}

				let horoAttr: horoscopeCreationAttributes | undefined

				if (sign === `Aries`) {
					horoAttr = {
						userID: BigInt(userID),
						horoscope: `Aries`,
					}
				}

				if (sign === `Aquarius`) {
					horoAttr = {
						userID: BigInt(userID),
						horoscope: `Aquarius`,
					}
				}

				if (sign === `Cancer`) {
					horoAttr = {
						userID: BigInt(userID),
						horoscope: `Cancer`,
					}
				}

				if (sign === `Capricorn`) {
					horoAttr = {
						userID: BigInt(userID),
						horoscope: `Capricorn`,
					}
				}

				if (sign === `Gemini`) {
					horoAttr = {
						userID: BigInt(userID),
						horoscope: `Gemini`,
					}
				}

				if (sign === `Leo`) {
					horoAttr = {
						userID: BigInt(userID),
						horoscope: `Leo`,
					}
				}

				if (sign === `Libra`) {
					horoAttr = {
						userID: BigInt(userID),
						horoscope: `Libra`,
					}
				}

				if (sign === `Pisces`) {
					horoAttr = {
						userID: BigInt(userID),
						horoscope: `Pisces`,
					}
				}

				if (sign === `Sagittarius`) {
					horoAttr = {
						userID: BigInt(userID),
						horoscope: `Sagittarius`,
					}
				}

				if (sign === `Scorpio`) {
					horoAttr = {
						userID: BigInt(userID),
						horoscope: `Scorpio`,
					}
				}

				if (sign === `Taurus`) {
					horoAttr = {
						userID: BigInt(userID),
						horoscope: `Taurus`,
					}
				}

				if (sign === `Virgo`) {
					horoAttr = {
						userID: BigInt(userID),
						horoscope: `Virgo`,
					}
				}
				try {
					const horoscopeData = await horoscope.findOrCreate({
						raw: true,
						where: { userID: message.author.id },
						defaults: horoAttr,
					})
					if (horoscopeData[1] === false) {
						if (sign === `Aries`) {
							await horoscope.update({ horoscope: `Aries` }, { where: { userID: message.author.id } })
							return message.channel.send(
								`${message.author} your horoscope \`${capitalize(
									sign,
								)}\` was updated!\nYou can now use horoscope commands without signs, to see your horoscope.`,
							)
						}
						if (sign === `Aquarius`) {
							await horoscope.update({ horoscope: `Aquarius` }, { where: { userID: message.author.id } })
							return message.channel.send(
								`${message.author} your horoscope \`${capitalize(
									sign,
								)}\` was updated!\nYou can now use horoscope commands without signs, to see your horoscope.`,
							)
						}
						if (sign === `Cancer`) {
							await horoscope.update({ horoscope: `Cancer` }, { where: { userID: message.author.id } })
							return message.channel.send(
								`${message.author} your horoscope \`${capitalize(
									sign,
								)}\` was updated!\nYou can now use horoscope commands without signs, to see your horoscope.`,
							)
						}
						if (sign === `Capricorn`) {
							await horoscope.update({ horoscope: `Capricorn` }, { where: { userID: message.author.id } })
							return message.channel.send(
								`${message.author} your horoscope \`${capitalize(
									sign,
								)}\` was updated!\nYou can now use horoscope commands without signs, to see your horoscope.`,
							)
						}
						if (sign === `Gemini`) {
							await horoscope.update({ horoscope: `Gemini` }, { where: { userID: message.author.id } })
							return message.channel.send(
								`${message.author} your horoscope \`${capitalize(
									sign,
								)}\` was updated!\nYou can now use horoscope commands without signs, to see your horoscope.`,
							)
						}
						if (sign === `Leo`) {
							await horoscope.update({ horoscope: `Leo` }, { where: { userID: message.author.id } })
							return message.channel.send(
								`${message.author} your horoscope \`${capitalize(
									sign,
								)}\` was updated!\nYou can now use horoscope commands without signs, to see your horoscope.`,
							)
						}
						if (sign === `Libra`) {
							await horoscope.update({ horoscope: `Libra` }, { where: { userID: message.author.id } })
							return message.channel.send(
								`${message.author} your horoscope \`${capitalize(
									sign,
								)}\` was updated!\nYou can now use horoscope commands without signs, to see your horoscope.`,
							)
						}
						if (sign === `Pisces`) {
							await horoscope.update({ horoscope: `Pisces` }, { where: { userID: message.author.id } })
							return message.channel.send(
								`${message.author} your horoscope \`${capitalize(
									sign,
								)}\` was updated!\nYou can now use horoscope commands without signs, to see your horoscope.`,
							)
						}
						if (sign === `Sagittarius`) {
							await horoscope.update({ horoscope: `Sagittarius` }, { where: { userID: message.author.id } })
							return message.channel.send(
								`${message.author} your horoscope \`${capitalize(
									sign,
								)}\` was updated!\nYou can now use horoscope commands without signs, to see your horoscope.`,
							)
						}
						if (sign === `Scorpio`) {
							await horoscope.update({ horoscope: `Scorpio` }, { where: { userID: message.author.id } })
							return message.channel.send(
								`${message.author} your horoscope \`${capitalize(
									sign,
								)}\` was updated!\nYou can now use horoscope commands without signs, to see your horoscope.`,
							)
						}
						if (sign === `Taurus`) {
							await horoscope.update({ horoscope: `Taurus` }, { where: { userID: message.author.id } })
							return message.channel.send(
								`${message.author} your horoscope \`${capitalize(
									sign,
								)}\` was updated!\nYou can now use horoscope commands without signs, to see your horoscope.`,
							)
						}
						if (sign === `Virgo`) {
							await horoscope.update({ horoscope: `Virgo` }, { where: { userID: message.author.id } })
							return message.channel.send(
								`${message.author} your horoscope \`${capitalize(
									sign,
								)}\` was updated!\nYou can now use horoscope commands without signs, to see your horoscope.`,
							)
						}
					} else {
						return message.channel.send(
							`${message.author} your horoscope \`${capitalize(
								sign,
							)}\` was saved!\nYou can now use horoscope commands without signs, to see your horoscope.`,
						)
					}
				} catch {
					return message.channel.send(`Database error, couldn't save your horoscope. I am sorry :-(`)
				}
			} catch (err) {
				console.log(`Error at horoscope.ts' save function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function horoToday(message: Message, input?: string) {
			try {
				initModels(database)
				const inputParsing = input ? input : `Not there`
				let userID: string | undefined
				let sign: string | undefined

				if (horoSigns.includes(inputParsing) || horoSignsLow.includes(inputParsing)) {
					sign = inputParsing
				} else {
					try {
						const mentionedUser = message.mentions.members?.has(client.user?.id as string)
							? message.mentions.members.size > 1
								? message.mentions.members.last()
								: message.member
							: message.mentions.members?.first() || (await message.guild?.members.fetch(inputParsing))
						if (mentionedUser?.user.bot === true) return message.channel.send(`A bot doesn't have a horoscope`)
						userID = mentionedUser?.id
						try {
							const horoData = await horoscope.findOne({
								raw: true,
								where: { userID: userID },
							})
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							sign = horoData!.horoscope
						} catch {
							return message.channel.send(
								`${mentionedUser?.user.username}#${mentionedUser?.user.discriminator} hasn't saved their horoscope.`,
							)
						}
					} catch {
						try {
							const horoData = await horoscope.findOne({
								raw: true,
								where: { userID: message.author.id },
							})
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							sign = horoData!.horoscope
						} catch {
							const guildData = await guild.findOne({
								raw: true,
								where: { guildID: message.guild?.id },
							})
							return message.channel.send(
								`Your request was invalid. Either you wrote the wrong sign or the user you inserted hasn't saved their sign.\nUse \`${guildData?.prefix}help horoscope\` for help with your request.`,
							)
						}
					}
				}

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				aztroJs.getTodaysHoroscope(sign, async function (res: any) {
					const colour: string = res.color
					const exampleEmbed = new MessageEmbed()
						.setAuthor(
							`${userID ? message.guild?.members.cache.get(userID)?.user.username : message.author.username}`,
							userID
								? (message.guild?.members.cache.get(userID)?.user.avatarURL({ format: `png`, dynamic: true }) as string)
								: (message.author.avatarURL({
										format: `png`,
										dynamic: true,
								  }) as string),
						)
						.setTitle(`${capitalize(sign as string)} horoscope for ${res.current_date}`)
						.setDescription(res.description)
						.setTimestamp()
						.addFields(
							{
								name: `Date Range`,
								value: `Between ${res.date_range}`,
								inline: true,
							},
							{
								name: `Compatibility 😳`,
								value: `${res.compatibility} 😏`,
								inline: true,
							},
							{ name: `Mood`, value: `${res.mood}`, inline: true },
							{ name: `Colour`, value: `${res.color}`, inline: true },
							{
								name: `Lucky number`,
								value: `${res.lucky_number}`,
								inline: true,
							},
							{ name: `Lucky time`, value: `${res.lucky_time}`, inline: true },
						)
					try {
						exampleEmbed.setColor(chroma(colour).hex())
					} catch {
						exampleEmbed.setColor(
							`${
								userID
									? await urlToColours(
											message.guild?.members.cache.get(userID)?.user.avatarURL({ format: `png` }) as string,
									  )
									: await urlToColours(message.author.avatarURL({ format: `png` }) as string)
							}`,
						)
					}
					return message.channel.send(exampleEmbed)
				})
			} catch (err) {
				console.log(`Error at horoscope.ts' today function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function horoTomorrow(message: Message, input?: string) {
			try {
				initModels(database)

				const inputParsing = input ? input : `Not there`

				let userID: string | undefined
				let sign: string | undefined

				if (horoSigns.includes(inputParsing) || horoSignsLow.includes(inputParsing)) {
					sign = input
				} else {
					try {
						const mentionedUser = message.mentions.members?.has(client.user?.id as string)
							? message.mentions.members.size > 1
								? message.mentions.members.last()
								: message.member
							: message.mentions.members?.first() || (await message.guild?.members.fetch(inputParsing))
						if (mentionedUser?.user.bot === true) return message.channel.send(`A bot doesn't have a horoscope`)
						userID = mentionedUser?.id
						try {
							const horoData = await horoscope.findOne({
								raw: true,
								where: { userID: userID },
							})
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							sign = horoData!.horoscope
						} catch {
							return message.channel.send(
								`${mentionedUser?.user.username}#${mentionedUser?.user.discriminator} hasn't saved their horoscope.`,
							)
						}
					} catch {
						try {
							const horoData = await horoscope.findOne({
								raw: true,
								where: { userID: message.author.id },
							})
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							sign = horoData!.horoscope
						} catch {
							const guildData = await guild.findOne({
								raw: true,
								where: { guildID: message.guild?.id },
							})
							return message.channel.send(
								`Your request was invalid. Either you wrote the wrong sign or the user you inserted hasn't saved their sign.\nUse \`${guildData?.prefix}help horoscope\` for help with your request.`,
							)
						}
					}
				}

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				aztroJs.getTomorrowsHoroscope(sign, async function (res: any) {
					const colour: string = res.color
					const exampleEmbed = new MessageEmbed()
						.setAuthor(
							`${userID ? message.guild?.members.cache.get(userID)?.user.username : message.author.username}`,
							userID
								? (message.guild?.members.cache.get(userID)?.user.avatarURL({ format: `png`, dynamic: true }) as string)
								: (message.author.avatarURL({
										format: `png`,
										dynamic: true,
								  }) as string),
						)
						.setTitle(`${capitalize(sign as string)} horoscope for ${res.current_date}`)
						.setDescription(res.description)
						.setTimestamp()
						.addFields(
							{
								name: `Date Range`,
								value: `Between ${res.date_range}`,
								inline: true,
							},
							{
								name: `Compatibility 😳`,
								value: `${res.compatibility} 😏`,
								inline: true,
							},
							{ name: `Mood`, value: `${res.mood}`, inline: true },
							{ name: `Colour`, value: `${res.color}`, inline: true },
							{
								name: `Lucky number`,
								value: `${res.lucky_number}`,
								inline: true,
							},
							{ name: `Lucky time`, value: `${res.lucky_time}`, inline: true },
						)
					try {
						exampleEmbed.setColor(chroma(colour).hex())
					} catch {
						exampleEmbed.setColor(
							`${
								userID
									? await urlToColours(
											message.guild?.members.cache.get(userID)?.user.avatarURL({ format: `png` }) as string,
									  )
									: await urlToColours(message.author.avatarURL({ format: `png` }) as string)
							}`,
						)
					}
					return message.channel.send(exampleEmbed)
				})
			} catch (err) {
				console.log(`Error at horoscope.ts' tomorrow function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function horoYesterday(message: Message, input?: string) {
			try {
				initModels(database)

				const inputParsing = input ? input : `Not there`

				let userID: string | undefined
				let sign: string | undefined

				if (horoSigns.includes(inputParsing) || horoSignsLow.includes(inputParsing)) {
					sign = input
				} else {
					try {
						const mentionedUser = message.mentions.members?.has(client.user?.id as string)
							? message.mentions.members.size > 1
								? message.mentions.members.last()
								: message.member
							: message.mentions.members?.first() || (await message.guild?.members.fetch(inputParsing))
						if (mentionedUser?.user.bot === true) return message.channel.send(`A bot doesn't have a horoscope`)
						userID = mentionedUser?.id
						try {
							const horoData = await horoscope.findOne({
								raw: true,
								where: { userID: userID },
							})
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							sign = horoData!.horoscope
						} catch {
							return message.channel.send(
								`${mentionedUser?.user.username}#${mentionedUser?.user.discriminator} hasn't saved their horoscope.`,
							)
						}
					} catch {
						try {
							const horoData = await horoscope.findOne({
								raw: true,
								where: { userID: message.author.id },
							})
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							sign = horoData!.horoscope
						} catch {
							const guildData = await guild.findOne({
								raw: true,
								where: { guildID: message.guild?.id },
							})
							return message.channel.send(
								`Your request was invalid. Either you wrote the wrong sign or the user you inserted hasn't saved their sign.\nUse \`${guildData?.prefix}help horoscope\` for help with your request.`,
							)
						}
					}
				}

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				aztroJs.getYesterdaysHoroscope(sign, async function (res: any) {
					const colour: string = res.color
					const exampleEmbed = new MessageEmbed()
						.setAuthor(
							`${userID ? message.guild?.members.cache.get(userID)?.user.username : message.author.username}`,
							userID
								? (message.guild?.members.cache.get(userID)?.user.avatarURL({ format: `png`, dynamic: true }) as string)
								: (message.author.avatarURL({
										format: `png`,
										dynamic: true,
								  }) as string),
						)
						.setTitle(`${capitalize(sign as string)} horoscope for ${res.current_date}`)
						.setDescription(res.description)
						.setTimestamp()
						.addFields(
							{
								name: `Date Range`,
								value: `Between ${res.date_range}`,
								inline: true,
							},
							{
								name: `Compatibility 😳`,
								value: `${res.compatibility} 😏`,
								inline: true,
							},
							{ name: `Mood`, value: `${res.mood}`, inline: true },
							{ name: `Colour`, value: `${res.color}`, inline: true },
							{
								name: `Lucky number`,
								value: `${res.lucky_number}`,
								inline: true,
							},
							{ name: `Lucky time`, value: `${res.lucky_time}`, inline: true },
						)
					try {
						exampleEmbed.setColor(chroma(colour).hex())
					} catch {
						exampleEmbed.setColor(
							`${
								userID
									? await urlToColours(
											message.guild?.members.cache.get(userID)?.user.avatarURL({ format: `png` }) as string,
									  )
									: await urlToColours(message.author.avatarURL({ format: `png` }) as string)
							}`,
						)
					}
					return message.channel.send(exampleEmbed)
				})
			} catch (err) {
				console.log(`Error at horoscope.ts' yesterday function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function horoList(message: Message) {
			try {
				interface horoscopeListInterface {
					userID: bigint
					username: string
					discriminator: string
					horoscope: horoscopeAttributes
				}
				const serverRank: Array<horoscopeListInterface> = await database.query(
					`
            SELECT u."userID", u.username, u.discriminator, horo.horoscope
            FROM horoscope AS horo
            INNER JOIN "user" u on u."userID" = horo."userID"
            INNER JOIN "guildMember" gM on u."userID" = gM."userID"
            WHERE "guildID" = :guild
            GROUP BY u."userID", u.username, u.discriminator, horo.horoscope
            ORDER BY u.username ASC;`,
					{
						replacements: { guild: message.guild?.id },
						type: QueryTypes.SELECT,
					},
				)

				if (!serverRank.length) {
					return message.channel.send(`No horoscopes are saved on this server.`)
				}

				let currentPage = 0
				const embeds = await generateHoroListEmbed(serverRank)
				const queueEmbed = await message.channel.send(
					`Current Page: ${currentPage + 1}/${embeds.length}`,
					embeds[currentPage],
				)
				await queueEmbed.react(`⬅️`)
				await queueEmbed.react(`➡️`)
				await queueEmbed.react(`❌`)
				const filter = (reaction: MessageReaction, user: User) =>
					[`⬅️`, `➡️`, `❌`].includes(reaction.emoji.name) && message.author.id === user.id
				const collector = queueEmbed.createReactionCollector(filter, {
					idle: 300000,
					dispose: true,
				})

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

				// eslint-disable-next-line no-inner-declarations
				async function generateHoroListEmbed(data: Array<horoscopeListInterface>) {
					const embeds = []
					let k = 10
					for (let i = 0; i < data.length; i += 10) {
						const current = data.slice(i, k)
						let j = i
						k += 10
						const info = current
							.map(
								(horoscope) =>
									`**${++j}.** ${message.guild?.members.cache.get(`${horoscope.userID}`)} - ${horoscope.horoscope}`,
							)
							.join(`\n`)
						const embed = new MessageEmbed()
							.setDescription(`${info}`)
							.setColor(
								message.guild?.iconURL()
									? `${await urlToColours(message.guild?.iconURL({ format: `png` }) as string)}`
									: `${await urlToColours(client.user?.displayAvatarURL({ format: `png` }) as string)}`,
							)
							.setTitle(`All horoscopes for ${message.guild?.name}`)
							.setThumbnail(message.guild?.iconURL() ? (message.guild.iconURL() as string) : ``)
							.setAuthor(
								message.guild?.iconURL() ? message.guild.name : client.user?.username,
								message.guild?.iconURL() ? (message.guild.iconURL() as string) : client.user?.displayAvatarURL(),
							)
							.setTimestamp()
						embeds.push(embed)
					}
					return embeds
				}
			} catch (err) {
				console.log(`Error at horoscope.ts' list function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function horoSearch(message: Message, query?: string) {
			try {
				if (!query) {
					return message.channel.send(`You need a search query.`)
				}
				interface horoscopeListInterface {
					userID: bigint
					username: string
					discriminator: string
					horoscope: horoscopeAttributes
				}
				const queryData: Array<horoscopeListInterface> = await database.query(
					`
            SELECT u."userID", u.username, u.discriminator, horo.horoscope
            FROM horoscope AS horo
            INNER JOIN "user" u on u."userID" = horo."userID"
            INNER JOIN "guildMember" gM on u."userID" = gM."userID"
            WHERE gM."guildID" = :guild AND horo.horoscope::text ILIKE :query
            GROUP BY u."userID", u.username, u.discriminator, horo.horoscope
            ORDER BY u.username ASC;`,
					{
						replacements: {
							guild: message.guild?.id,
							query: `%` + query.replace(`%`, ``).replace(`_`, ``).replace(/\\/g, `\\\\`).replace(`__`, ``) + `%`,
						},
						type: QueryTypes.SELECT,
					},
				)

				if (!queryData.length) {
					return message.channel.send(`No horoscopes found containing \`${query}\`.\nSearch for something else please.`)
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
				const collector = queueEmbed.createReactionCollector(filter)

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

				// eslint-disable-next-line no-inner-declarations
				async function generateTagSearchEmbed(data: Array<horoscopeListInterface>) {
					const embeds = []
					let k = 10
					for (let i = 0; i < data.length; i += 10) {
						const current = data.slice(i, k)
						let j = i
						k += 10
						// det foroven skærer, så det kun bliver 10 pr. page.
						const info = current
							.map(
								(horoscope) =>
									`**${++j}.** ${message.guild?.members.cache.get(`${horoscope.userID}`)} - ${horoscope.horoscope}`,
							)
							.join(`\n`)
						const embed = new MessageEmbed()
							.setDescription(`${info}`)
							.setColor(
								message.guild?.iconURL()
									? `${await urlToColours(message.guild.iconURL({ format: `png` }) as string)}`
									: `${await urlToColours(client.user?.displayAvatarURL({ format: `png` }) as string)}`,
							)
							.setTitle(`All horoscopes that includes \`${query}\``)
							.setThumbnail(message.guild?.iconURL() ? (message.guild.iconURL() as string) : ``)
							.setAuthor(
								message.guild?.iconURL() ? message.guild.name : client.user?.username,
								message.guild?.iconURL() ? (message.guild.iconURL() as string) : client.user?.displayAvatarURL(),
							)
							.setTimestamp()
						// denne funktion skal skubbe siderne
						embeds.push(embed)
					}
					return embeds
				}
			} catch (err) {
				console.log(`Error at horoscope.ts' search function, server ${message.guild?.id}\n\n${err}`)
			}
		}
	},
}
