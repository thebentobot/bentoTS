import { Message, MessageEmbed } from 'discord.js'
import { Command } from '../../interfaces'
import { getHTMLImage } from '../../utils'

export const command: Command = {
	name: `colour`,
	aliases: [`color`],
	category: `features`,
	description: `Make Bento send a picture of the hexcode/RGB colour you sent`,
	usage: `colour <hexcode colour / RGB colour>`,
	website: `https://www.bentobot.xyz/commands#colour`,
	run: async (client, message, args): Promise<Message> => {
		const colour: string | string[] = args.join(` `).trim()
		let hexColour: string | undefined
		let rgbColour: number[] | undefined
		const hex = colour.match(/^(?:#|0x)([0-9a-f]{6})$/i)
		const rgb = colour.match(/(^\d{1,3})\s*,?\s*(\d{1,3})\s*,?\s*(\d{1,3}$)/i)

		if (!rgb && !hex) {
			return message.channel.send(`Please provide a valid colour hexcode or RGB values.`)
		}

		if (hex) {
			hexColour = hex[1]
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const [red, green, blue] = hexColour.match(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i)!.slice(1)
			rgbColour = [parseInt(red, 16), parseInt(green, 16), parseInt(blue, 16)]
		} else if (rgb) {
			rgbColour = rgb.slice(1).map((c) => parseInt(c))
			const [red, green, blue] = rgbColour
			hexColour = `${await rgbToHex(red)}${await rgbToHex(green)}${await rgbToHex(blue)}`
		}

		const hexValue = parseInt(hexColour as string, 16)
		if (hexValue < 0 || hexValue > 16777215) {
			return message.channel.send(`Please provide a valid colour hexcode or RGB values.`)
		}

		for (const component of rgbColour as number[]) {
			if (component < 0 || component > 255) {
				return message.channel.send(`Please provide a valid colour hexcode or RGB values.`)
			}
		}

		const hsv = await rgbToHsv(rgbColour as number[])

		const htmlString = `<html> <style>* {margin:0; padding:0;}</style> <div style="background-color:${hexColour}; width:200px; height:200px"></div></html>`
		const image = await getHTMLImage(htmlString, `200`, `200`)

		const embed = new MessageEmbed({
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			title: `Colour \`#${hexColour!.toLowerCase()}\``,
			color: hexValue,
			image: { url: `attachment://${hexColour}.png` },
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			footer: { text: `RGB: ${rgbColour!.join(`, `)} | HSV: ${hsv[0]}, ${hsv[1]}%, ${hsv[2]}%` },
		})

		return message.channel.send({ embed, files: [{ attachment: image, name: `${hexColour}.png` }] })

		async function rgbToHex(colour: number): Promise<string> {
			const hex: string = colour.toString(16)
			return hex.length === 1 ? `0` + hex : hex
		}

		async function rgbToHsv([red, green, blue]: number[]): Promise<number[]> {
			red /= 255
			green /= 255
			blue /= 255

			const max = Math.max(red, green, blue)
			const min = Math.min(red, green, blue)
			let hue: number, sat: number, val: number
			// eslint-disable-next-line prefer-const
			val = Math.round(max * 100)

			const diff = max - min
			// eslint-disable-next-line prefer-const
			sat = Math.round((max === 0 ? 0 : diff / max) * 100)

			if (max === min) {
				hue = 0
			} else {
				switch (max) {
					case red:
						hue = (green - blue) / diff + 0
						break
					case green:
						hue = (blue - red) / diff + 2
						break
					case blue:
						hue = (red - green) / diff + 4
						break
				}
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				hue! /= 6
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				if (hue! < 0) hue! += 1
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				hue = Math.round(hue! * 360)
			}

			return [hue, sat, val]
		}
	},
}
