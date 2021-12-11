import { Message } from 'discord.js'
import { Command } from '../../interfaces'
import axios, { AxiosResponse } from 'axios'
import * as dotenv from 'dotenv'
dotenv.config()

const streamableAPI = axios.create({
	baseURL: `https://api.streamable.com/`,
})

export const command: Command = {
	name: `streamable`,
	aliases: [],
	category: `features`,
	description: `Get a Streamable link of your desired video. There is a 250 MB / 10 minute / up to 720p 60 fps limit per video.`,
	usage: `streamable <valid video URL or attachment> [title for the video]`,
	website: `https://www.bentobot.xyz/commands#streamable`,
	run: async (client, message, args): Promise<Message | undefined> => {
		console.log(`Reached ${command.name}.ts, guildID: ${message.guild?.id}`)

		try {
			let url: string
			let title: string
			let titleMessage: string
			if (message.attachments.size > 0) {
				const getUrl = message.attachments.array()
				url = getUrl[0] ? getUrl[0].url : ``
				titleMessage = args.slice(0).join(` `)
				title = titleMessage.length > 0 ? titleMessage : `${message.author.username}'s Streamable Video`
			} else {
				url = args[0]
				if (!url) return message.channel.send(`${message.author} You need to insert an URL to make a streamable of`)
				titleMessage = args.slice(1).join(` `)
				title = titleMessage.length > 0 ? titleMessage : `${message.author.username}'s Streamable Video`
			}
			let data: AxiosResponse | undefined
			await streamableAPI
				.get(`import?url=${url}&title=${title}`, {
					auth: {
						username: process.env.streamableUsername as string,
						password: process.env.streamablePassword as string,
					},
				})
				.then((res) => {
					data = res
				})
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				.catch(() => {})

			if (data?.status !== 200)
				return message.channel.send(
					`${message.author} Either your URL was invalid, or Streamable doesn't answer right now, try again 😔`,
				)

			if (data?.data?.status === 1) {
				const waitingMessage = await message.channel.send(`Waiting for Streamable to process the video... ⌛`) // https://stackoverflow.com/questions/53693209/get-message-id-of-the-message-sent-by-my-bot/53693480

				let streamableStatus = false
				let TMRError = false
				let loopCount = 0 // adding seconds to each attempt, to avoid TMR

				while (streamableStatus === false) {
					switch (loopCount) {
						case 0:
						case 1:
							await sleep(60000)
							break
						default:
							await sleep(120000)
					}
					if (loopCount === 1) {
						waitingMessage.edit(`Approx. 2 minutes has gone by since Streamable started processing the video ⌛`)
					}
					if (loopCount === 2) {
						waitingMessage.edit(`Approx. 4 minutes has gone by since Streamable started processing the video... ⌛🥱`)
					}
					if (loopCount === 3) {
						waitingMessage.edit(`Approx. 6 minutes has gone by since Streamable started processing the video ⌛😴`)
					}
					if (loopCount === 4) {
						waitingMessage.edit(`Approx. 8 minutes has gone by since Streamable started processing the video... ⚰️`)
					}
					if (loopCount === 5) {
						waitingMessage.edit(
							`Approx. 10 minutes has gone by since Streamable started processing the video and I don't bother counting anymore 😒`,
						)
					}
					++loopCount
					const percentData = await streamableAPI.get(`videos/${data.data?.shortcode}`, {
						auth: {
							username: process.env.streamableUsername as string,
							password: process.env.streamablePassword as string,
						},
					})
					if (percentData.status === 429) {
						TMRError = true
						break
					}
					if (percentData.data?.status === 2) {
						streamableStatus = true
						break
					}
				}

				if (TMRError === true || streamableStatus === false) {
					return message.channel.send(
						`${message.author} Error - Too many requests 😔 either your video is too big or Streamable is just stressed 🥺 I am sorry.`,
					)
				}

				if (streamableStatus === true) {
					waitingMessage.delete()
					return message.channel.send(
						`${message.author} your streamable is done now! https://streamable.com/${data.data?.shortcode}`,
					)
				}
			} else {
				return message.channel.send(`https://streamable.com/${data.data?.shortcode}`)
			}
		} catch (err) {
			console.log(`Error at streamable.ts, server ${message.guild?.id}\n\n${err}`)
		}
	},
}

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}
