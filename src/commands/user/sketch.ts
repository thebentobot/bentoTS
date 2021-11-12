import { Message, MessageEmbed, MessageReaction, User } from 'discord.js'
import database from '../../database/database'
import { initModels, profile } from '../../database/models/init-models'
import { Command } from '../../interfaces'
import { urlToColours } from '../../utils'
import moment from 'moment'

export const command: Command = {
	name: `sketch`,
	aliases: [],
	category: `user`,
	description: `Customise your profile for the rank command. Add background picture, change every colour, add birthday and timezone, and a funny description. If the usage commands does not make sense, please check out the website link which includes examples.`,
	usage: `**sketch bgpic** <image URL> | **sketch desc** <add/colour/opacity/status> <description text / hex colour / 0-100> | **sketch timezone** <tz database value, e.g. "Europe/Copenhagen"> | **sketch birthday** <birthday e.g. "25 November"> | **sketch username** <hex color> | **sketch discriminator** <hex color> | **sketch overlay** <colour/opacity/status> <hex colour/ 0-100 / status> | **sketch bgcolour** <colour/opacity/status> <hex colour / 0-100 / no argument for status> | **sketch fm** <toggle/bg/status/song/artist> <colour/opacity> <hex colour / 0-100> | **sketch xpboard** <toggle/bg/status/text/bar/barbg/text1/text2/bar1/bar2/barbg1/barbg2> <colour/opacity> <hex colour / 0-100> | **sketch sidebar** <opacity/colour/blur/rank/users/status> <hex colour/ 0-100 / number for blur amount / if it is rank or users you need to specify if it is either the server, global, bento or timezone row, before writing colour> <hex colour for rank and users> | **sketch delete**`,
	website: `https://www.bentobot.xyz/commands#sketch`,
	run: async (client, message, args): Promise<Message | void> => {
		switch (args[0]) {
			case `pic`:
			case `picture`:
			case `image`:
			case `bgpic`:
				await setBackgroundURL(message, args.slice(1).join(` `)) // args.slice(1).join(" ") = bg URL
				break
			case `bgcolour`:
			case `bgcolor`:
				switch (args[1]) {
					case `colour`:
					case `color`:
						await setBackgroundColour(message, args[2]) // args[2] = hex color
						break
					case `opacity`:
						await setBackgroundColourOpacity(message, args[2]) // args[2] = bg opacity
						break
					case `status`:
						await backgroundColourStatus(message) // shows settings for bgcolour
				}
				break
			case `fmboard`:
			case `fm`:
			case `lastfmboard`:
			case `lfmboard`:
				switch (args[1]) {
					case `toggle`:
						await toggleLastFMBoard(message, args[2]) // enables/disables lastfmboard. args[2] is optional, you can just toggle
						break
					case `status`:
						await lfmBoardStatus(message) // shows settings for lastfmboard
						break
					case `bg`:
					case `background`:
					case `box`:
						switch (args[2]) {
							case `opacity`:
								await setLfmBoardOpacity(message, args[3]) // args[3] = box bg opacity
								break
							case `color`:
							case `colour`:
								await setLfmBoardColour(message, args[3]) // args[3] = box bg clour
						}
						break
					case `fmsong`:
					case `songtext`:
					case `song`:
						switch (args[2]) {
							case `opacity`:
								await setSongTextOpacity(message, args[3]) // args[3] = song text opacity
								break
							case `color`:
							case `colour`:
								await setSongTextColour(message, args[3]) // args[3] = song text colour
						}
						break
					case `fmartist`:
					case `artisttext`:
					case `artist`:
						switch (args[2]) {
							case `opacity`:
								await setArtistTextOpacity(message, args[3]) // args[3] = artist text opacity
								break
							case `color`:
							case `colour`:
								await setArtistTextColour(message, args[3]) // args[3] = artist text colour
						}
				}
				break
			case `xpboard`:
			case `levelboard`:
				switch (args[1]) {
					case `toggle`:
						await toggleXPBoard(message, args[2]) // enables/disables xpboard. args[2] is optional, you can just toggle
						break
					case `status`:
						await xpBoardStatus(message) // shows settings for xpboard
						break
					case `bg`:
					case `background`:
					case `box`:
						switch (args[2]) {
							case `opacity`:
								await setXPBoardOpacity(message, args[3]) // args[3] = xp box opacity
								break
							case `color`:
							case `colour`:
								await setXPBoardColour(message, args[3]) // args[3] = xp box colour
						}
						break
					case `text`:
					case `xptext`:
						switch (args[2]) {
							case `opacity`:
								await setXPTextBothOpacity(message, args[3]) // args[3] = xp text opacity for both levels
								break
							case `color`:
							case `colour`:
								await setXPTextBothColour(message, args[3]) // args[3] = xp text colour for both levels
						}
						break
					case `text1`:
					case `xptext1`:
					case `xptextleft`:
						switch (args[2]) {
							case `opacity`:
								await setXPTextOpacity(message, args[3]) // args[3] = xp text opacity for left level
								break
							case `color`:
							case `colour`:
								await setXPTextColour(message, args[3]) // args[3] = xp text colour for left level
						}
						break
					case `text2`:
					case `xptext2`:
					case `xptextright`:
						switch (args[2]) {
							case `opacity`:
								await setXPText2Opacity(message, args[3]) // args[3] = xp text opacity for right level
								break
							case `color`:
							case `colour`:
								await setXPText2Colour(message, args[3]) // args[3] = xp text colour for right level
						}
						break
					case `bar`:
					case `xpbar`:
						switch (args[2]) {
							case `opacity`:
								await setXPBarBothOpacity(message, args[3], args[4], args[5]) // args[3], args[4], args[5] = xp bar opacity for both levels
								break
							case `color`:
							case `colour`:
								await setXPBarBothColour(message, args[3], args[4], args[5]) // args[3], args[4], args[5] = xp bar colour for both levels
						}
						break
					case `bar1`:
					case `xpbar1`:
					case `xpbarserver`:
					case `xpbarleft`:
						switch (args[2]) {
							case `opacity`:
								await setXPBarOpacity(message, args[3], args[4], args[5]) // args[3], args[4], args[5] = xp bar opacity for left level
								break
							case `color`:
							case `colour`:
								await setXPBarColour(message, args[3], args[4], args[5]) // args[3], args[4], args[5] = xp bar colour for left level
						}
						break
					case `bar2`:
					case `xpbar2`:
					case `xpbarglobal`:
					case `xpbarright`:
						switch (args[2]) {
							case `opacity`:
								await setXPBar2Opacity(message, args[3], args[4], args[5]) // args[3], args[4], args[5] = xp bar opacity for right level
								break
							case `color`:
							case `colour`:
								await setXPBar2Colour(message, args[3], args[4], args[5]) // args[3], args[4], args[5] = xp bar colour for right level
						}
						break
					case `barbg`:
					case `xpbarbg`:
						switch (args[2]) {
							case `opacity`:
								await setXPBarBgBothOpacity(message, args[3]) // args[3] = xp bar bg opacity for both levels
								break
							case `color`:
							case `colour`:
								await setXPBarBgBothColour(message, args[3]) // args[3] = xp bar bg colour for both levels
						}
						break
					case `bar1bg`:
					case `xpbar1bg`:
					case `xpbarserverbg`:
					case `xpbarleftbg`:
						switch (args[2]) {
							case `opacity`:
								await setXPBarBgOpacity(message, args[3]) // args[3] = xp bar bg opacity for left level
								break
							case `color`:
							case `colour`:
								await setXPBarBgColour(message, args[3]) // args[3] = xp bar bg colour for left level
						}
						break
					case `bar2bg`:
					case `xpbar2bg`:
					case `xpbarglobalbg`:
					case `xpbarrightbg`:
						switch (args[2]) {
							case `opacity`:
								await setXPBarBg2Opacity(message, args[3]) // args[3] = xp bar bg opacity for right level
								break
							case `color`:
							case `colour`:
								await setXPBarBg2Colour(message, args[3]) // args[3] = xp bar bg colour for right level
						}
				}
				break
			case `desc`:
			case `description`:
				switch (args[1]) {
					case `colour`:
					case `color`:
						await setDescriptionColour(message, args[2]) // args[2] = description text colour (hex colour)
						break
					case `opacity`:
						await setDescriptionOpacity(message, args[2]) // args[2] = description text opacity (0-100)
						break
					case `status`:
						await descriptionStatus(message) // shows settings set for description
						break
					case `add`:
						await setDescription(message, args.slice(2).join(` `)) // add/change your description
				}
				break
			case `bgoverlay`:
			case `overlay`:
				switch (args[1]) {
					case `colour`:
					case `color`:
						await setOverlayColour(message, args[2]) // args[2] = overlay colour (hex colour) (when you have a pic bg)
						break
					case `opacity`:
						await setOverlayOpacity(message, args[2]) // args[2] = overlay opacity (0-100) (when you have a pic bg)
						break
					case `status`:
						await overlayStatus(message) // shows settings set for overlay
				}
				break
			case `user`:
			case `username`:
				await setUsernameColour(message, args[1]) // args[1] = username colour (hex colour)
				break
			case `discriminator`:
			case `userbottom`:
				await setDiscriminatorColour(message, args[1]) // args[1] = discriminator colour (hex colour)
				break
			case `sidebar`:
			case `profile`:
				switch (args[1]) {
					case `opacity`:
						await setSidebarOpacity(message, args[2]) // args[2] = sidebar opacity (0-100)
						break
					case `colour`:
					case `color`:
						await setSidebarColour(message, args[2]) // args[2] = sidebar colour (hex colour)
						break
					case `blur`:
						await setSidebarBlur(message, args[2]) // args[2] = sidebar blur (0-100?)
						break
					case `value`:
					case `rank`:
						await setSidebarValueColour(message, args[2], args[3]) // args[2] = row (server, global or bento), args[3] = hex colour
						break
					case `item`:
					case `users`:
						await setSidebarItemColour(message, args[2], args[3]) // args[2] = row (server, global, bento or timezone), args[3] = hex colour
						break
					case `status`:
						await sidebarStatus(message) // shows settings for sidebar
				}
				break
			case `timezone`:
			case `time`:
			case `clock`:
				await setTimezone(message, args[1]) // set your timezone (e.g. "Europe/Copenhagen")
				break
			case `birthday`:
			case `bday`:
			case `birthdate`:
			case `birth`:
				await setBirthday(message, args.slice(1).join(` `)) // set your timezone (e.g. "25 November")
				break
			case `reset`:
			case `delete`:
				await deleteUserProfile(message) // deletes your saved profile
		}

		// background

		async function setBackgroundURL(message: Message, backgroundURL?: string) {
			if (!backgroundURL) {
				if (message.attachments.array() !== undefined) {
					const getUrl = message.attachments.array()
					backgroundURL = getUrl[0] ? getUrl[0].url : undefined
				} else {
					return message.channel.send(`You need to either write reset or set a background with an URL.`)
				}
			}

			if (backgroundURL === undefined)
				return message.channel.send(`You need to either write reset or set a background with an URL.`)

			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (backgroundURL === `reset`) {
				await profile.update({ backgroundUrl: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your background URL has been successfully reset.`)
			} else {
				await profile.update({ backgroundUrl: backgroundURL }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your background URL has been set.`)
			}
		}

		async function setBackgroundColour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update({ backgroundColour: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your background colour has been successfully reset.`)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update({ backgroundColour: colour }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your background colour has been set.`)
				}
			}
		}

		async function setBackgroundColourOpacity(message: Message, opacity: string) {
			if (!opacity) return message.channel.send(`You need to either write reset or set a valid opacity value.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity === `reset`) {
				await profile.update({ BackgroundColourOpacity: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your background colour opacity has been successfully reset.`)
			} else {
				let validOpacityValue: boolean
				const parseOpacity = Math.round(parseFloat(opacity))
				parseOpacity >= 0 && parseOpacity <= 100 ? (validOpacityValue = true) : (validOpacityValue = false)
				if (validOpacityValue === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				} else {
					await profile.update({ BackgroundColourOpacity: parseOpacity }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your background colour opacity has been set.`)
				}
			}
		}

		async function backgroundColourStatus(message: Message) {
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			const statusEmbed = new MessageEmbed()
				.setAuthor(
					message.member?.nickname
						? `${message.member?.nickname} (${message.author.username}#${message.author.discriminator})`
						: `${message.author.username}#${message.author.discriminator}`,
					message.author.avatarURL({ dynamic: true }) as string,
				)
				.setColor(`${await urlToColours(client?.user?.avatarURL({ format: `png` }) as string)}`)
				.setTimestamp().setDescription(`
            Background URL - ${userData[0].backgroundUrl === null ? `Not set.` : userData[0].backgroundUrl}
            Background Colour - ${userData[0].backgroundColour === null ? `Not set.` : userData[0].backgroundColour}
            Background Opacity - ${
							userData[0].BackgroundColourOpacity === null ? `Not set.` : userData[0].BackgroundColourOpacity
						}`)
			return message.channel.send(statusEmbed)
		}

		// lastfm board

		async function toggleLastFMBoard(message: Message, toggle: string) {
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (!toggle) {
				if (userData[0].lastfmBoard !== null) {
					if (userData[0].lastfmBoard === true) {
						await profile.update({ lastfmBoard: false }, { where: { userID: userData[0].userID } })
						return message.channel.send(`${message.author} your lastfm board has been successfully disabled.`)
					} else {
						await profile.update({ lastfmBoard: true }, { where: { userID: userData[0].userID } })
						return message.channel.send(`${message.author} your lastfm board has been successfully enabled.`)
					}
				} else {
					await profile.update({ lastfmBoard: true }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your lastfm board has been successfully enabled.`)
				}
			}

			if (toggle === `enable`) {
				await profile.update({ lastfmBoard: true }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your lastfm board has been successfully enabled.`)
			} else if (toggle === `disable`) {
				await profile.update({ lastfmBoard: false }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your lastfm board has been successfully disabled.`)
			}
		}

		async function lfmBoardStatus(message: Message) {
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			const statusEmbed = new MessageEmbed()
				.setAuthor(
					message.member?.nickname
						? `${message.member?.nickname} (${message.author.username}#${message.author.discriminator})`
						: `${message.author.username}#${message.author.discriminator}`,
					message.author.avatarURL({ dynamic: true }) as string,
				)
				.setColor(`${await urlToColours(client?.user?.avatarURL({ format: `png` }) as string)}`)
				.setTimestamp().setDescription(`
            LastFM Board - ${userData[0].lastfmBoard === true ? `Enabled.` : `Disabled.`}
            LastFM Background Colour - ${userData[0].fmDivBGColour === null ? `Not set.` : userData[0].fmDivBGColour}
            LastFM Background Opacity - ${userData[0].fmDivBGOpacity === null ? `Not set.` : userData[0].fmDivBGOpacity}
            LastFM Song Text Colour - ${
							userData[0].fmSongTextColour === null ? `Not set.` : userData[0].fmSongTextColour
						}
            LastFM Song Text Opacity - ${
							userData[0].fmSongTextOpacity === null ? `Not set.` : userData[0].fmSongTextOpacity
						}
            LastFM Artist Text Colour - ${
							userData[0].fmArtistTextColour === null ? `Not set.` : userData[0].fmArtistTextColour
						}
            LastFM Artist Text Opacity - ${
							userData[0].fmArtistTextColour === null ? `Not set.` : userData[0].fmArtistTextColour
						}`)
			return message.channel.send(statusEmbed)
		}

		async function setLfmBoardOpacity(message: Message, opacity: string) {
			if (!opacity) return message.channel.send(`You need to either write reset or set a valid opacity value.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity === `reset`) {
				await profile.update({ fmDivBGOpacity: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(
					`${message.author} your lastfm board background colour opacity has been successfully reset.`,
				)
			} else {
				let validOpacityValue: boolean
				const parseOpacity = Math.round(parseFloat(opacity))
				parseOpacity >= 0 && parseOpacity <= 100 ? (validOpacityValue = true) : (validOpacityValue = false)
				if (validOpacityValue === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				} else {
					await profile.update({ fmDivBGOpacity: parseOpacity }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your lastfm board background colour opacity has been set.`)
				}
			}
		}

		async function setLfmBoardColour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update({ fmDivBGColour: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(
					`${message.author} your lastfm board background colour has been successfully reset.`,
				)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update({ fmDivBGColour: colour }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your lastfm board background colour has been set.`)
				}
			}
		}

		async function setSongTextOpacity(message: Message, opacity: string) {
			if (!opacity) return message.channel.send(`You need to either write reset or set a valid opacity value.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity === `reset`) {
				await profile.update({ fmSongTextOpacity: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(
					`${message.author} your lastfm song text colour opacity has been successfully reset.`,
				)
			} else {
				let validOpacityValue: boolean
				const parseOpacity = Math.round(parseFloat(opacity))
				parseOpacity >= 0 && parseOpacity <= 100 ? (validOpacityValue = true) : (validOpacityValue = false)
				if (validOpacityValue === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				} else {
					await profile.update({ fmSongTextOpacity: parseOpacity }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your lastfm song text colour opacity has been set.`)
				}
			}
		}

		async function setSongTextColour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update({ fmSongTextColour: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your lastfm song text colour has been successfully reset.`)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update({ fmSongTextColour: colour }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your lastfm song text colour has been set.`)
				}
			}
		}

		async function setArtistTextOpacity(message: Message, opacity: string) {
			if (!opacity) return message.channel.send(`You need to either write reset or set a valid opacity value.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity === `reset`) {
				await profile.update({ fmArtistTextOpacity: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(
					`${message.author} your lastfm artist text colour opacity has been successfully reset.`,
				)
			} else {
				let validOpacityValue: boolean
				const parseOpacity = Math.round(parseFloat(opacity))
				parseOpacity >= 0 && parseOpacity <= 100 ? (validOpacityValue = true) : (validOpacityValue = false)
				if (validOpacityValue === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				} else {
					await profile.update({ fmArtistTextOpacity: parseOpacity }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your lastfm artist text colour opacity has been set.`)
				}
			}
		}

		async function setArtistTextColour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update({ fmArtistTextColour: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your lastfm artist text colour has been successfully reset.`)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update({ fmArtistTextColour: colour }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your lastfm artist text colour has been set.`)
				}
			}
		}

		// xp board

		async function toggleXPBoard(message: Message, toggle: string) {
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (!toggle) {
				if (userData[0].xpBoard !== null) {
					if (userData[0].xpBoard === true) {
						await profile.update({ xpBoard: false }, { where: { userID: userData[0].userID } })
						return message.channel.send(`${message.author} your xp board has been successfully disabled.`)
					} else {
						await profile.update({ xpBoard: true }, { where: { userID: userData[0].userID } })
						return message.channel.send(`${message.author} your xp board has been successfully enabled.`)
					}
				} else {
					await profile.update({ xpBoard: true }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your xp board has been successfully enabled.`)
				}
			}

			if (toggle === `enable`) {
				await profile.update({ xpBoard: true }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your xp board has been successfully enabled.`)
			} else if (toggle === `disable`) {
				await profile.update({ xpBoard: false }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your xp board has been successfully disabled.`)
			}
		}

		async function xpBoardStatus(message: Message) {
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			const statusEmbed = new MessageEmbed()
				.setAuthor(
					message.member?.nickname
						? `${message.member?.nickname} (${message.author.username}#${message.author.discriminator})`
						: `${message.author.username}#${message.author.discriminator}`,
					message.author.avatarURL({ dynamic: true }) as string,
				)
				.setColor(`${await urlToColours(client?.user?.avatarURL({ format: `png` }) as string)}`)
				.setTimestamp().setDescription(`
            XP Board - ${userData[0].xpBoard === true ? `Enabled.` : `Disabled.`}
            XP Background Colour - ${userData[0].xpDivBGColour === null ? `Not set.` : userData[0].xpDivBGColour}
            XP Background Opacity - ${userData[0].xpDivBGOpacity === null ? `Not set.` : userData[0].xpDivBGOpacity}
            XP Text (1/left) Colour - ${userData[0].xpTextColour === null ? `Not set.` : userData[0].xpTextColour}
            XP Text (1/left) Opacity - ${userData[0].xpTextOpacity === null ? `Not set.` : userData[0].xpTextOpacity}
            XP Text (2/right) Colour - ${userData[0].xpText2Colour === null ? `Not set.` : userData[0].xpText2Colour}
            XP Text (2/right) Opacity - ${
							userData[0].xpText2Opacity === null ? `Not set.` : userData[0].fmArtistTextColour
						}
            XP Bar (1/left) Colour 1 - ${
							userData[0].xpDoneServerColour1 === null ? `Not set.` : userData[0].xpDoneServerColour1
						}
            XP Bar (1/left) Opacity 1 - ${
							userData[0].xpDoneServerColour1Opacity === null ? `Not set.` : userData[0].xpDoneServerColour1Opacity
						}
            XP Bar (1/left) Colour 2 - ${
							userData[0].xpDoneServerColour2 === null ? `Not set.` : userData[0].xpDoneServerColour2
						}
            XP Bar (1/left) Opacity 2 - ${
							userData[0].xpDoneServerColour2Opacity === null ? `Not set.` : userData[0].xpDoneServerColour2Opacity
						}
            XP Bar (1/left) Colour 3 - ${
							userData[0].xpDoneServerColour3 === null ? `Not set.` : userData[0].xpDoneServerColour3
						}
            XP Bar (1/left) Opacity 3 - ${
							userData[0].xpDoneServerColour3Opacity === null ? `Not set.` : userData[0].xpDoneServerColour3Opacity
						}
            XP Bar (2/right) Colour 1 - ${
							userData[0].xpDoneGlobalColour1 === null ? `Not set.` : userData[0].xpDoneGlobalColour1
						}
            XP Bar (2/right) Opacity 1 - ${
							userData[0].xpDoneGlobalColour1Opacity === null ? `Not set.` : userData[0].xpDoneGlobalColour1Opacity
						}
            XP Bar (2/right) Colour 2 - ${
							userData[0].xpDoneGlobalColour2 === null ? `Not set.` : userData[0].xpDoneGlobalColour2
						}
            XP Bar (2/right) Opacity 2 - ${
							userData[0].xpDoneGlobalColour2Opacity === null ? `Not set.` : userData[0].xpDoneGlobalColour2Opacity
						}
            XP Bar (2/right) Colour 3 - ${
							userData[0].xpDoneGlobalColour3 === null ? `Not set.` : userData[0].xpDoneGlobalColour3
						}
            XP Bar (2/right) Opacity 3 - ${
							userData[0].xpDoneGlobalColour3Opacity === null ? `Not set.` : userData[0].xpDoneGlobalColour3Opacity
						}`)
			return message.channel.send(statusEmbed)
		}

		async function setXPBoardOpacity(message: Message, opacity: string) {
			if (!opacity) return message.channel.send(`You need to either write reset or set a valid opacity value.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity === `reset`) {
				await profile.update({ xpDivBGOpacity: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(
					`${message.author} your xp board background colour opacity has been successfully reset.`,
				)
			} else {
				let validOpacityValue: boolean
				const parseOpacity = Math.round(parseFloat(opacity))
				parseOpacity >= 0 && parseOpacity <= 100 ? (validOpacityValue = true) : (validOpacityValue = false)
				if (validOpacityValue === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				} else {
					await profile.update({ xpDivBGOpacity: parseOpacity }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your xp board background colour opacity has been set.`)
				}
			}
		}

		async function setXPBoardColour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update({ xpDivBGColour: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your xp board background colour has been successfully reset.`)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update({ xpDivBGColour: colour }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your xp board background colour has been set.`)
				}
			}
		}

		async function setXPTextBothOpacity(message: Message, opacity: string) {
			if (!opacity) return message.channel.send(`You need to either write reset or set a valid opacity value.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity === `reset`) {
				await profile.update(
					{ xpTextOpacity: undefined, xpText2Opacity: undefined },
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(
					`${message.author} both your xp board text colour opacity values has been successfully reset.`,
				)
			} else {
				let validOpacityValue: boolean
				const parseOpacity = Math.round(parseFloat(opacity))
				parseOpacity >= 0 && parseOpacity <= 100 ? (validOpacityValue = true) : (validOpacityValue = false)
				if (validOpacityValue === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				} else {
					await profile.update(
						{ xpTextOpacity: parseOpacity, xpText2Opacity: parseOpacity },
						{ where: { userID: userData[0].userID } },
					)
					return message.channel.send(
						`${message.author} both your xp board text colour opacity values has been successfully set.`,
					)
				}
			}
		}

		async function setXPTextBothColour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update(
					{ xpTextColour: undefined, xpText2Colour: undefined },
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(`${message.author} both your xp board text colours has been successfully reset.`)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update(
						{ xpTextColour: colour, xpText2Colour: colour },
						{ where: { userID: userData[0].userID } },
					)
					return message.channel.send(`${message.author} both your xp board text colours has been set.`)
				}
			}
		}

		async function setXPTextOpacity(message: Message, opacity: string) {
			if (!opacity) return message.channel.send(`You need to either write reset or set a valid opacity value.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity === `reset`) {
				await profile.update({ xpTextOpacity: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(
					`${message.author} your xp board text (1/left) colour opacity has been successfully reset.`,
				)
			} else {
				let validOpacityValue: boolean
				const parseOpacity = Math.round(parseFloat(opacity))
				parseOpacity >= 0 && parseOpacity <= 100 ? (validOpacityValue = true) : (validOpacityValue = false)
				if (validOpacityValue === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				} else {
					await profile.update({ xpTextOpacity: parseOpacity }, { where: { userID: userData[0].userID } })
					return message.channel.send(
						`${message.author} your xp board text (1/left) colour opacity has been successfully set.`,
					)
				}
			}
		}

		async function setXPTextColour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update({ xpTextColour: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your xp board text (1/left) colour has been successfully reset.`)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update({ xpTextColour: colour }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your xp board text (1/left) colour has been set.`)
				}
			}
		}

		async function setXPText2Opacity(message: Message, opacity: string) {
			if (!opacity) return message.channel.send(`You need to either write reset or set a valid opacity value.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity === `reset`) {
				await profile.update({ xpText2Opacity: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(
					`${message.author} your xp board text (2/right) colour opacity has been successfully reset.`,
				)
			} else {
				let validOpacityValue: boolean
				const parseOpacity = Math.round(parseFloat(opacity))
				parseOpacity >= 0 && parseOpacity <= 100 ? (validOpacityValue = true) : (validOpacityValue = false)
				if (validOpacityValue === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				} else {
					await profile.update({ xpText2Opacity: parseOpacity }, { where: { userID: userData[0].userID } })
					return message.channel.send(
						`${message.author} your xp board text (2/right) colour opacity has been successfully set.`,
					)
				}
			}
		}

		async function setXPText2Colour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update({ xpText2Colour: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(
					`${message.author} your xp board text (2/right) colour has been successfully reset.`,
				)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update({ xpText2Colour: colour }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your xp board text (2/right) colour has been set.`)
				}
			}
		}

		async function setXPBarBothOpacity(message: Message, opacity1: string, opacity2: string, opacity3: string) {
			if (!opacity1) return message.channel.send(`You need to either write reset or set 3 valid opacity values.`)
			if (!opacity2 && opacity1 !== `reset`)
				return message.channel.send(`You need to either write reset or set 3 valid opacity values.`)
			if (!opacity3 && opacity1 !== `reset`)
				return message.channel.send(`You need to either write reset or set 3 valid opacity values.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity1 === `reset`) {
				await profile.update(
					{
						xpDoneServerColour1Opacity: undefined,
						xpDoneServerColour2Opacity: undefined,
						xpDoneServerColour3Opacity: undefined,
						xpDoneGlobalColour1Opacity: undefined,
						xpDoneGlobalColour2Opacity: undefined,
						xpDoneGlobalColour3Opacity: undefined,
					},
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(
					`${message.author} both your xp bar colour opacity values has been successfully reset.`,
				)
			} else {
				let validOpacityValue1: boolean
				let validOpacityValue2: boolean
				let validOpacityValue3: boolean
				const parseOpacity1 = Math.round(parseFloat(opacity1))
				const parseOpacity2 = Math.round(parseFloat(opacity2))
				const parseOpacity3 = Math.round(parseFloat(opacity3))
				parseOpacity1 >= 0 && parseOpacity1 <= 100 ? (validOpacityValue1 = true) : (validOpacityValue1 = false)
				parseOpacity2 >= 0 && parseOpacity2 <= 100 ? (validOpacityValue2 = true) : (validOpacityValue2 = false)
				parseOpacity3 >= 0 && parseOpacity3 <= 100 ? (validOpacityValue3 = true) : (validOpacityValue3 = false)

				if (validOpacityValue1 === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				}
				if (validOpacityValue2 === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				}
				if (validOpacityValue3 === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				}

				await profile.update(
					{
						xpDoneServerColour1Opacity: parseOpacity1,
						xpDoneServerColour2Opacity: parseOpacity2,
						xpDoneServerColour3Opacity: parseOpacity3,
						xpDoneGlobalColour1Opacity: parseOpacity1,
						xpDoneGlobalColour2Opacity: parseOpacity2,
						xpDoneGlobalColour3Opacity: parseOpacity3,
					},
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(
					`${message.author} both your xp bar colour opacity values has been successfully set.`,
				)
			}
		}

		async function setXPBarBothColour(message: Message, colour1: string, colour2: string, colour3: string) {
			if (!colour1)
				return message.channel.send(
					`You need to either write reset or set a valid hex colour.\nRemember space between each hex colour.`,
				)
			if (!colour2 && colour1 !== `reset`)
				return message.channel.send(
					`You need to either write reset or set a valid hex colour.\nRemember space between each hex colour.`,
				)
			if (!colour3 && colour1 !== `reset`)
				return message.channel.send(
					`You need to either write reset or set a valid hex colour.\nRemember space between each hex colour.`,
				)

			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour1 === `reset`) {
				await profile.update(
					{
						xpDoneServerColour1: undefined,
						xpDoneServerColour2: undefined,
						xpDoneServerColour3: undefined,
						xpDoneGlobalColour1: undefined,
						xpDoneGlobalColour2: undefined,
						xpDoneGlobalColour3: undefined,
					},
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(`${message.author} both your xp bar colours has been successfully reset.`)
			} else {
				const hexTest1 = /^#[0-9A-F]{6}$/i.test(colour1)
				const hexTest2 = /^#[0-9A-F]{6}$/i.test(colour2)
				const hexTest3 = /^#[0-9A-F]{6}$/i.test(colour3)
				if (hexTest1 !== true) {
					return message.channel.send(`Your first hex color is invalid. Try another one.`)
				}
				if (hexTest2 !== true) {
					return message.channel.send(`Your second hex color is invalid. Try another one.`)
				}
				if (hexTest3 !== true) {
					return message.channel.send(`Your third hex color is invalid. Try another one.`)
				}
				await profile.update(
					{
						xpDoneServerColour1: colour1,
						xpDoneServerColour2: colour2,
						xpDoneServerColour3: colour3,
						xpDoneGlobalColour1: colour1,
						xpDoneGlobalColour2: colour2,
						xpDoneGlobalColour3: colour3,
					},
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(`${message.author} both your xp bar colours has been set.`)
			}
		}

		async function setXPBarOpacity(message: Message, opacity1: string, opacity2: string, opacity3: string) {
			if (!opacity1) return message.channel.send(`You need to either write reset or set 3 valid opacity values.`)
			if (!opacity2 && opacity1 !== `reset`)
				return message.channel.send(`You need to either write reset or set 3 valid opacity values.`)
			if (!opacity3 && opacity1 !== `reset`)
				return message.channel.send(`You need to either write reset or set 3 valid opacity values.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity1 === `reset`) {
				await profile.update(
					{
						xpDoneServerColour1Opacity: undefined,
						xpDoneServerColour2Opacity: undefined,
						xpDoneServerColour3Opacity: undefined,
					},
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(
					`${message.author} your xp bar (1/left) colour opacity values has been successfully reset.`,
				)
			} else {
				let validOpacityValue1: boolean
				let validOpacityValue2: boolean
				let validOpacityValue3: boolean
				const parseOpacity1 = Math.round(parseFloat(opacity1))
				const parseOpacity2 = Math.round(parseFloat(opacity2))
				const parseOpacity3 = Math.round(parseFloat(opacity3))
				parseOpacity1 >= 0 && parseOpacity1 <= 100 ? (validOpacityValue1 = true) : (validOpacityValue1 = false)
				parseOpacity2 >= 0 && parseOpacity2 <= 100 ? (validOpacityValue2 = true) : (validOpacityValue2 = false)
				parseOpacity3 >= 0 && parseOpacity3 <= 100 ? (validOpacityValue3 = true) : (validOpacityValue3 = false)

				if (validOpacityValue1 === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				}
				if (validOpacityValue2 === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				}
				if (validOpacityValue3 === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				}

				await profile.update(
					{
						xpDoneServerColour1Opacity: parseOpacity1,
						xpDoneServerColour2Opacity: parseOpacity2,
						xpDoneServerColour3Opacity: parseOpacity3,
					},
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(
					`${message.author} your xp bar (1/left) colour opacity values has been successfully set.`,
				)
			}
		}

		async function setXPBarColour(message: Message, colour1: string, colour2: string, colour3: string) {
			if (!colour1)
				return message.channel.send(
					`You need to either write reset or set a valid hex colour.\nRemember space between each hex colour.`,
				)
			if (!colour2 && colour1 !== `reset`)
				return message.channel.send(
					`You need to either write reset or set a valid hex colour.\nRemember space between each hex colour.`,
				)
			if (!colour3 && colour1 !== `reset`)
				return message.channel.send(
					`You need to either write reset or set a valid hex colour.\nRemember space between each hex colour.`,
				)

			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour1 === `reset`) {
				await profile.update(
					{
						xpDoneServerColour1: undefined,
						xpDoneServerColour2: undefined,
						xpDoneServerColour3: undefined,
					},
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(`${message.author} your xp bar (1/left) colour has been successfully reset.`)
			} else {
				const hexTest1 = /^#[0-9A-F]{6}$/i.test(colour1)
				const hexTest2 = /^#[0-9A-F]{6}$/i.test(colour2)
				const hexTest3 = /^#[0-9A-F]{6}$/i.test(colour3)
				if (hexTest1 !== true) {
					return message.channel.send(`Your first hex color is invalid. Try another one.`)
				}
				if (hexTest2 !== true) {
					return message.channel.send(`Your second hex color is invalid. Try another one.`)
				}
				if (hexTest3 !== true) {
					return message.channel.send(`Your third hex color is invalid. Try another one.`)
				}
				await profile.update(
					{
						xpDoneServerColour1: colour1,
						xpDoneServerColour2: colour2,
						xpDoneServerColour3: colour3,
					},
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(`${message.author} your xp bar (1/left) colour has been set.`)
			}
		}

		async function setXPBar2Opacity(message: Message, opacity1: string, opacity2: string, opacity3: string) {
			if (!opacity1) return message.channel.send(`You need to either write reset or set 3 valid opacity values.`)
			if (!opacity2 && opacity1 !== `reset`)
				return message.channel.send(`You need to either write reset or set 3 valid opacity values.`)
			if (!opacity3 && opacity1 !== `reset`)
				return message.channel.send(`You need to either write reset or set 3 valid opacity values.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity1 === `reset`) {
				await profile.update(
					{
						xpDoneGlobalColour1Opacity: undefined,
						xpDoneGlobalColour2Opacity: undefined,
						xpDoneGlobalColour3Opacity: undefined,
					},
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(
					`${message.author} your xp bar (2/right) colour opacity values has been successfully reset.`,
				)
			} else {
				let validOpacityValue1: boolean
				let validOpacityValue2: boolean
				let validOpacityValue3: boolean
				const parseOpacity1 = Math.round(parseFloat(opacity1))
				const parseOpacity2 = Math.round(parseFloat(opacity2))
				const parseOpacity3 = Math.round(parseFloat(opacity3))
				parseOpacity1 >= 0 && parseOpacity1 <= 100 ? (validOpacityValue1 = true) : (validOpacityValue1 = false)
				parseOpacity2 >= 0 && parseOpacity2 <= 100 ? (validOpacityValue2 = true) : (validOpacityValue2 = false)
				parseOpacity3 >= 0 && parseOpacity3 <= 100 ? (validOpacityValue3 = true) : (validOpacityValue3 = false)

				if (validOpacityValue1 === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				}
				if (validOpacityValue2 === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				}
				if (validOpacityValue3 === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				}

				await profile.update(
					{
						xpDoneGlobalColour1Opacity: parseOpacity1,
						xpDoneGlobalColour2Opacity: parseOpacity2,
						xpDoneGlobalColour3Opacity: parseOpacity3,
					},
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(
					`${message.author} your xp bar (2/right) colour opacity values has been successfully set.`,
				)
			}
		}

		async function setXPBar2Colour(message: Message, colour1: string, colour2: string, colour3: string) {
			if (!colour1)
				return message.channel.send(
					`You need to either write reset or set a valid hex colour.\nRemember space between each hex colour.`,
				)
			if (!colour2 && colour1 !== `reset`)
				return message.channel.send(
					`You need to either write reset or set a valid hex colour.\nRemember space between each hex colour.`,
				)
			if (!colour3 && colour1 !== `reset`)
				return message.channel.send(
					`You need to either write reset or set a valid hex colour.\nRemember space between each hex colour.`,
				)

			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour1 === `reset`) {
				await profile.update(
					{
						xpDoneGlobalColour1: undefined,
						xpDoneGlobalColour2: undefined,
						xpDoneGlobalColour3: undefined,
					},
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(`${message.author} your xp bar (2/right) colours has been successfully reset.`)
			} else {
				const hexTest1 = /^#[0-9A-F]{6}$/i.test(colour1)
				const hexTest2 = /^#[0-9A-F]{6}$/i.test(colour2)
				const hexTest3 = /^#[0-9A-F]{6}$/i.test(colour3)
				if (hexTest1 !== true) {
					return message.channel.send(`Your first hex color is invalid. Try another one.`)
				}
				if (hexTest2 !== true) {
					return message.channel.send(`Your second hex color is invalid. Try another one.`)
				}
				if (hexTest3 !== true) {
					return message.channel.send(`Your third hex color is invalid. Try another one.`)
				}
				await profile.update(
					{
						xpDoneGlobalColour1: colour1,
						xpDoneGlobalColour2: colour2,
						xpDoneGlobalColour3: colour3,
					},
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(`${message.author} your xp bar (2/right) colours has been set.`)
			}
		}

		async function setXPBarBgBothOpacity(message: Message, opacity: string) {
			if (!opacity) return message.channel.send(`You need to either write reset or set a valid opacity value.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity === `reset`) {
				await profile.update(
					{ xpBarOpacity: undefined, xpBar2Opacity: undefined },
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(
					`${message.author} both your xp bar bg colour opacity values has been successfully reset.`,
				)
			} else {
				let validOpacityValue: boolean
				const parseOpacity = Math.round(parseFloat(opacity))
				parseOpacity >= 0 && parseOpacity <= 100 ? (validOpacityValue = true) : (validOpacityValue = false)
				if (validOpacityValue === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				} else {
					await profile.update(
						{ xpBarOpacity: parseOpacity, xpBar2Opacity: parseOpacity },
						{ where: { userID: userData[0].userID } },
					)
					return message.channel.send(
						`${message.author} both your xp bar bg colour opacity values has been successfully set.`,
					)
				}
			}
		}

		async function setXPBarBgBothColour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update(
					{ xpBarColour: undefined, xpBar2Colour: undefined },
					{ where: { userID: userData[0].userID } },
				)
				return message.channel.send(`${message.author} both your xp bar bg colours has been successfully reset.`)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update({ xpBarColour: colour, xpBar2Colour: colour }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} both your xp bar bg colours has been set.`)
				}
			}
		}

		async function setXPBarBgOpacity(message: Message, opacity: string) {
			if (!opacity) return message.channel.send(`You need to either write reset or set a valid opacity value.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity === `reset`) {
				await profile.update({ xpBarOpacity: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(
					`${message.author} your xp bar bg(1/left) colour opacity has been successfully reset.`,
				)
			} else {
				let validOpacityValue: boolean
				const parseOpacity = Math.round(parseFloat(opacity))
				parseOpacity >= 0 && parseOpacity <= 100 ? (validOpacityValue = true) : (validOpacityValue = false)
				if (validOpacityValue === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				} else {
					await profile.update({ xpBarOpacity: parseOpacity }, { where: { userID: userData[0].userID } })
					return message.channel.send(
						`${message.author} your xp bar bg (1/left) colour opacity has been successfully set.`,
					)
				}
			}
		}

		async function setXPBarBgColour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update({ xpBarColour: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your xp bar bg (1/left) colour has been successfully reset.`)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update({ xpBarColour: colour }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your xp bar bg (1/left) colour has been set.`)
				}
			}
		}

		async function setXPBarBg2Opacity(message: Message, opacity: string) {
			if (!opacity) return message.channel.send(`You need to either write reset or set a valid opacity value.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity === `reset`) {
				await profile.update({ xpBar2Opacity: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(
					`${message.author} your xp bar bg (2/right) colour opacity has been successfully reset.`,
				)
			} else {
				let validOpacityValue: boolean
				const parseOpacity = Math.round(parseFloat(opacity))
				parseOpacity >= 0 && parseOpacity <= 100 ? (validOpacityValue = true) : (validOpacityValue = false)
				if (validOpacityValue === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				} else {
					await profile.update({ xpBar2Opacity: parseOpacity }, { where: { userID: userData[0].userID } })
					return message.channel.send(
						`${message.author} your xp bar bg (2/right) colour opacity has been successfully set.`,
					)
				}
			}
		}

		async function setXPBarBg2Colour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update({ xpBar2Colour: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your xp bar bg (2/right) colour has been successfully reset.`)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update({ xpBar2Colour: colour }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your xp bar bg (2/right) colour has been set.`)
				}
			}
		}

		// description

		async function setDescriptionOpacity(message: Message, opacity: string) {
			if (!opacity) return message.channel.send(`You need to either write reset or set a valid opacity value.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity === `reset`) {
				await profile.update({ descriptionColourOpacity: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your description colour opacity has been successfully reset.`)
			} else {
				let validOpacityValue: boolean
				const parseOpacity = Math.round(parseFloat(opacity))
				parseOpacity >= 0 && parseOpacity <= 100 ? (validOpacityValue = true) : (validOpacityValue = false)
				if (validOpacityValue === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				} else {
					await profile.update({ descriptionColourOpacity: parseOpacity }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your description colour opacity has been set.`)
				}
			}
		}

		async function setDescriptionColour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update({ descriptionColour: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your description colour has been successfully reset.`)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update({ descriptionColour: colour }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your description colour has been set.`)
				}
			}
		}

		async function descriptionStatus(message: Message) {
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			const statusEmbed = new MessageEmbed()
				.setAuthor(
					message.member?.nickname
						? `${message.member?.nickname} (${message.author.username}#${message.author.discriminator})`
						: `${message.author.username}#${message.author.discriminator}`,
					message.author.avatarURL({ dynamic: true }) as string,
				)
				.setColor(`${await urlToColours(client?.user?.avatarURL({ format: `png` }) as string)}`)
				.setTimestamp().setDescription(`
            Description - ${userData[0].description === null ? `Not set.` : userData[0].description}
            Description Colour - ${userData[0].descriptionColour === null ? `Not set.` : userData[0].descriptionColour}
            Description Opacity - ${
							userData[0].descriptionColourOpacity === null ? `Not set.` : userData[0].descriptionColourOpacity
						}`)
			return message.channel.send(statusEmbed)
		}

		async function setDescription(message: Message, text: string) {
			if (!text) return message.channel.send(`You need to either write --reset, --empty or write a description`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (text === `--reset`) {
				await profile.update({ backgroundColour: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your description has been successfully reset.`)
			} else if (text === `--empty`) {
				await profile.update({ backgroundColour: `` }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your description has been successfully emptied.`)
			} else {
				await profile.update({ description: text }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your description has been set.`)
			}
		}

		// bg overlay

		async function setOverlayOpacity(message: Message, opacity: string) {
			if (!opacity) return message.channel.send(`You need to either write reset or set a valid opacity value.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity === `reset`) {
				await profile.update({ overlayOpacity: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your overlay colour opacity has been successfully reset.`)
			} else {
				let validOpacityValue: boolean
				const parseOpacity = Math.round(parseFloat(opacity))
				parseOpacity >= 0 && parseOpacity <= 100 ? (validOpacityValue = true) : (validOpacityValue = false)
				if (validOpacityValue === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				} else {
					await profile.update({ overlayOpacity: parseOpacity }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your overlay colour opacity has been set.`)
				}
			}
		}

		async function setOverlayColour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update({ overlayColour: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your overlay colour has been successfully reset.`)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update({ overlayColour: colour }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your overlay colour has been set.`)
				}
			}
		}

		async function overlayStatus(message: Message) {
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			const statusEmbed = new MessageEmbed()
				.setAuthor(
					message.member?.nickname
						? `${message.member?.nickname} (${message.author.username}#${message.author.discriminator})`
						: `${message.author.username}#${message.author.discriminator}`,
					message.author.avatarURL({ dynamic: true }) as string,
				)
				.setColor(`${await urlToColours(client?.user?.avatarURL({ format: `png` }) as string)}`)
				.setTimestamp().setDescription(`
            Overlay Colour - ${userData[0].overlayColour === null ? `Not set.` : userData[0].overlayColour}
            Overlay Opacity - ${userData[0].overlayOpacity === null ? `Not set.` : userData[0].overlayOpacity}`)
			return message.channel.send(statusEmbed)
		}

		// sidebar

		async function setUsernameColour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update({ usernameColour: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your username colour has been successfully reset.`)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update({ usernameColour: colour }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your username colour has been set.`)
				}
			}
		}

		async function setDiscriminatorColour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update({ discriminatorColour: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your discriminator colour has been successfully reset.`)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update({ discriminatorColour: colour }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your discriminator colour has been set.`)
				}
			}
		}

		async function setSidebarOpacity(message: Message, opacity: string) {
			if (!opacity) return message.channel.send(`You need to either write reset or set a valid opacity value.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (opacity === `reset`) {
				await profile.update({ sidebarOpacity: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your sidebar colour opacity has been successfully reset.`)
			} else {
				let validOpacityValue: boolean
				const parseOpacity = Math.round(parseFloat(opacity))
				parseOpacity >= 0 && parseOpacity <= 100 ? (validOpacityValue = true) : (validOpacityValue = false)
				if (validOpacityValue === false) {
					return message.channel.send(`Your opacity value is invalid.\nRemember for 50% opacity you need to write "50"`)
				} else {
					await profile.update({ sidebarOpacity: parseOpacity }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your sidebar colour opacity has been set.`)
				}
			}
		}

		async function setSidebarColour(message: Message, colour: string) {
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (colour === `reset`) {
				await profile.update({ sidebarColour: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your sidebar colour has been successfully reset.`)
			} else {
				const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
				if (hexTest !== true) {
					return message.channel.send(`Your hex color is invalid. Try another one.`)
				} else {
					await profile.update({ sidebarColour: colour }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your sidebar colour has been set.`)
				}
			}
		}

		async function setSidebarBlur(message: Message, blur: string) {
			if (!blur) return message.channel.send(`You need to either write reset or set a valid blur number value.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (blur === `reset`) {
				await profile.update({ sidebarBlur: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your sidebar blur has been successfully reset.`)
			} else {
				const reg = new RegExp(`^[0-9]+$`)
				if (reg.test(blur) === false) {
					return message.channel.send(`Your blur number value is invalid. You need to include a number.`)
				} else {
					await profile.update({ sidebarBlur: Math.round(parseInt(blur)) }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your sidebar blur has been set.`)
				}
			}
		}

		async function setSidebarValueColour(message: Message, row: string, colour: string) {
			if (!row) return message.channel.send(`You need to specify a valid row.\nEither "server", "global" or "bento".`)
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (row === `server`) {
				if (colour === `reset`) {
					await profile.update({ sidebarValueServerColour: undefined }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your sidebar server rank colour has been successfully reset.`)
				} else {
					const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
					if (hexTest !== true) {
						return message.channel.send(`Your hex color is invalid. Try another one.`)
					} else {
						await profile.update({ sidebarValueServerColour: colour }, { where: { userID: userData[0].userID } })
						return message.channel.send(`${message.author} your sidebar server rank colour has been set.`)
					}
				}
			} else if (row === `global`) {
				if (colour === `reset`) {
					await profile.update({ sidebarValueGlobalColour: undefined }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your sidebar global rank colour has been successfully reset.`)
				} else {
					const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
					if (hexTest !== true) {
						return message.channel.send(`Your hex color is invalid. Try another one.`)
					} else {
						await profile.update({ sidebarValueGlobalColour: colour }, { where: { userID: userData[0].userID } })
						return message.channel.send(`${message.author} your sidebar global rank colour has been set.`)
					}
				}
			} else if (row === `bento`) {
				if (colour === `reset`) {
					await profile.update({ sidebarValueBentoColour: undefined }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your sidebar bento rank colour has been successfully reset.`)
				} else {
					const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
					if (hexTest !== true) {
						return message.channel.send(`Your hex color is invalid. Try another one.`)
					} else {
						await profile.update({ sidebarValueBentoColour: colour }, { where: { userID: userData[0].userID } })
						return message.channel.send(`${message.author} your sidebar bento rank colour has been set.`)
					}
				}
			} else {
				return message.channel.send(`Invalid row.\n\nYour row needs to be either "server", "global" or "bento".`)
			}
		}

		async function setSidebarItemColour(message: Message, row: string, colour: string) {
			if (!row)
				return message.channel.send(
					`You need to specify a valid row.\nEither "server", "global", "bento" or "timezone".`,
				)
			if (!colour) return message.channel.send(`You need to either write reset or set a valid hex colour.`)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (row === `server`) {
				if (colour === `reset`) {
					await profile.update({ sidebarItemServerColour: undefined }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your sidebar server users colour has been successfully reset.`)
				} else {
					const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
					if (hexTest !== true) {
						return message.channel.send(`Your hex color is invalid. Try another one.`)
					} else {
						await profile.update({ sidebarItemServerColour: colour }, { where: { userID: userData[0].userID } })
						return message.channel.send(`${message.author} your sidebar server users colour has been set.`)
					}
				}
			} else if (row === `global`) {
				if (colour === `reset`) {
					await profile.update({ sidebarItemGlobalColour: undefined }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your sidebar global users colour has been successfully reset.`)
				} else {
					const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
					if (hexTest !== true) {
						return message.channel.send(`Your hex color is invalid. Try another one.`)
					} else {
						await profile.update({ sidebarItemGlobalColour: colour }, { where: { userID: userData[0].userID } })
						return message.channel.send(`${message.author} your sidebar global users colour has been set.`)
					}
				}
			} else if (row === `bento`) {
				if (colour === `reset`) {
					await profile.update({ sidebarItemBentoColour: undefined }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your sidebar bento users colour has been successfully reset.`)
				} else {
					const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
					if (hexTest !== true) {
						return message.channel.send(`Your hex color is invalid. Try another one.`)
					} else {
						await profile.update({ sidebarItemBentoColour: colour }, { where: { userID: userData[0].userID } })
						return message.channel.send(`${message.author} your sidebar bento users colour has been set.`)
					}
				}
			} else if (row === `timezone`) {
				if (colour === `reset`) {
					await profile.update({ sidebarItemTimezoneColour: undefined }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your sidebar timezone colour has been successfully reset.`)
				} else {
					const hexTest = /^#[0-9A-F]{6}$/i.test(colour)
					if (hexTest !== true) {
						return message.channel.send(`Your hex color is invalid. Try another one.`)
					} else {
						await profile.update({ sidebarItemTimezoneColour: colour }, { where: { userID: userData[0].userID } })
						return message.channel.send(`${message.author} your sidebar timezone colour has been set.`)
					}
				}
			} else {
				return message.channel.send(
					`Invalid row.\n\nYour row needs to be either "server", "global", "bento" or "timezone".`,
				)
			}
		}

		async function sidebarStatus(message: Message) {
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			const statusEmbed = new MessageEmbed()
				.setAuthor(
					message.member?.nickname
						? `${message.member?.nickname} (${message.author.username}#${message.author.discriminator})`
						: `${message.author.username}#${message.author.discriminator}`,
					message.author.avatarURL({ dynamic: true }) as string,
				)
				.setColor(`${await urlToColours(client?.user?.avatarURL({ format: `png` }) as string)}`)
				.setTimestamp().setDescription(`
            Username Colour - ${userData[0].usernameColour === null ? `Not set.` : userData[0].usernameColour}
            Discriminator Colour - ${
							userData[0].discriminatorColour === null ? `Not set.` : userData[0].discriminatorColour
						}
            Sidebar Opacity - ${userData[0].sidebarOpacity === null ? `Not set.` : userData[0].sidebarOpacity}
            Sidebar Colour - ${userData[0].sidebarColour === null ? `Not set.` : userData[0].sidebarColour}
            Sidebar Blur - ${userData[0].sidebarBlur === null ? `Not set.` : userData[0].sidebarBlur}
            Sidebar Server Rank Colour - ${
							userData[0].sidebarValueServerColour === null ? `Not set.` : userData[0].sidebarValueServerColour
						}
            Sidebar Global Rank Colour - ${
							userData[0].sidebarValueGlobalColour === null ? `Not set.` : userData[0].sidebarValueGlobalColour
						}
            Sidebar Bento Rank Colour - ${
							userData[0].sidebarValueBentoColour === null ? `Not set.` : userData[0].sidebarValueBentoColour
						}
            Sidebar Server Users Colour - ${
							userData[0].sidebarItemServerColour === null ? `Not set.` : userData[0].sidebarItemServerColour
						}
            Sidebar Global Users Colour - ${
							userData[0].sidebarItemGlobalColour === null ? `Not set.` : userData[0].sidebarItemGlobalColour
						}
            Sidebar Bento Users Colour - ${
							userData[0].sidebarItemBentoColour === null ? `Not set.` : userData[0].sidebarItemBentoColour
						}
            Sidebar Timezone Colour - ${
							userData[0].sidebarItemTimezoneColour === null ? `Not set.` : userData[0].sidebarItemTimezoneColour
						}`)
			return message.channel.send(statusEmbed)
		}

		async function setTimezone(message: Message, timezone: string) {
			if (!timezone)
				return message.channel.send(
					`You need to either write reset or set a valid timezone.\nThe structure is e.g. "Europe/Copenhagen"\nCheck the list here if you don't know how to write your timezone <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List> `,
				)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (timezone === `reset`) {
				await profile.update({ timezone: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your timezone has been successfully reset.`)
			} else {
				const timezoneTest = !!moment.tz.zone(timezone)
				if (timezoneTest !== true) {
					return message.channel.send(
						`Your timezone is invalid.\nThe structure is e.g. "Europe/Copenhagen"\nCheck the list here if you don't know how to write your timezone <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List> `,
					)
				} else {
					await profile.update({ timezone: timezone }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your timezone has been set.`)
				}
			}
		}

		async function setBirthday(message: Message, birthday: string) {
			if (!birthday)
				return message.channel.send(
					`You need to either write reset or set a valid birthday.\nThe structure is e.g. "25 November".`,
				)
			initModels(database)

			const userData = await profile.findOrCreate({
				raw: true,
				where: { userID: message.author.id },
				defaults: { userID: BigInt(message.author.id) },
			})
			if (birthday === `reset`) {
				await profile.update({ birthday: undefined }, { where: { userID: userData[0].userID } })
				return message.channel.send(`${message.author} your birthday has been successfully reset.`)
			} else {
				const birthdayTest = !!Date.parse(birthday)
				if (birthdayTest !== true) {
					return message.channel.send(`Your date is invalid.\nThe structure is e.g. "25 November".`)
				} else {
					await profile.update({ birthday: birthday }, { where: { userID: userData[0].userID } })
					return message.channel.send(`${message.author} your birthday has been set.`)
				}
			}
		}

		// general setting

		async function deleteUserProfile(message: Message) {
			initModels(database)

			const statusEmbed = new MessageEmbed()
				.setAuthor(
					message.member?.nickname
						? `${message.member?.nickname} (${message.author.username}#${message.author.discriminator})`
						: `${message.author.username}#${message.author.discriminator}`,
					message.author.avatarURL({ dynamic: true }) as string,
				)
				.setColor(`${await urlToColours(client?.user?.avatarURL({ format: `png` }) as string)}`)
				.setTimestamp()
				.setTitle(`Are you sure you want to delete your saved profile?`)

			const confirmEmbed = await message.channel.send(statusEmbed)
			await confirmEmbed.react(`✅`)
			await confirmEmbed.react(`❌`)
			const filter = (reaction: MessageReaction, user: User) =>
				[`✅`, `❌`].includes(reaction.emoji.name) && message.author.id === user.id
			const collector = confirmEmbed.createReactionCollector(filter, {
				idle: 300000,
				dispose: true,
			})

			collector.on(`collect`, async (reaction, user) => {
				if (reaction.emoji.name === `✅`) {
					reaction.users.remove(user)
					let newEmbed: MessageEmbed
					const profileDelete = await profile.destroy({
						where: { userID: message.author.id },
					})
					if (profileDelete === 0) {
						newEmbed = new MessageEmbed()
							.setAuthor(
								message.member?.nickname
									? `${message.member?.nickname} (${message.author.username}#${message.author.discriminator})`
									: `${message.author.username}#${message.author.discriminator}`,
								message.author.avatarURL({ dynamic: true }) as string,
							)
							.setColor(`${await urlToColours(client?.user?.avatarURL({ format: `png` }) as string)}`)
							.setTimestamp()
							.setTitle(`Error deleting your profile.\nEither a Database problem or your profile not existing`)
					} else {
						newEmbed = new MessageEmbed()
							.setAuthor(
								message.member?.nickname
									? `${message.member?.nickname} (${message.author.username}#${message.author.discriminator})`
									: `${message.author.username}#${message.author.discriminator}`,
								message.author.avatarURL({ dynamic: true }) as string,
							)
							.setColor(`${await urlToColours(client?.user?.avatarURL({ format: `png` }) as string)}`)
							.setTimestamp()
							.setTitle(`Your profile was successfully deleted.`)
					}
					await confirmEmbed.reactions.removeAll().catch((error) => console.error(`Failed to clear reactions: `, error))
					await confirmEmbed.edit(newEmbed)
				} else if (reaction.emoji.name === `❌`) {
					collector.stop()
					return await confirmEmbed.delete()
				}
			})
		}
	},
}
