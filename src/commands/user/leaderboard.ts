import { Command } from '../../interfaces'
import database from '../../database/database'
import { Message, MessageEmbed, MessageReaction, User } from 'discord.js'
import { QueryTypes } from 'sequelize'
import { urlToColours } from '../../utils/urlToColours'

interface Rankings {
	rank: string
	level?: number
	xp?: number
	bento?: number
	userID: string
	username?: string
	discriminator?: string
}

interface rpsGameAttributes {
	paperWins?: number
	paperTies?: number
	paperLosses?: number
	rockWins?: number
	rockTies?: number
	rockLosses?: number
	scissorWins?: number
	scissorsLosses?: number
	scissorsTies?: number
	id: number
	userID: bigint
	rank?: number
	wins?: number
	ties?: number
	losses?: number
	username?: string
	discriminator?: string
}

export const command: Command = {
	name: `leaderboard`,
	aliases: [`ranking`, `rankings`, `lb`],
	category: `user`,
	description: `Shows the XP/level leaderboard for a server, globally for the bot, or global/local Bentos 🍱`,
	usage: `leaderboard [global] to see message/xp leaderboard, where the global argument shows globally for the bot.\nleaderboard bento [global] shows leaderboard for the amount of Bento 🍱 with a global option as well.\nleaderboard rps [paper, rock, scissors, all] [wins, ties, losses] shows the server leaderboard for the RPS game, where it's possible to order by wins, ties and losses. By adding global before rock, paper and scissor, it is then possible to view the global leaderboard.`,
	website: `https://www.bentobot.xyz/commands#leaderboard`,
	run: async (client, message, args): Promise<Message | void> => {
		try {
			if (!args.length) {
				return serverLeaderboard(message)
			}

			if (args[0] === `global`) {
				return globalLeaderboard(message)
			}

			if (args[0] === `bento` && args[1] === `global`) {
				return bentoGlobalLeaderboard(message)
			}

			if (args[0] === `bento`) {
				return bentoServerLeaderboard(message)
			}

			if (args[0] === `rps`) {
				if (args[1] === `lb`) return rpsServerLeaderboard(message, args[2], args[3])
				if (args[1] === `leaderboard`) return rpsServerLeaderboard(message, args[2], args[3])
				if (args[1] === `global`) return rpsGlobalLeaderboard(message, args[2], args[3])
				// user, where it's possible to tag a user
				return rpsServerLeaderboard(message)
			}

			if (args[0] === `web`) {
				return message.channel.send(`https://www.bentobot.xyz/leaderboard/${message?.guild?.id}`)
			}
		} catch (err) {
			console.log(`Error at leaderboard.ts, server ${message.guild?.id}\n\n${err}`)
		}

		async function serverLeaderboard(message: Message) {
			try {
				const serverRank: Array<Rankings> = await database.query(
					`
            SELECT row_number() over () as rank, t.level, t.xp, u.username, u.discriminator
            FROM "guildMember" AS t
            INNER JOIN "user" u on u."userID" = t."userID"
            WHERE t."guildID" = :guild
            GROUP BY t.level, t.xp, u.username, u.discriminator
            ORDER BY t.level DESC, t.xp DESC
            LIMIT 50;`,
					{
						replacements: { guild: message?.guild?.id },
						type: QueryTypes.SELECT,
					},
				)
				if (!serverRank.length) return message.channel.send(`error`)
				let currentPage = 0
				const embeds = generateServerLBembed(serverRank, message)
				const queueEmbed = await message.channel.send(
					`Current Page: ${currentPage + 1}/${(await embeds).length}`,
					(
						await embeds
					)[currentPage],
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
						if (currentPage < (await embeds).length - 1) {
							currentPage++
							reaction.users.remove(user)
							queueEmbed.edit(`Current Page: ${currentPage + 1}/${(await embeds).length}`, (await embeds)[currentPage])
						}
					} else if (reaction.emoji.name === `⬅️`) {
						if (currentPage !== 0) {
							--currentPage
							reaction.users.remove(user)
							queueEmbed.edit(`Current Page ${currentPage + 1}/${(await embeds).length}`, (await embeds)[currentPage])
						}
					} else {
						collector.stop()
						await queueEmbed.delete()
					}
				})
			} catch (err) {
				console.log(`Error at leaderboard.ts' serverlb function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function globalLeaderboard(message: Message) {
			try {
				interface Rankings {
					rank: string
					level?: number
					xp?: number
					bento?: number
					userID: string
				}
				const globalRank: Array<Rankings> = await database.query(
					`
            SELECT row_number() over (ORDER BY t.level DESC, t.xp DESC) AS rank, t.level, t.xp, t.username, t.discriminator
            FROM "user" AS t
            GROUP BY t.level, t.xp, t.username, t.discriminator
            ORDER BY t.level DESC, t.xp DESC
            LIMIT 50;`,
					{ type: QueryTypes.SELECT },
				)
				let currentPage = 0
				const embeds = generateGlobalLBembed(globalRank)
				const queueEmbed = await message.channel.send(
					`Current Page: ${currentPage + 1}/${(await embeds).length}`,
					(
						await embeds
					)[currentPage],
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
						if (currentPage < (await embeds).length - 1) {
							currentPage++
							reaction.users.remove(user)
							queueEmbed.edit(`Current Page: ${currentPage + 1}/${(await embeds).length}`, (await embeds)[currentPage])
						}
					} else if (reaction.emoji.name === `⬅️`) {
						if (currentPage !== 0) {
							--currentPage
							reaction.users.remove(user)
							queueEmbed.edit(`Current Page ${currentPage + 1}/${(await embeds).length}`, (await embeds)[currentPage])
						}
					} else {
						collector.stop()
						await queueEmbed.delete()
					}
				})
			} catch (err) {
				console.log(`Error at leaderboard.ts' globallb function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function bentoGlobalLeaderboard(message: Message) {
			try {
				interface Rankings {
					rank: string
					level?: number
					xp?: number
					bento?: number
					userID: string
				}
				const bentoRank: Array<Rankings> = await database.query(
					`
            SELECT row_number() over (ORDER BY t.bento DESC) AS rank, t.bento, u.username, u.discriminator
            FROM bento AS t
            INNER JOIN "user" u on u."userID" = t."userID"
            GROUP BY t.bento, u.username, u.discriminator
            ORDER BY t.bento DESC
            LIMIT 50;`,
					{ type: QueryTypes.SELECT },
				)
				if (!bentoRank.length) return message.channel.send(`error`)
				let currentPage = 0
				const embeds = generateGlobalBentoEmbed(bentoRank)
				const queueEmbed = await message.channel.send(
					`Current Page: ${currentPage + 1}/${(await embeds).length}`,
					(
						await embeds
					)[currentPage],
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
						if (currentPage < (await embeds).length - 1) {
							currentPage++
							reaction.users.remove(user)
							queueEmbed.edit(`Current Page: ${currentPage + 1}/${(await embeds).length}`, (await embeds)[currentPage])
						}
					} else if (reaction.emoji.name === `⬅️`) {
						if (currentPage !== 0) {
							--currentPage
							reaction.users.remove(user)
							queueEmbed.edit(`Current Page ${currentPage + 1}/${(await embeds).length}`, (await embeds)[currentPage])
						}
					} else {
						collector.stop()
						await queueEmbed.delete()
					}
				})
			} catch (err) {
				console.log(`Error at leaderboard.ts' globalbento function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function bentoServerLeaderboard(message: Message) {
			try {
				interface Rankings {
					rank: string
					level?: number
					xp?: number
					bento?: number
					userID: string
				}
				const serverRank: Array<Rankings> = await database.query(
					`
            SELECT row_number() over (ORDER BY t.bento DESC) AS rank, t.bento, u.username, u.discriminator
            FROM bento AS t
            INNER JOIN "user" u on u."userID" = t."userID"
            INNER JOIN "guildMember" gM on u."userID" = gM."userID"
            WHERE gM."guildID" = :guild
            GROUP BY t.bento, u.username, u.discriminator
            ORDER BY t.bento DESC
            LIMIT 50;`,
					{
						replacements: { guild: message?.guild?.id },
						type: QueryTypes.SELECT,
					},
				)
				if (!serverRank.length) return message.channel.send(`error`)
				let currentPage = 0
				const embeds = generateServerBentoEmbed(serverRank, message)
				const queueEmbed = await message.channel.send(
					`Current Page: ${currentPage + 1}/${(await embeds).length}`,
					(
						await embeds
					)[currentPage],
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
						if (currentPage < (await embeds).length - 1) {
							currentPage++
							reaction.users.remove(user)
							queueEmbed.edit(`Current Page: ${currentPage + 1}/${(await embeds).length}`, (await embeds)[currentPage])
						}
					} else if (reaction.emoji.name === `⬅️`) {
						if (currentPage !== 0) {
							--currentPage
							reaction.users.remove(user)
							queueEmbed.edit(`Current Page ${currentPage + 1}/${(await embeds).length}`, (await embeds)[currentPage])
						}
					} else {
						collector.stop()
						await queueEmbed.delete()
					}
				})
			} catch (err) {
				console.log(`Error at leaderboard.ts' serverbento function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function rpsServerLeaderboard(message: Message, gameType?: string, order?: string) {
			try {
				let rpsGameData: rpsGameAttributes[] | undefined
				if (order) {
					const potentialOrders = [`wins`, `losses`, `ties`]
					if (!potentialOrders.includes(order)) {
						return message.channel.send(
							`The listed value you wanted to order by is not valid.\nYou can only order by wins, ties and losses.`,
						)
					}
				}
				let gameTypeName: string | undefined
				if (gameType) {
					if (gameType === `paper`) {
						gameTypeName = `Paper`
						if (order === `ties`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."paperTies" DESC, t."paperWins" DESC, t."paperLosses" DESC
							) as rank, t."userID", t."paperWins" AS wins, t."paperTies" AS ties, t."paperLosses" AS losses
							FROM "rpsGame" AS t
							INNER JOIN "guildMember" gM on t."userID" = gM."userID"
							WHERE gm."guildID" = :guild AND t."paperWins" + t."paperTies" + t."paperLosses" != 0
							ORDER BY t."paperTies" DESC, t."paperWins" DESC, t."paperLosses" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else if (order === `losses`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."paperLosses" DESC, t."paperWins" DESC, t."paperTies" DESC
							) as rank, t."userID", t."paperWins" AS wins, t."paperTies" AS ties, t."paperLosses" AS losses
							FROM "rpsGame" AS t
							INNER JOIN "guildMember" gM on t."userID" = gM."userID"
							WHERE gm."guildID" = :guild AND t."paperWins" + t."paperTies" + t."paperLosses" != 0
							ORDER BY t."paperLosses" DESC, t."paperWins" DESC, t."paperTies" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."paperWins" DESC, t."paperTies" DESC, t."paperLosses" DESC
							) as rank, t."userID", t."paperWins" AS wins, t."paperTies" AS ties, t."paperLosses" AS losses
							FROM "rpsGame" AS t
							INNER JOIN "guildMember" gM on t."userID" = gM."userID"
							WHERE gm."guildID" = :guild AND t."paperWins" + t."paperTies" + t."paperLosses" != 0
							ORDER BY t."paperWins" DESC, t."paperTies" DESC, t."paperLosses" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						}
					}
					if (gameType === `rock`) {
						gameTypeName = `Rock`
						if (order === `ties`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."rockTies" DESC, t."rockWins" DESC, t."rockLosses" DESC
							) as rank, t."userID", t."rockWins" AS wins, t."rockTies" as ties, t."rockLosses" AS losses
							FROM "rpsGame" AS t
							INNER JOIN "guildMember" gM on t."userID" = gM."userID"
							WHERE gm."guildID" = :guild AND t."rockWins" + t."rockTies" + t."rockLosses" != 0
							ORDER BY t."rockTies" DESC, t."rockWins" DESC, t."rockLosses" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else if (order === `losses`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."rockLosses" DESC, t."rockWins" DESC, t."rockTies" DESC
							) as rank, t."userID", t."rockWins" AS wins, t."rockTies" as ties, t."rockLosses" AS losses
							FROM "rpsGame" AS t
							INNER JOIN "guildMember" gM on t."userID" = gM."userID"
							WHERE gm."guildID" = :guild AND t."rockWins" + t."rockTies" + t."rockLosses" != 0
							ORDER BY t."rockLosses" DESC, t."rockWins" DESC, t."rockTies" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."rockWins" DESC, t."rockTies" DESC, t."rockLosses" DESC
							) as rank, t."userID", t."rockWins" AS wins, t."rockTies" as ties, t."rockLosses" AS losses
							FROM "rpsGame" AS t
							INNER JOIN "guildMember" gM on t."userID" = gM."userID"
							WHERE gm."guildID" = :guild AND t."rockWins" + t."rockTies" + t."rockLosses" != 0
							ORDER BY t."rockWins" DESC, t."rockTies" DESC, t."rockLosses" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						}
					}
					if (gameType === `scissors`) {
						gameTypeName = `Scissors`
						if (order === `ties`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."scissorsTies" DESC, t."scissorWins" DESC, t."scissorsLosses" DESC
							) as rank, t."userID", t."scissorWins" AS wins, t."scissorsTies" AS ties, t."scissorsLosses" AS losses
							FROM "rpsGame" AS t
							INNER JOIN "guildMember" gM on t."userID" = gM."userID"
							WHERE gm."guildID" = :guild AND t."scissorWins" + t."scissorsTies" + t."scissorsLosses" != 0
							ORDER BY t."scissorsTies" DESC, t."scissorWins" DESC, t."scissorsLosses" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else if (order === `losses`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."scissorsLosses" DESC, t."scissorWins" DESC, t."scissorsTies" DESC
							) as rank, t."userID", t."scissorWins" AS wins, t."scissorsTies" AS ties, t."scissorsLosses" AS losses
							FROM "rpsGame" AS t
							INNER JOIN "guildMember" gM on t."userID" = gM."userID"
							WHERE gm."guildID" = :guild AND t."scissorWins" + t."scissorsTies" + t."scissorsLosses" != 0
							ORDER BY t."scissorsLosses" DESC, t."scissorWins" DESC, t."scissorsTies" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."scissorWins" DESC, t."scissorsTies" DESC, t."scissorsLosses" DESC
							) as rank, t."userID", t."scissorWins" AS wins, t."scissorsTies" AS ties, t."scissorsLosses" AS losses
							FROM "rpsGame" AS t
							INNER JOIN "guildMember" gM on t."userID" = gM."userID"
							WHERE gm."guildID" = :guild AND t."scissorWins" + t."scissorsTies" + t."scissorsLosses" != 0
							ORDER BY t."scissorWins" DESC, t."scissorsTies" DESC, t."scissorsLosses" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						}
					}
					if (gameType === `all`) {
						gameTypeName = `all`
						if (order === `wins`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY SUM(t."paperWins" + t."rockWins" + t."scissorWins") DESC, SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") DESC, SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") DESC
							) as rank, t."userID", SUM(t."paperWins" + t."rockWins" + t."scissorWins") as wins, SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") as ties, SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") as losses
							FROM "rpsGame" AS t
							INNER JOIN "guildMember" gM on t."userID" = gM."userID"
							WHERE gm."guildID" = :guild
							GROUP BY t."userID"
							ORDER BY wins DESC, ties DESC, losses DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else if (order === `ties`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") DESC, SUM(t."paperWins" + t."rockWins" + t."scissorWins") DESC, SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") DESC
							) as rank, t."userID", SUM(t."paperWins" + t."rockWins" + t."scissorWins") as wins, SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") as ties, SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") as losses
							FROM "rpsGame" AS t
							INNER JOIN "guildMember" gM on t."userID" = gM."userID"
							WHERE gm."guildID" = :guild
							GROUP BY t."userID"
							ORDER BY ties DESC, wins DESC, losses DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else if (order === `losses`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") DESC, SUM(t."paperWins" + t."rockWins" + t."scissorWins") DESC, SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") DESC
							) as rank, t."userID", SUM(t."paperWins" + t."rockWins" + t."scissorWins") as wins, SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") as ties, SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") as losses
							FROM "rpsGame" AS t
							INNER JOIN "guildMember" gM on t."userID" = gM."userID"
							WHERE gm."guildID" = :guild
							GROUP BY t."userID"
							ORDER BY losses DESC, wins DESC, ties DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY SUM(t."paperWins" + t."rockWins" + t."scissorWins") DESC, SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") DESC, SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") DESC
							) as rank, t."userID", SUM(t."paperWins" + t."rockWins" + t."scissorWins") as wins, SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") as ties, SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") as losses
							FROM "rpsGame" AS t
							INNER JOIN "guildMember" gM on t."userID" = gM."userID"
							WHERE gm."guildID" = :guild
							GROUP BY t."userID"
							ORDER BY wins DESC, ties DESC, losses DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						}
					}
				} else {
					gameTypeName = `all`
					rpsGameData = await database.query(
						`
							SELECT row_number() over (ORDER BY SUM(t."paperWins" + t."rockWins" + t."scissorWins") DESC, SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") DESC, SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") DESC
							) as rank, t."userID", SUM(t."paperWins" + t."rockWins" + t."scissorWins") as wins, SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") as ties, SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") as losses
							FROM "rpsGame" AS t
							INNER JOIN "guildMember" gM on t."userID" = gM."userID"
							WHERE gm."guildID" = :guild
							GROUP BY t."userID"
							ORDER BY wins DESC, ties DESC, losses DESC
							LIMIT 50;`,
						{
							replacements: { guild: message?.guild?.id },
							type: QueryTypes.SELECT,
						},
					)
				}

				if (!rpsGameData?.length) return message.channel.send(`No RPS games has been played on this server.`)
				let currentPage = 0
				const embeds = await generateRpsServerLeaderboard(rpsGameData, message, gameTypeName as string, order)
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
			} catch (err) {
				console.log(`Error at leaderboard.ts' serverlb function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function rpsGlobalLeaderboard(message: Message, gameType?: string, order?: string) {
			try {
				let rpsGameData: rpsGameAttributes[] | undefined
				if (order) {
					const potentialOrders = [`wins`, `losses`, `ties`]
					if (!potentialOrders.includes(order)) {
						return message.channel.send(
							`The listed value you wanted to order by is not valid.\nYou can only order by wins, ties and losses.`,
						)
					}
				}
				let gameTypeName: string | undefined
				if (gameType) {
					if (gameType === `paper`) {
						gameTypeName = `Paper`
						if (order === `ties`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."paperTies" DESC, t."paperWins" DESC, t."paperLosses" DESC
							) as rank, t."userID", t."paperWins" AS wins, t."paperTies" AS ties, t."paperLosses" AS losses,
								u.username, u.discriminator
							FROM "rpsGame" AS t
							INNER JOIN "user" u on u."userID" = t."userID"
							WHERE t."paperWins" + t."paperTies" + t."paperLosses" != 0
							GROUP BY t."userID", u.username, u.discriminator, t."paperWins", t."paperTies", t."paperLosses"
							ORDER BY t."paperTies" DESC, t."paperWins" DESC, t."paperLosses" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else if (order === `losses`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."paperLosses" DESC, t."paperWins" DESC, t."paperTies" DESC
							) as rank, t."userID", t."paperWins" AS wins, t."paperTies" AS ties, t."paperLosses" AS losses,
								u.username, u.discriminator
							FROM "rpsGame" AS t
							INNER JOIN "user" u on u."userID" = t."userID"
							WHERE t."paperWins" + t."paperTies" + t."paperLosses" != 0
							GROUP BY t."userID", u.username, u.discriminator, t."paperWins", t."paperTies", t."paperLosses"
							ORDER BY t."paperLosses" DESC, t."paperWins" DESC, t."paperTies" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."paperWins" DESC, t."paperTies" DESC, t."paperLosses" DESC
							) as rank, t."userID", t."paperWins" AS wins, t."paperTies" AS ties, t."paperLosses" AS losses,
								u.username, u.discriminator
							FROM "rpsGame" AS t
							INNER JOIN "user" u on u."userID" = t."userID"
                            WHERE t."paperWins" + t."paperTies" + t."paperLosses" != 0
							GROUP BY t."userID", u.username, u.discriminator, t."paperWins", t."paperTies", t."paperLosses"
							ORDER BY t."paperWins" DESC, t."paperTies" DESC, t."paperLosses" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						}
					}
					if (gameType === `rock`) {
						gameTypeName = `Rock`
						if (order === `ties`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."rockTies" DESC, t."rockWins" DESC, t."rockLosses" DESC
							) as rank, t."userID", t."rockWins" AS wins, t."rockTies" as ties, t."rockLosses" AS losses,
								u.username, u.discriminator
							FROM "rpsGame" AS t
							INNER JOIN "user" u on u."userID" = t."userID"
							WHERE t."rockWins" + t."rockTies" + t."rockLosses" != 0
							GROUP BY t."userID", u.username, u.discriminator, t."rockWins", t."rockTies", t."rockLosses"
							ORDER BY t."rockTies" DESC, t."rockWins" DESC, t."rockLosses" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else if (order === `losses`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."rockLosses" DESC, t."rockWins" DESC, t."rockTies" DESC
							) as rank, t."userID", t."rockWins" AS wins, t."rockTies" as ties, t."rockLosses" AS losses,
								u.username, u.discriminator
							FROM "rpsGame" AS t
							INNER JOIN "user" u on u."userID" = t."userID"
							WHERE t."rockWins" + t."rockTies" + t."rockLosses" != 0
							GROUP BY t."userID", u.username, u.discriminator, t."rockWins", t."rockTies", t."rockLosses"
							ORDER BY t."rockLosses" DESC, t."rockWins" DESC, t."rockTies" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."rockWins" DESC, t."rockTies" DESC, t."rockLosses" DESC
							) as rank, t."userID", t."rockWins" AS wins, t."rockTies" as ties, t."rockLosses" AS losses,
								u.username, u.discriminator
							FROM "rpsGame" AS t
							INNER JOIN "user" u on u."userID" = t."userID"
							WHERE t."rockWins" + t."rockTies" + t."rockLosses" != 0
							GROUP BY t."userID", u.username, u.discriminator, t."rockWins", t."rockTies", t."rockLosses"
							ORDER BY t."rockWins" DESC, t."rockTies" DESC, t."rockLosses" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						}
					}
					if (gameType === `scissors`) {
						gameTypeName = `Scissors`
						if (order === `ties`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."scissorsTies" DESC, t."scissorWins" DESC, t."scissorsLosses" DESC
							) as rank, t."userID", t."scissorWins" AS wins, t."scissorsTies" AS ties, t."scissorsLosses" AS losses,
								u.username, u.discriminator
							FROM "rpsGame" AS t
							INNER JOIN "user" u on u."userID" = t."userID"
							WHERE t."scissorWins" + t."scissorsTies" + t."scissorsLosses" != 0
							GROUP BY t."userID", u.username, u.discriminator, t."scissorWins", t."scissorsTies", t."scissorsLosses"
							ORDER BY t."scissorsTies" DESC, t."scissorWins" DESC, t."scissorsLosses" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else if (order === `losses`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."scissorsLosses" DESC, t."scissorWins" DESC, t."scissorsTies" DESC
							) as rank, t."userID", t."scissorWins" AS wins, t."scissorsTies" AS ties, t."scissorsLosses" AS losses,
								u.username, u.discriminator
							FROM "rpsGame" AS t
							INNER JOIN "user" u on u."userID" = t."userID"
							WHERE t."scissorWins" + t."scissorsTies" + t."scissorsLosses" != 0
							GROUP BY t."userID", u.username, u.discriminator, t."scissorWins", t."scissorsTies", t."scissorsLosses"
							ORDER BY t."scissorsLosses" DESC, t."scissorWins" DESC, t."scissorsTies" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY t."scissorWins" DESC, t."scissorsTies" DESC, t."scissorsLosses" DESC
							) as rank, t."userID", t."scissorWins" AS wins, t."scissorsTies" AS ties, t."scissorsLosses" AS losses,
								u.username, u.discriminator
							FROM "rpsGame" AS t
							INNER JOIN "user" u on u."userID" = t."userID"
							WHERE t."scissorWins" + t."scissorsTies" + t."scissorsLosses" != 0
							GROUP BY t."userID", u.username, u.discriminator, t."scissorWins", t."scissorsTies", t."scissorsLosses"
							ORDER BY t."scissorWins" DESC, t."scissorsTies" DESC, t."scissorsLosses" DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						}
					}
					if (gameType === `all`) {
						gameTypeName = `all`
						if (order === `ties`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") DESC, SUM(t."paperWins" + t."rockWins" + t."scissorWins") DESC, SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") DESC
							) as rank, t."userID", SUM(t."paperWins" + t."rockWins" + t."scissorWins") as wins, SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") as ties, SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") as losses,
								u.username, u.discriminator
							FROM "rpsGame" AS t
							INNER JOIN "user" u on u."userID" = t."userID"
							GROUP BY t."userID", u.username, u.discriminator
							ORDER BY ties DESC, wins DESC, losses DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else if (order === `losses`) {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") DESC, SUM(t."paperWins" + t."rockWins" + t."scissorWins") DESC, SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") DESC
							) as rank, t."userID", SUM(t."paperWins" + t."rockWins" + t."scissorWins") as wins, SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") as ties, SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") as losses,
								u.username, u.discriminator
							FROM "rpsGame" AS t
							INNER JOIN "user" u on u."userID" = t."userID"
							GROUP BY t."userID", u.username, u.discriminator
							ORDER BY losses DESC, wins DESC, ties DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						} else {
							rpsGameData = await database.query(
								`
							SELECT row_number() over (ORDER BY SUM(t."paperWins" + t."rockWins" + t."scissorWins") DESC, SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") DESC, SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") DESC
							) as rank, t."userID", SUM(t."paperWins" + t."rockWins" + t."scissorWins") as wins, SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") as ties, SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") as losses,
								u.username, u.discriminator
							FROM "rpsGame" AS t
							INNER JOIN "user" u on u."userID" = t."userID"
							GROUP BY t."userID", u.username, u.discriminator
							ORDER BY wins DESC, ties DESC, losses DESC
							LIMIT 50;`,
								{
									replacements: { guild: message?.guild?.id },
									type: QueryTypes.SELECT,
								},
							)
						}
					}
				} else {
					gameTypeName = `all`
					rpsGameData = await database.query(
						`
							SELECT row_number() over (ORDER BY SUM(t."paperWins" + t."rockWins" + t."scissorWins") DESC,
								SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") DESC,
								SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") DESC
							) as rank,
								t."userID",
								SUM(t."paperWins" + t."rockWins" + t."scissorWins") as wins,
								SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") as ties,
								SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") as losses,
								u.username, u.discriminator
							FROM "rpsGame" AS t
							INNER JOIN "user" u on u."userID" = t."userID"
							GROUP BY t."userID", u.username, u.discriminator
							ORDER BY wins DESC, ties DESC, losses DESC
							LIMIT 50;`,
						{
							replacements: { guild: message?.guild?.id },
							type: QueryTypes.SELECT,
						},
					)
				}

				if (!rpsGameData?.length) return message.channel.send(`No RPS games has been played on this server.`)
				let currentPage = 0
				const embeds = await generateRpsGlobalLeaderboard(rpsGameData, message, gameTypeName as string, order)
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
			} catch (err) {
				console.log(`Error at leaderboard.ts' serverlb function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function generateRpsServerLeaderboard(
			input: rpsGameAttributes[],
			message: Message,
			gameType: string,
			order?: string,
		) {
			const embeds = []
			let k = 10
			for (let i = 0; i < input.length; i += 10) {
				const current = input.slice(i, k)
				//let j = i;
				k += 10
				// det foroven skærer, så det kun bliver 10 pr. page.
				const embed = new MessageEmbed()
				embed.setColor(
					`${
						message?.guild?.iconURL()
							? await urlToColours(message?.guild?.iconURL({ format: `png` }) as string)
							: await urlToColours(client?.user?.avatarURL({ format: `png` }) as string)
					}`,
				)
				embed.setTimestamp()
				const info = current
					.map(
						(user) =>
							`${user.rank}. ${message.guild?.members.cache.get(`${user.userID}`)}\n${user.wins} Wins, ${
								user.ties
							} Ties, ${user.losses} Losses, ${(
								winRateCalculation(Number(user.wins), Number(user.wins) + Number(user.ties) + Number(user.losses)) * 100
							).toFixed(2)}% Win Rate`,
					)
					.join(`\n`)
				embed.setDescription(`${order ? `Ordered by __${order}__\n` : ``}${info}`)
				embed.setTitle(
					`RPS Leaderboard for ${message?.guild?.name}${gameType === `all` ? `` : `, ranked by ${gameType}`}`,
				)
				embed.setThumbnail(
					message?.guild?.iconURL({ dynamic: true, format: `png` })
						? (message?.guild?.iconURL({
								dynamic: true,
								format: `png`,
						  }) as string)
						: (client?.user?.avatarURL() as string),
				)
				embeds.push(embed)
			}
			return embeds
		}

		async function generateRpsGlobalLeaderboard(
			input: rpsGameAttributes[],
			message: Message,
			gameType: string,
			order?: string,
		) {
			const embeds = []
			let k = 10
			for (let i = 0; i < input.length; i += 10) {
				const current = input.slice(i, k)
				//let j = i;
				k += 10
				// det foroven skærer, så det kun bliver 10 pr. page.
				const embed = new MessageEmbed()
				embed.setColor(`${await urlToColours(client?.user?.avatarURL({ format: `png` }) as string)}`)
				embed.setTimestamp()
				const info = current
					.map(
						(user) =>
							`**${user.rank}. ${user.username}#${user.discriminator}**\n${user.wins} Wins, ${user.ties} Ties, ${
								user.losses
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							} Losses, ${(
								winRateCalculation(Number(user.wins), Number(user.wins) + Number(user.ties) + Number(user.losses)) * 100
							).toFixed(2)}% Win Rate`,
					)
					.join(`\n`)
				embed.setDescription(`${order ? `Ordered by __${order}__\n` : ``}${info}`)
				embed.setTitle(`RPS Leaderboard for Bento 🍱${gameType === `all` ? `` : `, ranked by ${gameType}`}`)
				embed.setThumbnail(client?.user?.avatarURL() as string)
				embeds.push(embed)
			}
			return embeds
		}

		async function generateGlobalLBembed(input: Rankings[]) {
			const embeds = []
			let k = 10
			for (let i = 0; i < input.length; i += 10) {
				const current = input.slice(i, k)
				//let j = i;
				k += 10
				// det foroven skærer, så det kun bliver 10 pr. page.
				const embed = new MessageEmbed()
				embed.setColor(`${await urlToColours(client?.user?.displayAvatarURL({ format: `png` }) as string)}`)
				embed.setTimestamp()
				const info = current.map((user) => `${user.rank}. ${user.username}#${user.discriminator}`).join(`\n`)
				embed.setDescription(`${info}`)
				embed.setTitle(`Leaderboard for ${client?.user?.username}`)
				embed.setURL(`https://bentobot.xyz/leaderboard`)
				embed.setThumbnail(
					client?.user?.displayAvatarURL({
						dynamic: true,
						format: `png`,
					}) as string,
				)
				embeds.push(embed)
			}
			return embeds
		}

		async function generateServerLBembed(input: Rankings[], message: Message) {
			const embeds = []
			let k = 10
			for (let i = 0; i < input.length; i += 10) {
				const current = input.slice(i, k)
				//let j = i;
				k += 10
				// det foroven skærer, så det kun bliver 10 pr. page.
				const embed = new MessageEmbed()
				embed.setColor(
					`${
						message?.guild?.iconURL()
							? await urlToColours(message?.guild?.iconURL({ format: `png` }) as string)
							: await urlToColours(client?.user?.avatarURL({ format: `png` }) as string)
					}`,
				)
				embed.setTimestamp()
				const info = current.map((user) => `${user.rank}. ${user.username}#${user.discriminator}`).join(`\n`)
				embed.setDescription(`${info}`)
				embed.setURL(`https://bentobot.xyz/leaderboard/${message.guild?.id}`)
				embed.setTitle(`Leaderboard for ${message?.guild?.name}`)
				embed.setThumbnail(
					message?.guild?.iconURL({ dynamic: true, format: `png` })
						? (message?.guild?.iconURL({
								dynamic: true,
								format: `png`,
						  }) as string)
						: (client?.user?.avatarURL() as string),
				)
				embeds.push(embed)
			}
			return embeds
		}

		async function generateServerBentoEmbed(input: Rankings[], message: Message) {
			const embeds = []
			let k = 10
			for (let i = 0; i < input.length; i += 10) {
				const current = input.slice(i, k)
				//let j = i;
				k += 10
				const embed = new MessageEmbed()
				embed.setColor(
					`${
						message?.guild?.iconURL()
							? await urlToColours(message.guild.iconURL({ format: `png` }) as string)
							: await urlToColours(client?.user?.avatarURL({ format: `png` }) as string)
					}`,
				)
				embed.setTimestamp()
				const info = current
					.map((user) => `${user.rank}. ${user.username}#${user.discriminator} - ${user.bento} Bento 🍱`)
					.join(`\n`)
				embed.setDescription(`${info}`)
				embed.setTitle(`Leaderboard for ${message?.guild?.name}`)
				embed.setThumbnail(
					message?.guild?.iconURL({ dynamic: true, format: `png` })
						? (message.guild.iconURL({
								dynamic: true,
								format: `png`,
						  }) as string)
						: (client?.user?.avatarURL() as string),
				)
				embeds.push(embed)
			}
			return embeds
		}

		async function generateGlobalBentoEmbed(input: Rankings[]) {
			const embeds = []
			let k = 10
			for (let i = 0; i < input.length; i += 10) {
				const current = input.slice(i, k)
				//let j = i;
				k += 10
				const info = current
					.map((user) => `${user.rank}. ${user.username + `#` + user.discriminator} - ${user.bento} Bento 🍱`)
					.join(`\n`)
				const embed = new MessageEmbed()
				embed.setColor(`${await urlToColours(client?.user?.displayAvatarURL({ format: `png` }) as string)}`)
				embed.setDescription(`${info}`)
				embed.setTimestamp()
				embed.setTitle(`Bento 🍱 Leaderboard for ${client?.user?.username}`)
				embed.setThumbnail(
					client?.user?.displayAvatarURL({
						dynamic: true,
						format: `png`,
					}) as string,
				)
				embeds.push(embed)
			}
			return embeds
		}

		function winRateCalculation(a: number, b: number) {
			const c = a / b
			return c
		}
	},
}
