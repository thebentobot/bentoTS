import { Command, gfycatInterface, gfycatSearchInterface } from '../../interfaces'
import axios from 'axios'
import utf8 from 'utf8'
import database from '../../database/database'
import { initModels, guild, gfycatBlacklist } from '../../database/models/init-models'
import * as dotenv from 'dotenv'
import { Message, TextChannel } from 'discord.js'
import moment from 'moment'
import naughtyWords from 'naughty-words/en.json'
dotenv.config()

const gfycatAPI = axios.create({
	baseURL: `https://api.gfycat.com/v1/`,
})

const tenorAPI = axios.create({
	baseURL: `https://api.tenor.com/v1`,
})

export let gfycatToken: string

async function newToken() {
	const gfycatAuthData = await axios.post(`https://api.gfycat.com/v1/oauth/token`, {
		client_id: `${process.env.gfycatclientID}`,
		client_secret: `${process.env.gfycatsecret}`,
		grant_type: `client_credentials`,
	})
	console.log(`The Gfycat Access Token expires in 1 hour`)
	gfycatToken = gfycatAuthData.data.access_token
}

newToken()

setInterval(newToken, 3600000)

export const command: Command = {
	name: `gif`,
	aliases: [],
	category: `features`,
	description:
		`Searches for a random GIF based on the search input.\nThe GIFs comes from Gfycat, who has removed adult content from their site, so no fear of NSFW content (NSFW filtering is applied just to be sure).\nIf you want to see multiple posts add \`--multi\` after the search input, and if you want to specify how many multiple posts it is \`--count\` followed by a number between 1-50.\n\`--tenor\` searches for GIFs with Tenor.\nTenor has a g-rated content filter for non-NSFW channels. The filter is off in NSFW channels. It is not possible to see multiple Tenor posts.`,
	usage: `gif <search input> [--tenor] [--multi [--count <number between 1-30>]]`,
	website: `https://www.bentobot.xyz/commands#gif`,
	run: async (client, message, args): Promise<Message> => {
		if (!args.length) {
			return message.channel.send(`You need to provide a search input!`).then((m) => m.delete({ timeout: 5000 }))
		}

		if (message.channel.type !== `text`) return

		const channelObject = message.channel as TextChannel

		initModels(database)

		const guildDB = await guild.findOne({ raw: true, where: { guildID: message.guild.id } })

		if (guildDB.media === false) return

		let messageParse: string[] = args

		if (args.includes(`--tenor`)) {
			let query: string
			let filter: string
			if (channelObject.nsfw === false) {
				query = args.join(` `).replace(`contentfilter`, ``).replace(`--tenor`, ``)
				filter = `high`
			} else {
				query = args.join(` `)
				filter = `off`
			}
			const response = await tenorAPI.get(`/search`, {
				params: { q: utf8.encode(query), key: process.env.TENORKEY, contentfilter: filter },
			})
			const index = Math.floor(Math.random() * response.data.results.length)
			if (!response.data.results.length) {
				return message.channel.send(`No GIFs found based on your search input \`${query}\`.`)
			} else {
				return message.channel.send(response.data.results[index].url)
			}
		}

		let returnMultipleGifs = false

		let count = 15

		const blacklistData = await gfycatBlacklist.findAll()

		if (args.includes(`--multi`)) {
			let getNumber = args.join(` `)
			if (args.includes(`--count`)) {
				getNumber = getNumber.match(/\d+/).pop()
				count = parseInt(getNumber)
				if (count > 30) return message.channel.send(`Sorry, 30 posts is the max.`)
			}
			messageParse = args.filter((msg) => msg !== `--multi` && msg !== `--count` && msg !== getNumber)
			returnMultipleGifs = true
		}

		const query: string = messageParse.join(` `)
		if (naughtyWords.includes(query))
			return message.channel.send(`No GIFs found based on your search input \`${query}\`.`)

		const response = await gfycatAPI.get<gfycatSearchInterface>(`gfycats/search`, {
			params: { search_text: utf8.encode(query), count: returnMultipleGifs === true ? count : 50 },
			headers: { Authorization: `Bearer ${gfycatToken}` },
		})
		if (!response.data.gfycats.length) {
			return message.channel.send(`No GIFs found based on your search input \`${query}\`.`)
		} else {
			let gfycatData = response.data.gfycats

			if (channelObject.nsfw !== true) {
				gfycatData = gfycatData.filter((gfy) => gfy.nsfw === `0`)
				gfycatData = gfycatData.filter((gfyUser) => {
					return !blacklistData.some((user) => user.username === `${gfyUser.userData?.username}`)
				})
			}

			if (returnMultipleGifs === false) {
				const waitingMessage = await message.channel.send(
					`Loading a random Gfycat Post related to \`${query}\` ... ⌛🐱`,
				)
				let index = Math.floor(Math.random() * gfycatData.length)
				let gfyTest
				await axios
					.get(gfycatData[index].mobileUrl)
					.then((res) => {
						gfyTest = res
					})
					.catch((error) => {})
				while (gfyTest?.status !== 200) {
					gfycatData = gfycatData.filter((gfy) => gfy.userData.username !== gfycatData[index].userData.username)
					index = Math.floor(Math.random() * gfycatData.length)
					await axios
						.get(gfycatData[index].mobileUrl)
						.then((res) => {
							gfyTest = res
						})
						.catch((error) => {})
				}
				waitingMessage.delete()
				return message.channel.send(`https://gfycat.com/${gfycatData[index].gfyName}`)
			} else {
				let currentPage = 0
				const waitingMessage = await message.channel.send(
					`Loading the multiple Gfycat Posts related to \`${query}\` ... ⌛🐱`,
				)
				const embeds = await generateGfyCatEmbed(gfycatData)
				if (!embeds.length) return message.channel.send(`No results based on your specifications`)
				waitingMessage.delete()
				const queueEmbed = await message.channel.send(
					`Current Gfycat: ${currentPage + 1}/${embeds.length}\n${embeds[currentPage]}`,
				)
				await queueEmbed.react(`⬅️`)
				await queueEmbed.react(`➡️`)
				await queueEmbed.react(`❌`)
				const filter = (reaction, user) =>
					[`⬅️`, `➡️`, `❌`].includes(reaction.emoji.name) && message.author.id === user.id
				const collector = queueEmbed.createReactionCollector(filter, { idle: 900000, dispose: true })

				collector.on(`collect`, async (reaction, user) => {
					if (reaction.emoji.name === `➡️`) {
						if (currentPage < embeds.length - 1) {
							currentPage++
							reaction.users.remove(user)
							queueEmbed.edit(`Current Gfycat: ${currentPage + 1}/${embeds.length}\n${embeds[currentPage]}`)
						}
					} else if (reaction.emoji.name === `⬅️`) {
						if (currentPage !== 0) {
							--currentPage
							reaction.users.remove(user)
							queueEmbed.edit(`Current Gfycat: ${currentPage + 1}/${embeds.length}\n${embeds[currentPage]}`)
						}
					} else {
						collector.stop()
						await queueEmbed.delete()
					}
				})

				async function generateGfyCatEmbed(gfycat: gfycatInterface[]) {
					const embeds = []
					let k = 1
					for (let i = 0; i < gfycat.length; i += 1) {
						const current = gfycat[i]
						const j = i
						k += 1

						const embed = `${current.title.length > 0 ? `**${current.title}**\n` : ``}${
							current.userData?.username.length ? `Made by <${current.userData.url}>\n` : ``
						}${current.views} Views\n<t:${current.createDate}:F>\nhttps://gfycat.com/${current.gfyName}`
						await axios
							.get(current.mobileUrl)
							.then((res) => {
								embeds.push(embed)
							})
							.catch((error) => {})
					}
					return embeds
				}
			}
		}
	},
}
