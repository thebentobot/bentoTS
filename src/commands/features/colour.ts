import { Message, MessageEmbed } from 'discord.js';
import { Command } from '../../interfaces';
import { getHTMLImage } from '../../utils';

export const command: Command = {
    name: 'colour',
    aliases: ['color'],
    category: 'features',
    description: 'Make Bento send a picture of the hexcode/RGB colour you sent',
    usage: 'colour <hexcode colour / RGB colour>',
    website: 'https://www.bentobot.xyz/commands#colour',
    run: async (client, message, args): Promise<Message> => {
        let colour: string | string[] = args.join(' ').trim();
        let hexColour: string;
        let rgbColour: number[] | any;
        let hex = colour.match(/^(?:#|0x)([0-9a-f]{6})$/i);
        let rgb = colour.match(/(^\d{1,3})\s*,?\s*(\d{1,3})\s*,?\s*(\d{1,3}$)/i);

        if (!rgb && !hex) {
            message.channel.send(`Please provide a valid colour hexcode or RGB values.`);
            return;
        }

        if (hex) {
            hexColour = colour
            hexColour = hex[1];
            let [ red, green, blue ] = hexColour.match(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i).slice(1);
            rgbColour = [parseInt(red, 16), parseInt(green, 16), parseInt(blue, 16)];
        } else if (rgb) {
            rgbColour = colour
            rgbColour = rgb.slice(1).map(c => parseInt(c))
            let [ red, green, blue ] = rgbColour;
            hexColour = `${await rgbToHex(red)}${await rgbToHex(green)}${await rgbToHex(blue)}`;
        }

        let hexValue = parseInt(hexColour, 16);
        if (hexValue < 0 || hexValue > 16777215) {
            message.channel.send(`Please provide a valid colour hexcode or RGB values.`);
            return;
        }

        for (let component of rgbColour) {
            if (component < 0 || component > 255) {
                message.channel.send(`Please provide a valid colour hexcode or RGB values.`);
                return;
            }
        }
        
        let hsv = await rgbToHsv(rgbColour);

        let htmlString = `<html> <style>* {margin:0; padding:0;}</style> <div style="background-color:${hexColour}; width:200px; height:200px"></div></html>`;
        let image = await getHTMLImage(htmlString, '200', '200');

        let embed = new MessageEmbed({
            title: `Colour \`#${hexColour.toLowerCase()}\``,
            color: hexValue,
            image: { url: `attachment://${hexColour}.png`},
            footer: { text: `RGB: ${rgbColour.join(', ')} | HSV: ${hsv[0]}, ${hsv[1]}%, ${hsv[2]}%` }
        });

        return message.channel.send({embed, files: [{ attachment: image, name: `${hexColour}.png` }]});

        async function rgbToHex (colour: any): Promise<string> {
            let hex: string = colour.toString(16);
            return hex.length === 1 ? '0'+hex : hex;
        }

        async function rgbToHsv ([red, green, blue]): Promise<number[]> {
            red   /= 255;
            green /= 255;
            blue  /= 255;

            console.log(red)
            console.log(green)
            console.log(blue)
            
            let max = Math.max(red, green, blue);
            let min = Math.min(red, green, blue);
            let hue: number, sat: number, val: number;
            val = Math.round(max*100);

            let diff = max - min;
            sat = Math.round((max == 0 ? 0 : diff / max)*100);

            if (max == min) {
                hue = 0;
            } else {
                switch (max) {
                case red:   hue = (green - blue ) / diff + 0; break;
                case green: hue = (blue  - red  ) / diff + 2; break;
                case blue:  hue = (red   - green) / diff + 4; break;
                }
                hue /= 6;
                if (hue < 0) hue += 1;
                hue = Math.round(hue*360);
            }

            return [ hue, sat, val ];
        }
    }
}