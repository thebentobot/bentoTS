import { Command } from '../../interfaces'
import database from '../../database/database'
import {
	initModels,
	guild,
	lastfm,
	guildMember as guildMemberDB,
	profile,
	patreon,
	user as userDB,
	userCreationAttributes,
	guildMemberCreationAttributes,
} from '../../database/models/init-models'
import { Message, MessageAttachment } from 'discord.js'
import { QueryTypes } from 'sequelize'
import { getHTMLImage } from '../../utils/sushii-html'
import axios from 'axios'
import moment from 'moment'
import * as dotenv from 'dotenv'
import { lastfmRecentTracks } from '../../interfaces/lastfm'
dotenv.config()

const api_key = process.env.lastfm

const lastfmAPI = axios.create({
	baseURL: `https://ws.audioscrobbler.com/2.0`,
	params: { api_key: api_key, format: `json` },
})

export const command: Command = {
	name: `rank`,
	aliases: [`profile`, `level`],
	category: `user`,
	description: `Shows a user's profile which includes ranks for levels and bento, description and potentially other personalisation.`,
	usage: `rank [userID/mention a user]`,
	website: `https://www.bentobot.xyz/commands#rank`,
	run: async (client, message, args): Promise<Message | void> => {
		try {
			return userFunction(message, args[0])
		} catch (err) {
			console.log(`Error at rank.ts, server ${message.guild?.id}\n\n${err}`)
		}

		async function userFunction(message: Message, user: string) {
			try {
				interface Rankings {
					rank: number
					level?: number
					xp?: number
					bento?: number
					userID: string
				}

				const serverRank: Array<Rankings> = await database.query(
					`
            SELECT row_number() over () as rank, t.level, t.xp, t."userID"
            FROM "guildMember" AS t
            WHERE t."guildID" = :guild
            GROUP BY t.level, t.xp, t."userID"
            ORDER BY t.level DESC, t.xp DESC`,
					{
						replacements: { guild: message?.guild?.id },
						type: QueryTypes.SELECT,
					},
				)

				// does this database fetch cost too much?
				const globalRank: Array<Rankings> = await database.query(
					`
            SELECT row_number() over (ORDER BY t.level DESC, t.xp DESC) AS rank, t.level, t.xp, t."userID"
            FROM "user" AS t
            GROUP BY t.level, t.xp, t."userID"
            ORDER BY t.level DESC, t.xp DESC`,
					{ type: QueryTypes.SELECT },
				)

				const bentoRank: Array<Rankings> = await database.query(
					`
            SELECT row_number() over (ORDER BY t.bento DESC) AS rank, t.bento, t."userID"
            FROM bento AS t
            GROUP BY t."userID"
            ORDER BY t.bento DESC`,
					{ type: QueryTypes.SELECT },
				)

				initModels(database)
				const userData = await guild.sum(`memberCount`)

				let userID: string
				let username: string | undefined
				let usernameEmbed: lastfmRecentTracks | undefined
				let lastfmStatus = false
				let userProfileData: profile

				try {
					const theUser = message?.mentions?.members?.has(client?.user?.id as string)
						? message.mentions.members.size > 1
							? message.mentions.members.last()
							: message.member
						: message?.mentions?.members?.first() || (await message?.guild?.members.fetch(user))
					if (theUser?.user.bot === true) return message.channel.send(`A bot doesn't have a profile.`)
					userID = theUser?.id as string
					const userAttr: userCreationAttributes = {
						userID: BigInt(theUser?.id as string),
						discriminator: theUser?.user.discriminator as string,
						username: theUser?.user.username as string,
						xp: 0,
						level: 1,
						avatarURL: theUser?.user.avatarURL({
							format: `png`,
							dynamic: true,
							size: 1024,
						}) as string,
					}

					const guildMemberAttr: guildMemberCreationAttributes = {
						userID: BigInt(theUser?.id as string),
						guildID: BigInt(message?.guild?.id as string),
						xp: 0,
						level: 1,
						avatarURL: theUser?.user.avatarURL({
							format: `png`,
							dynamic: true,
							size: 1024,
						}) as string,
					}
					await userDB.findOrCreate({
						where: { userID: userID },
						defaults: userAttr,
					})
					await guildMemberDB.findOrCreate({
						where: { userID: userID, guildID: message?.guild?.id as string },
						defaults: guildMemberAttr,
					})
					userProfileData = (await profile.findOne({
						raw: true,
						where: { userID: userID },
					})) as profile
					if (userProfileData) {
						if (userProfileData.lastfmBoard === true) {
							const lastfmData = await lastfm.findOne({
								raw: true,
								where: { userID: userID },
							})
							if (lastfmData) {
								username = lastfmData.lastfm
							}
						}
					}
				} catch {
					userID = message.author.id
					const userAttr: userCreationAttributes = {
						userID: BigInt(message.author.id),
						discriminator: message.author.discriminator,
						username: message.author.username,
						xp: 0,
						level: 1,
						avatarURL: message.author.avatarURL({
							format: `png`,
							dynamic: true,
							size: 1024,
						}) as string,
					}

					const guildMemberAttr: guildMemberCreationAttributes = {
						userID: BigInt(message.author.id),
						guildID: BigInt(message?.guild?.id as string),
						xp: 0,
						level: 1,
						avatarURL: message.author.avatarURL({
							format: `png`,
							dynamic: true,
							size: 1024,
						}) as string,
					}
					await userDB.findOrCreate({
						where: { userID: userID },
						defaults: userAttr,
					})
					await guildMemberDB.findOrCreate({
						where: { userID: userID, guildID: message?.guild?.id as string },
						defaults: guildMemberAttr,
					})
					userProfileData = (await profile.findOne({
						raw: true,
						where: { userID: userID },
					})) as profile
					if (userProfileData) {
						if (userProfileData.lastfmBoard === true) {
							const lastfmData = await lastfm.findOne({
								raw: true,
								where: { userID: userID },
							})
							if (lastfmData) {
								username = lastfmData.lastfm
							}
						}
					}
				}

				const waitingMessage = await message.channel.send(`Waiting for rank profile to process... ⌛`)

				let loadingStatus = false

				const serverRankUser: Rankings[] = []
				const globalRankUser: Rankings[] = []
				const bentoRankUser: Rankings[] = []

				for (const serverUser of serverRank) {
					if (serverUser.userID === userID) {
						serverRankUser.push(serverUser)
					}
				}

				for (const globalUser of globalRank) {
					if (globalUser.userID === userID) {
						globalRankUser.push(globalUser)
					}
				}

				for (const bentoUser of bentoRank) {
					if (bentoUser.userID === userID) {
						bentoRankUser.push(bentoUser)
					}
				}

				if (username) {
					const response = await lastfmAPI.get(`/`, {
						params: {
							method: `user.getrecenttracks`,
							user: username,
							limit: 2,
							page: 1,
						},
					})
					usernameEmbed = response.data
					lastfmStatus = true
				}

				const discordUser = await message?.guild?.members.fetch(userID)

				const boardArray = []

				const lastfmHTMLString = `
            <div class="xpDivBGBGBG2">
                <div class="fmDivBGBG">
                    <div class="fmDivBG">
                        <div class="fmDiv">
                            <img src="${
															usernameEmbed
																? usernameEmbed?.recenttracks
																	? usernameEmbed?.recenttracks.track[0].image[0][`#text`]
																	: `https://cdn.discordapp.com/avatars/787041583580184609/fb64cda098372e05fc6945b9d17386dc.png?size=1024`
																: `https://cdn.discordapp.com/avatars/787041583580184609/fb64cda098372e05fc6945b9d17386dc.png?size=1024`
														}" width="36" height="36" style="float:left">
                            <div>
                                <div class="fmSongText">
                                ${
																	usernameEmbed
																		? usernameEmbed.recenttracks
																			? usernameEmbed.recenttracks.track[0].name
																			: `${
																					discordUser?.nickname
																						? discordUser?.nickname
																						: `${discordUser?.user.username}#${discordUser?.user.discriminator}`
																			  } has not set their lastfm`
																		: `${
																				discordUser?.nickname
																					? discordUser?.nickname
																					: `${discordUser?.user.username}#${discordUser?.user.discriminator}`
																		  } has not set their lastfm`
																}
                                </div>
                                <div class="fmArtistText">
                                ${
																	usernameEmbed
																		? usernameEmbed.recenttracks
																			? usernameEmbed.recenttracks.track[0].artist[`#text`]
																			: `You can either set your lastfm or disable the lastfm board 😏`
																		: `You can either set your lastfm or disable the lastfm board 😏`
																}
                                </div>
                            </div>
                            <div class="fmBar">
                                <div class ="fmDoneServer"
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`
				boardArray.push(lastfmHTMLString)

				let xpBoard = true // xpboard is enabled by default

				if (userProfileData) {
					if (userProfileData.xpBoard !== null) {
						if (userProfileData.xpBoard === false) {
							xpBoard = false
						} else {
							xpBoard = true
						}
					} else {
						xpBoard = true
					}
				}

				const xpBoardHTMLString = `
            <div class="xpDivBGBGBG">
                <div class="xpDivBGBG">
                    <div class="xpDivBG">
                        <div class="xpDiv">
                            <div class="xpText">
                            ${
															message?.guild?.iconURL()
																? `<img src="${message.guild.iconURL()}" width="20" height="20">`
																: `🏠`
														} Level ${serverRankUser[0].level}
                            </div>
                            <div class="xpBar">
                                <div class ="xpDoneServer"
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="xpDivBG2">
                        <div class="xpDiv">
                            <div class="xpText2">
                            <img src="${client?.user?.avatarURL()}" width="20" height="20"> Level ${
					globalRankUser[0].level
				}
                            </div>
                            <div class="xpBar2">
                                <div class ="xpDoneGlobal"
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`
				boardArray.push(xpBoardHTMLString)

				let fmOpacity = 100
				let xpOpacity = 100

				let descriptionHeight = `250px`
				// normal height is 250px

				let fmPaddingTop = `32.5px`

				if (lastfmStatus === false && xpBoard === false) {
					fmOpacity = 0
					xpOpacity = 0
					descriptionHeight = `365px`
				}

				if (lastfmStatus === false && xpBoard === true) {
					fmOpacity = 0
					descriptionHeight = `310px`
				}

				if (xpBoard === false && lastfmStatus === true) {
					xpOpacity = 0
					descriptionHeight = `310px`
					fmPaddingTop = `88px`
				}

				const bg = userProfileData
					? userProfileData.backgroundUrl !== null
						? userProfileData.backgroundUrl
						: undefined
					: undefined //empty as default
				const backgroundOpacity = Math.round(
					(userProfileData
						? userProfileData.BackgroundColourOpacity !== null
							? (userProfileData?.BackgroundColourOpacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16) // default opacity is 1 === 100%
				const backgroundColourData = userProfileData
					? userProfileData.backgroundColour !== null
						? userProfileData.backgroundColour
						: `#1F2937`
					: `#1F2937`
				const backgroundColor = `${backgroundColourData}${backgroundOpacity}`
				const descriptionOpacity = Math.round(
					(userProfileData
						? userProfileData.descriptionColourOpacity !== null
							? (userProfileData?.descriptionColourOpacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16)
				const descriptionColourData = userProfileData
					? userProfileData.descriptionColour !== null
						? userProfileData.descriptionColour
						: `#ffffff`
					: `#ffffff`
				const descriptionColour = `${descriptionColourData}${descriptionOpacity}` // for the text that is
				// background overlay, so a potential bg isn't as ''bright''
				const overlayOpacity = Math.round(
					(userProfileData
						? userProfileData.overlayOpacity !== null
							? (userProfileData?.overlayOpacity as number) / 100
							: 0.2
						: 0.2) * 255,
				).toString(16)
				const overlayColourData = userProfileData
					? userProfileData.overlayColour !== null
						? userProfileData.overlayColour
						: `#000000`
					: `#000000` //#000000 (transparent) as the default value, if nothing is specified in the database
				const overlayColour = `${overlayColourData}${overlayOpacity}`

				// sidebar
				const usernameColour = userProfileData
					? userProfileData.usernameColour !== null
						? userProfileData.usernameColour
						: `#ffffff`
					: `#ffffff`
				const discriminatorColour = userProfileData
					? userProfileData.discriminatorColour !== null
						? userProfileData.discriminatorColour
						: `#9CA3AF`
					: `#9CA3AF`

				const sidebarItemServerColour = userProfileData
					? userProfileData.sidebarItemServerColour !== null
						? userProfileData.sidebarItemServerColour
						: `#D3D3D3`
					: `#D3D3D3`
				const sidebarItemGlobalColour = userProfileData
					? userProfileData.sidebarItemGlobalColour !== null
						? userProfileData.sidebarItemGlobalColour
						: `#D3D3D3`
					: `#D3D3D3`
				const sidebarItemBentoColour = userProfileData
					? userProfileData.sidebarItemBentoColour !== null
						? userProfileData.sidebarItemBentoColour
						: `#D3D3D3`
					: `#D3D3D3`
				const sidebarItemTimezoneColour = userProfileData
					? userProfileData.sidebarItemTimezoneColour !== null
						? userProfileData.sidebarItemTimezoneColour
						: `#D3D3D3`
					: `#D3D3D3`
				const sidebarValueServerColour = userProfileData
					? userProfileData.sidebarValueServerColour !== null
						? userProfileData.sidebarValueServerColour
						: `#ffffff`
					: `#ffffff`
				const sidebarValueGlobalColour = userProfileData
					? userProfileData.sidebarValueGlobalColour !== null
						? userProfileData.sidebarValueGlobalColour
						: `#ffffff`
					: `#ffffff`
				const sidebarValueBentoColour = userProfileData
					? userProfileData.sidebarValueBentoColour !== null
						? userProfileData.sidebarValueBentoColour
						: `#ffffff`
					: `#ffffff`
				const sidebarValueEmoteColour = `#ffffff`

				const sidebarOpacity = Math.round(
					(userProfileData
						? userProfileData.sidebarOpacity !== null
							? (userProfileData?.sidebarOpacity as number) / 100
							: 0.3
						: 0.3) * 255,
				).toString(16)
				const sidebarColourData = userProfileData
					? userProfileData.sidebarColour !== null
						? userProfileData.sidebarColour
						: `#000000`
					: `#000000`
				const sidebarColour = `${sidebarColourData}${sidebarOpacity}`
				const sidebarBlur = userProfileData
					? userProfileData.sidebarBlur !== null
						? userProfileData.sidebarBlur
						: 3
					: 3

				// fm board
				const fmDivBGOpacity = Math.round(
					(userProfileData
						? userProfileData.fmDivBGOpacity !== null
							? (userProfileData?.fmDivBGOpacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16)
				const fmDivBGColourData = userProfileData
					? userProfileData.fmDivBGColour !== null
						? userProfileData.fmDivBGColour
						: `#111827`
					: `#111827`
				const fmDivBGColour = `${fmDivBGColourData}${fmDivBGOpacity}`
				const fmSongTextOpacity = Math.round(
					(userProfileData
						? userProfileData.fmSongTextOpacity !== null
							? (userProfileData?.fmSongTextOpacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16)
				const fmSongTextColourData = userProfileData
					? userProfileData.fmSongTextColour !== null
						? userProfileData.fmSongTextColour
						: `#ffffff`
					: `#ffffff`
				const fmSongTextColour = `${fmSongTextColourData}${fmSongTextOpacity}`
				const fmArtistTextOpacity = Math.round(
					(userProfileData
						? userProfileData.fmArtistTextOpacity !== null
							? (userProfileData?.fmArtistTextOpacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16)
				const fmArtistTextColourData = userProfileData
					? userProfileData.fmArtistTextColour !== null
						? userProfileData.fmArtistTextColour
						: `#ffffff`
					: `#ffffff`
				const fmArtistTextColour = `${fmArtistTextColourData}${fmArtistTextOpacity}`

				// xp board
				const xpDivBGOpacity = Math.round(
					(userProfileData
						? userProfileData.xpDivBGOpacity !== null
							? (userProfileData?.xpDivBGOpacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16)
				const xpDivBGColourData = userProfileData
					? userProfileData.xpDivBGColour !== null
						? userProfileData.xpDivBGColour
						: `#111827`
					: `#111827`
				const xpDivBGColour = `${xpDivBGColourData}${xpDivBGOpacity}`
				const xpTextOpacity = Math.round(
					(userProfileData
						? userProfileData.xpTextOpacity !== null
							? (userProfileData?.xpTextOpacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16)
				const xpTextColourData = userProfileData
					? userProfileData.xpTextColour !== null
						? userProfileData.xpTextColour
						: `#ffffff`
					: `#ffffff`
				const xpTextColour = `${xpTextColourData}${xpTextOpacity}`
				const xpText2Opacity = Math.round(
					(userProfileData
						? userProfileData.xpText2Opacity !== null
							? (userProfileData?.xpText2Opacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16)
				const xpText2ColourData = userProfileData
					? userProfileData.xpText2Colour !== null
						? userProfileData.xpText2Colour
						: `#ffffff`
					: `#ffffff`
				const xpText2Colour = `${xpText2ColourData}${xpText2Opacity}`

				// xp bars (background)
				const xpBarOpacity = Math.round(
					(userProfileData
						? userProfileData.xpBarOpacity !== null
							? (userProfileData?.xpBarOpacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16)
				const xpBarColourData = userProfileData
					? userProfileData.xpBarColour !== null
						? userProfileData.xpBarColour
						: `#374151`
					: `#374151`
				const xpBarColour = `${xpBarColourData}${xpBarOpacity}`
				const xpBar2Opacity = Math.round(
					(userProfileData
						? userProfileData.xpBar2Opacity !== null
							? (userProfileData?.xpBar2Opacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16)
				const xpBar2ColourData = userProfileData
					? userProfileData.xpBar2Colour !== null
						? userProfileData.xpBar2Colour
						: `#374151`
					: `#374151`
				const xpBar2Colour = `${xpBar2ColourData}${xpBar2Opacity}`

				const xpDoneServerColour1Opacity = Math.round(
					(userProfileData
						? userProfileData.xpDoneServerColour1Opacity !== null
							? (userProfileData?.xpDoneServerColour1Opacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16)
				const xpDoneServerColour2Opacity = Math.round(
					(userProfileData
						? userProfileData.xpDoneServerColour2Opacity !== null
							? (userProfileData?.xpDoneServerColour2Opacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16)
				const xpDoneServerColour3Opacity = Math.round(
					(userProfileData
						? userProfileData.xpDoneServerColour3Opacity !== null
							? (userProfileData?.xpDoneServerColour3Opacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16)
				const xpDoneGlobalColour1Opacity = Math.round(
					(userProfileData
						? userProfileData.xpDoneGlobalColour1Opacity !== null
							? (userProfileData.xpDoneGlobalColour1Opacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16)
				const xpDoneGlobalColour2Opacity = Math.round(
					(userProfileData
						? userProfileData.xpDoneGlobalColour2Opacity !== null
							? (userProfileData?.xpDoneGlobalColour2Opacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16)
				const xpDoneGlobalColour3Opacity = Math.round(
					(userProfileData
						? userProfileData.xpDoneGlobalColour3Opacity !== null
							? (userProfileData?.xpDoneGlobalColour3Opacity as number) / 100
							: 1
						: 1) * 255,
				).toString(16)

				const xpDoneServerColour1Data = userProfileData
					? userProfileData.xpDoneServerColour1 !== null
						? userProfileData.xpDoneServerColour1
						: `#FCD34D`
					: `#FCD34D`
				const xpDoneServerColour2Data = userProfileData
					? userProfileData.xpDoneServerColour2 !== null
						? userProfileData.xpDoneServerColour2
						: `#F59E0B`
					: `#F59E0B`
				const xpDoneServerColour3Data = userProfileData
					? userProfileData.xpDoneServerColour3 !== null
						? userProfileData.xpDoneServerColour3
						: `#EF4444`
					: `#EF4444`
				const xpDoneGlobalColour1Data = userProfileData
					? userProfileData.xpDoneGlobalColour1 !== null
						? userProfileData.xpDoneGlobalColour1
						: `#FCD34D`
					: `#FCD34D`
				const xpDoneGlobalColour2Data = userProfileData
					? userProfileData.xpDoneGlobalColour2 !== null
						? userProfileData.xpDoneGlobalColour2
						: `#F59E0B`
					: `#F59E0B`
				const xpDoneGlobalColour3Data = userProfileData
					? userProfileData.xpDoneGlobalColour3 !== null
						? userProfileData.xpDoneGlobalColour3
						: `#EF4444`
					: `#EF4444`

				const xpDoneServerColour1 = `${xpDoneServerColour1Data}${xpDoneServerColour1Opacity}`
				const xpDoneServerColour2 = `${xpDoneServerColour2Data}${xpDoneServerColour2Opacity}`
				const xpDoneServerColour3 = `${xpDoneServerColour3Data}${xpDoneServerColour3Opacity}`
				const xpDoneGlobalColour1 = `${xpDoneGlobalColour1Data}${xpDoneGlobalColour1Opacity}`
				const xpDoneGlobalColour2 = `${xpDoneGlobalColour2Data}${xpDoneGlobalColour2Opacity}`
				const xpDoneGlobalColour3 = `${xpDoneGlobalColour3Data}${xpDoneGlobalColour3Opacity}`
				// red for testing #FF0000

				const avatar = discordUser?.user.avatarURL({ size: 128, format: `png` })
					? discordUser.user.avatarURL({ size: 128, format: `png` })
					: `https://cdn.discordapp.com/embed/avatars/${Number(discordUser?.user.discriminator) % 5}.png`
				const usernameSlot = discordUser?.nickname ? discordUser?.nickname : discordUser?.user.username
				const discriminatorSlot = discordUser?.nickname
					? `${discordUser.user.username}#${discordUser.user.discriminator}`
					: `#${discordUser?.user.discriminator}`
				const usernameSize = usernameSizeFunction(usernameSlot as string)
				const xpServer = serverRankUser[0].xp as number
				const xpGlobal = globalRankUser[0].xp as number

				const replacements = {
					BACKGROUND_IMAGE: bg,
					WRAPPER_CLASS: bg ? `custom-bg` : ``,
					SIDEBAR_CLASS: bg ? `blur` : ``,
					OVERLAY_CLASS: bg ? `overlay` : ``,
					USER_COLOR: backgroundColor,
					AVATAR_URL: avatar,
					USERNAME: usernameSlot,
					DISCRIMINATOR: discriminatorSlot,
					DESCRIPTION: userProfileData
						? userProfileData.description !== null
							? userProfileData.description
							: `I am a happy user of Bento 🍱😄`
						: `I am a happy user of Bento 🍱😄`,
					SERVER_LEVEL: serverRankUser[0] ? serverRankUser[0].rank : 0,
					GLOBAL_LEVEL: globalRankUser[0] ? globalRankUser[0].rank : 0,
					USERNAME_SIZE: usernameSize,
				}

				const userTimezone = userProfileData
					? userProfileData.timezone !== null
						? moment()
								.tz(userProfileData?.timezone as string)
								.format(`ddd, h:mmA`)
						: ``
					: ``
				const userBirthday = userProfileData
					? userProfileData.birthday !== null
						? userTimezone
							? `, ${moment(new Date(userProfileData?.birthday as string)).format(`MMM D`)} 🎂`
							: `${moment(new Date(userProfileData?.birthday as string)).format(`MMM D`)} 🎂`
						: ``
					: ``

				const emoteArray = []

				const randomEmotes = [
					`😀`,
					`😃`,
					`😄`,
					`😁`,
					`😆`,
					`😅`,
					`😂`,
					`🤣`,
					`😊`,
					`😇`,
					`😉`,
					`😍`,
					`🥰`,
					`😘`,
					`😗`,
					`😙`,
					`😚`,
					`😋`,
					`😛`,
					`😝`,
					`😜`,
					`🤪`,
					`🧐`,
					`🤓`,
					`😎`,
					`🤩`,
					`🥳`,
					`😏`,
					`😫`,
					`😩`,
					`🥺`,
					`😭`,
					`😤`,
					`😳`,
					`🥵`,
					`🥶`,
					`😱`,
					`😨`,
					`🤗`,
					`🤔`,
					`🤭`,
					`🙄`,
					`😲`,
					`🤤`,
					`🥴`,
					`🤑`,
					`🤠`,
					`😈`,
					`👿`,
					`🤡`,
				]

				emoteArray.push(randomEmotes[Math.floor(Math.random() * randomEmotes.length)])

				const bentoServerMemberData = await guildMemberDB.findAll({
					raw: true,
					where: { guildID: `714496317522444352` },
				})

				if (bentoServerMemberData.some((user) => user.userID === BigInt(userID))) {
					emoteArray.push(`🍱`)
				}

				if (userID === `232584569289703424`) {
					emoteArray.push(`👨‍💻`)
				}

				const patreonsData = await patreon.findAll()

				if (patreonsData.some((user) => user.userID === BigInt(userID))) {
					emoteArray.push(
						emoteFunction(`https://www.audiosocket.com/wp-content/uploads/2020/11/patreon-creators-patreon.png`),
					)
					const patreonUser = patreonsData.filter((user) => user.userID === BigInt(userID))
					if (patreonUser[0].emoteSlot1 !== null) {
						emoteArray.push(emoteFunction(patreonUser[0].emoteSlot1 as string))
					}

					if (
						(patreonUser[0].emoteSlot2 !== null && patreonUser[0].enthusiast === true) ||
						patreonUser[0].disciple === true ||
						patreonUser[0].sponsor === true
					) {
						emoteArray.push(emoteFunction(patreonUser[0].emoteSlot2 as string))
					}

					if (
						(patreonUser[0].emoteSlot3 !== null && patreonUser[0].disciple === true) ||
						patreonUser[0].sponsor === true
					) {
						emoteArray.push(emoteFunction(patreonUser[0].emoteSlot3 as string))
					}

					if (patreonUser[0].emoteSlot4 !== null && patreonUser[0].sponsor === true) {
						emoteArray.push(emoteFunction(patreonUser[0].emoteSlot4 as string))
					}
				}

				const css = `:root {
                --bgimage: url('${replacements.BACKGROUND_IMAGE}');
                --user-color: ${replacements.USER_COLOR};
            }
            
            body {
                margin: 0;
                padding: 0;
                font-family: 'Urbanist', sans-serif;
            }
            
            .wrapper {
                width: 600px;
                height: 400px;
                background-color: var(--user-color);
                overflow: hidden;
                border-radius: 10px;
            }
            
            .custom-bg {
                background-size: cover;
                background-position: center;
                background-image: var(--bgimage);
            }
            
            /* e.g. the sidebar */
            .sidebar {
                position: absolute;
                left: 400px;
                top: 0px;
                z-index: 3;
                background-color: ${sidebarColour};
                width: 200px;
                height: inherit;
                border-radius: 0 10px 10px 0;
                font-family: 'Urbanist', sans-serif;
            }
            
            .blur {
                overflow: hidden;
                backdrop-filter: blur(${sidebarBlur}px);
            }
            
            .avatar {
                width: 96px;
                height: auto;
            }
            
            .avatar-container {
                position: absolute;
                overflow: hidden;
                transform: translate(-50%, 16px);
                left: 100px;
                width: 96px;
                height: 96px;
                border-radius: 50%;
                border-width: 0px;
                border-style: solid;
                border-color: white;
                z-index: 2;
            }
            
            .sidebar-list {
                list-style: none;
                text-align: center;
                position: absolute;
                top: 170px;
                right: 0px;
                width: 200px;
                color: white;
                line-height: 1.1;
                margin: auto;
                font-family: 'Urbanist', sans-serif;
            }
            
            .sidebar-itemServer {
                padding-top: 13px;
                height: auto;
                color: ${sidebarItemServerColour};
                font-family: 'Urbanist', sans-serif;
            }

            .sidebar-itemGlobal {
                padding-top: 13px;
                height: auto;
                color: ${sidebarItemGlobalColour};
                font-family: 'Urbanist', sans-serif;
            }

            .sidebar-itemBento {
                padding-top: 13px;
                height: auto;
                color: ${sidebarItemBentoColour};
                font-family: 'Urbanist', sans-serif;
            }

            .sidebar-itemTimezone {
                padding-top: 13px;
                height: auto;
                color: ${sidebarItemTimezoneColour};
                font-family: 'Urbanist', sans-serif;
            }

            .sidebar-valueServer {
                font-size: 24px;
                color: ${sidebarValueServerColour};
                font-family: 'Urbanist', sans-serif;
            }

            .sidebar-valueGlobal {
                font-size: 24px;
                color: ${sidebarValueGlobalColour};
                font-family: 'Urbanist', sans-serif;
            }

            .sidebar-valueBento {
                font-size: 24px;
                color: ${sidebarValueBentoColour};
                font-family: 'Urbanist', sans-serif;
            }

            .sidebar-valueEmote {
                font-size: 24px;
                color: ${sidebarValueEmoteColour};
                font-family: 'Urbanist', sans-serif;
            }
            
            .name-container {
                position: absolute;
                top: 120px;
                width: 200px;
                font-family: 'Urbanist', sans-serif;
            }
            
            .badges {
                list-style: none;
                padding: 0;
                margin: 10px 10px 5px 20px;
                color: ${descriptionColour};
            }
            
            .badge-container {
                display: inline-block;
                margin-right: 0;
            }
            
            .corner-logo {
                width: 30px;
                height: 30px;
                color: white;
                padding: 3px;
                font-size: 30px;
                z-index: 5;
            }
            
            svg {
                width: 100%;
                height: 100%;
            }
            
            .username {
                font-family: 'Urbanist', sans-serif;
                font-size: ${replacements.USERNAME_SIZE};
                fill: ${usernameColour};
            }
            
            .discriminator {
                font-family: 'Urbanist', sans-serif;
                font-size: 17px;
                fill: ${discriminatorColour};
            }
            
            .footer {
                position: absolute;
                width: 400px;
                height: 150px;
                top: 250px;
                border-radius: 0 0 10px 10px;
            }
            /* we need to make the text appear at bottom and thereby move it up
            https://stackoverflow.com/questions/18725781/html-css-move-text-upwards-when-the-line-breaks/18726068 */
            .center-area {
                position: relative;
                top: 20px;
                width: 325px;
                height: ${descriptionHeight};
                left: 40px;
                margin: 0;
                overflow: hidden;
                color: ${descriptionColour};
                font-family: 'Urbanist', sans-serif;
            }
            
            .description {
                font-size: 20px;
                height: auto;
                max-height: 95%;
                width: 300px;
                word-wrap: break-word;
                font-family: 'Urbanist', sans-serif;
                position:absolute;
                bottom: 0;
            }
            
            .description-text {
                margin: 0;
                font-family: 'Urbanist', sans-serif;
            }
            
            .inner-wrapper {
                width: inherit;
                height: inherit;
                overflow: hidden;
            }

            .xpDivBGBGBG {
                padding-top: 5px;
            }

            .xpDivBGBGBG2 {
                padding-left: 20px;
                padding-top: ${fmPaddingTop};
            }

            .xpDivBGBG {
                position: relative;
            }

            .fmDivBGBG {
                position: relative;
            }

            /* rgba(17, 24, 39, var(--tw-bg-opacity)) */
            .xpDivBG {
                flex-grow: 0.5;
                width: 85%;
                overflow: hidden;
                display: flex;
                align-items: center;
                background-color: ${xpDivBGColour};
                border-radius: 0.5rem/* 8px */;
                padding-left: 25px;
                padding-right: 15px;
                opacity: ${xpOpacity};
            }

            .xpDivBG2 {
                flex-grow: 0.5;
                width: 85%;
                overflow: hidden;
                display: flex;
                align-items: center;
                background-color: #ffffff00;
                border-radius: 0.5rem/* 8px */;
                padding-left: 25px;
                padding-right: 15px;
                opacity: ${xpOpacity};
            }

            .fmDivBG {
                flex-grow: 0.5;
                width: 85%;
                overflow: hidden;
                display: flex;
                align-items: center;
                background-color: ${fmDivBGColour};
                border-radius: 0.5rem/* 8px */;
                padding-left: 25px;
                padding-right: 15px;
                opacity: ${fmOpacity};
            }

            .xpDiv {
                flex-grow: 1;
                padding: 0.5rem/* 16px */;
                width: 75%;
                overflow: hidden;
            }

            .fmDiv {
                flex-grow: 1;
                padding: 0.5rem/* 16px */;
                width: 75%;
                overflow: hidden;
            }

            .xpText {
                color: ${xpTextColour};
                text-align: right;
                overflow: hidden;
                font-family: 'Urbanist', sans-serif;
                font-size: medium;
            }

            .xpText2 {
                color: ${xpText2Colour};
                text-align: right;
                overflow: hidden;
                font-family: 'Urbanist', sans-serif;
                font-size: medium;
            }

            .fmSongText {
                --tw-text-opacity: 1;
                color: ${fmSongTextColour};
                text-align: left;
                overflow: hidden;
                font-family: 'Urbanist', sans-serif;
                font-size: ${lastfmTextFunction(usernameEmbed ? usernameEmbed.recenttracks.track[0].name : `lmao`)};
                padding-left: 10px;
                display: block;
                align-items: center;

                position: relative;

                white-space: nowrap; /* makes it stay on the line /;

                text-overflow: ellipsis; / adds dots
                but doesn't show dots because of the way we do text
                we need separate p elements */;
            }

            .fmArtistText {
                --tw-text-opacity: 1;
                color: ${fmArtistTextColour};
                text-align: left;
                overflow: hidden;
                font-family: 'Urbanist', sans-serif;
                font-size: ${lastfmTextFunction(
									usernameEmbed ? usernameEmbed.recenttracks.track[0].artist[`#text`] : `lmao`,
								)};
                padding-left: 10px;
                display: flex;
                align-items: center;

                position: relative;

                white-space: nowrap; /* makes it stay on the line /;

                text-overflow: ellipsis; / adds dots
                but doesn't show dots because of the way we do text
                we need separate p elements */;
            }

            .fmBar {
                width: 100%;
                --tw-bg-opacity: 1;
                background-color: rgba(55, 65, 81, var(--tw-bg-opacity));
                overflow: hidden;
                opacity: 0%;
            }

            .fmDoneServer {
                background: linear-gradient(to left, #FCD34D, #F59E0B, #EF4444);
                box-shadow: 0 3px 3px -5px #EF4444, 0 2px 5px #EF4444;
                border-radius: 20px;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                width: 100%;
                opacity: 0%;
            }

            .xpBar {
                margin-top: 0.25rem/* 4px */;
                margin-bottom: 0.25rem/* 4px */;
                width: 100%;
                height: 0.25rem/* 4px */;
                background-color: ${xpBarColour};
                border-radius: 0.25rem/* 4px */;
                overflow: hidden;
            }

            .xpBar2 {
                margin-top: 0.25rem/* 4px */;
                margin-bottom: 0.25rem/* 4px */;
                width: 100%;
                height: 0.25rem/* 4px */;
                background-color: ${xpBar2Colour};
                border-radius: 0.25rem/* 4px */;
                overflow: hidden;
            }

            .xpDoneServer {
                background: linear-gradient(to left, ${xpDoneServerColour1}, ${xpDoneServerColour2}, ${xpDoneServerColour3});
                box-shadow: 0 3px 3px -5px #EF4444, 0 2px 5px #EF4444;
                border-radius: 20px;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                width: ${
									(xpServer /
										((((serverRankUser[0].level as number) * (serverRankUser[0].level as number)) as number) * 100)) *
									100
								}%;
            }

            .xpDoneGlobal {
                background: linear-gradient(to left, ${xpDoneGlobalColour1}, ${xpDoneGlobalColour2}, ${xpDoneGlobalColour3});
                box-shadow: 0 3px 3px -5px #EF4444, 0 2px 5px #EF4444;
                border-radius: 20px;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                width: ${
									(xpGlobal /
										((((globalRankUser[0].level as number) * (globalRankUser[0].level as number)) as number) * 100)) *
									100
								}%;
            }

            .overlay {
                background-color: ${overlayColour};
            }`

				let htmlString = ``
				htmlString = `<div class="wrapper ${replacements.WRAPPER_CLASS}">
            <div class="inner-wrapper ${replacements.OVERLAY_CLASS}">

                <div class="center-area">
                    <div class="description">
                        <p class="description-text">${replacements.DESCRIPTION}</p>
                    </div>
                </div>
    
                <div class="sidebar ${replacements.SIDEBAR_CLASS}">
    
                    <div class='avatar-container'>
                        <img class='avatar' src='${replacements.AVATAR_URL}'>
                    </div>
    
                    <div class="name-container">
                        <svg width="200" height="50">
                <text class="username" x="50%" y="30%" dominant-baseline="middle" text-anchor="middle">${
									replacements.USERNAME
								}</text>
                <text class="discriminator " x="50%" y="75%" dominant-baseline="middle"
                  text-anchor="middle">${replacements.DISCRIMINATOR}</text>
              </svg>
                    </div>
    
                    <ul class='sidebar-list'>
                        <li class='sidebar-itemServer'><span class="sidebar-valueServer">Rank ${
													replacements.SERVER_LEVEL
												}</span><br>Of ${message?.guild?.members.cache.get(userID)?.guild.memberCount} Users</li>
                        <li class='sidebar-itemGlobal'><span class="sidebar-valueGlobal">Rank ${
													replacements.GLOBAL_LEVEL
												}</span><br>Of ${Math.floor(userData / 100) / 10.0 + `k`} Users</li>
                        ${
													bentoRankUser[0]
														? `<li class='sidebar-itemBento'><span class="sidebar-valueBento">${
																bentoRankUser[0].bento
														  } 🍱</span><br>Rank ${bentoRankUser[0].rank}/${
																bentoRank[bentoRank.length - 1].rank
														  } 🍱 Users</li>`
														: ``
												}
                        <li class='sidebar-itemTimezone'><span class="sidebar-valueEmote">${emoteArray
													.map((emote) => emote)
													.join(``)}</span><br>${userTimezone}${userBirthday}</li>
                    </ul>
    
                </div>
                <div class="footer">
                    ${boardArray[0]}
                    ${boardArray[1]}
                </div>
            </div>
        </div>`
				htmlString = [
					`<html>\n`,
					`<head>\n`,
					`<link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;700&display=swap" rel="stylesheet">\n`,
					`<meta charset="UTF-8">\n`,
					`</head>\n\n`,
					`<style>\n`,
					`${css}\n`,
					`</style>\n\n`,
					`<body>\n`,
					`${htmlString}\n`,
					`</body>\n\n`,
					`</html>\n`,
				].join(``)
				const image = await getHTMLImage(htmlString, `600`, `400`).catch(console.error)
				const imageAttachment = new MessageAttachment(image as Buffer, `${discordUser?.user.username}_profile.png`)
				loadingStatus = true

				if (loadingStatus === true) {
					waitingMessage.delete()
					return await message.channel.send(imageAttachment)
				}
			} catch {
				console.log(`Error, could not resolve a rank profile`)
			}
		}
	},
}

function usernameSizeFunction(username: string) {
	if (username.length < 15) return `24px`
	if (username.length < 20) return `18px`
	if (username.length < 25) return `15px`
	return `11px`
}

function lastfmTextFunction(textLength: string) {
	if (textLength.length < 36) return `16px`
	if (textLength.length < 40) return `14px`
	if (textLength.length < 46) return `12px`
	return `10px`
}

function emoteFunction(emote: string) {
	return `<img src="${emote}" width="24" height="24">`
}
