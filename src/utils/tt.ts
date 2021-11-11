import { MessageEmbed, MessageAttachment, Util } from 'discord.js'
import moment, { months } from 'moment'
import fetch from 'node-fetch'
import { getVideoMeta } from 'tiktok-scraper'
import * as dotenv from 'dotenv'
dotenv.config()

const proxyArray: string[] = [
	`${process.env.tiktokproxy1}`,
	`${process.env.tiktokproxy2}`,
	`${process.env.tiktokproxy3}`,
	`${process.env.tiktokproxy4}`,
	`${process.env.tiktokproxy5}`,
]

export async function ttEmbedding(URL: string): Promise<(MessageAttachment | MessageEmbed)[] | void> {
	try {
		const query: RegExpMatchArray = URL.match(/\bhttps?:\/\/\S+/gi) as RegExpMatchArray
		const finalQuery: string = query.toString()
		const randomProxy: string = proxyArray[Math.floor(Math.random() * months.length)]
		const videoMeta = await getVideoMeta(finalQuery, { proxy: randomProxy })
		const video = videoMeta.collector[0]
		const videoURL = video.videoUrl
		const headers = videoMeta.headers
		const response = await fetch(videoURL, {
			method: `GET`,
			headers: {
				'user-agent': headers[`user-agent`],
				referer: headers.referer as string,
				cookie: headers.cookie as string,
			},
		})
		const buffer = await response.buffer()
		try {
			const embed = new MessageEmbed()
				.setTitle(`${Util.escapeMarkdown(video.text)}`)
				.setFooter(moment.unix(video.createTime).format(`dddd, MMMM Do YYYY, h:mm A Z`))
				//.setTimestamp(moment.unix(video.createTime).toDate())
				.setColor(`#000000`)
				.setAuthor(video.authorMeta.name, video.authorMeta.avatar, `https://www.tiktok.com/@${video.authorMeta.name}?`)
			const finalVideo = new MessageAttachment(buffer, `video.mp4`)
			return [finalVideo, embed]
		} catch {
			return
		}
	} catch {
		return
	}
}
