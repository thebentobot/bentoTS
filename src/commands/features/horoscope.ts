import { Command } from '../../interfaces';
import { capitalize, horoSigns, horoSignsLow } from '../../utils';
import database from '../../database/database';
import { initModels, guild, horoscope, horoscopeCreationAttributes } from '../../database/models/init-models';
import { Message, MessageEmbed, MessageMentions } from 'discord.js';
const aztroJs = require("aztro-js");
import stc from 'string-to-color'
import { sign } from 'tiktok-scraper';

export const command: Command = {
    name: 'horoscope',
    aliases: ['horo', 'astro', 'zodiac'],
    category: 'features',
    description: 'Provides a horoscope based on day and sign. If you search signs, it provides a list of signs and their date range',
    usage: 'horoscope <[today]/tomorrow/yesterday> [<sign>]\nhoroscope <save> <sign>',
    run: async (client, message, args): Promise<any> => {
        if (!args.length) {
            return horoToday(message);
        }

        if (args[0] === 'tomorrow') {
            return horoTomorrow(message, args[1]);
        }

        /*
        if (args[0] === 'yesterday') {
            return horoYesterday(message, args[1]);
        }
        */


        if (args[0]) {
            return horoToday(message, args[0]);
        }

        if (args[0] === 'sign' || 'signs') {
            return message.channel.send('https://i.pinimg.com/736x/43/aa/50/43aa50c918f3bd03abb71b6d4aaf93c7--new-zodiac-signs-zodiac-signs-and-dates.jpg')
        }

        // we need to take into considering if someone wants to see another user's horoscope

        async function horoToday (message: Message, user?: any) {
            initModels(database);

            let userID: string;

            if (!user) {
                userID = message.author.id
            } else {
                try {
                    const mentionedUser = message.mentions.members.first() || await message.guild.members.fetch(user);
                    userID = mentionedUser.id
                } catch {
                    const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                    return message.channel.send(`You haven't saved your horoscope sign.\nUse \`${guildData.prefix}horoscope save <sign>\` to save your horoscope.`)
                }
            }

            const horoData = await horoscope.findOne({raw: true, where : {userID: userID}})
            let sign: string = horoData.horoscope

            aztroJs.getTodaysHoroscope(sign, function(res: any) {
                const exampleEmbed = new MessageEmbed()
                    .setColor(stc(res.color))
                    .setAuthor(`${message.guild.members.cache.get(userID).user.username}`, message.guild.members.cache.get(userID).user.avatarURL())
                    .setTitle(`${capitalize(sign)}'s horoscope for ${res.current_date}`)
                    .setDescription(res.description)
                    .setTimestamp()
                    .addFields(
                        { name: 'Date Range', value: `Between ${res.date_range}`, inline: true},
                        { name: 'Compatibility 😳', value: `${res.compatibility} 😏`, inline: true},
                        { name: 'Mood', value: `${res.mood}`, inline: true},
                        { name: 'Colour', value: `${res.color}`, inline: true},
                        { name: 'Lucky number', value: `${res.lucky_number}`, inline: true},
                        { name: 'Lucky time', value: `${res.lucky_time}`, inline: true},
                    );     
                return message.channel.send(exampleEmbed)
            });
        }

        async function horoTomorrow (message: Message, input?: any) {
            initModels(database);

            let userID: string;
            let sign: string;

            // ?horo tomorrow - returns horo for user
            // ?horo tomorrow [sign] - returns for sign
            // ?horo tomorrow [user] - returns for user

            if (horoSigns.includes(input) || horoSignsLow.includes(input)) {
                sign = input
            } else if (input = message.mentions.members.first() || await message.guild.members.fetch(input)) {
                console.log('reach here') // it reached here when ?horo tomorrow, should've reached last else statement
                const mentionedUser = message.mentions.members.first() || await message.guild.members.fetch(input);
                userID = mentionedUser.id
                const horoData = await horoscope.findOne({raw: true, where : {userID: userID}})
                sign = horoData.horoscope
            } else {
                try {
                    console.log('reach')
                    const horoData = await horoscope.findOne({raw: true, where : {userID: message.author.id}})
                    sign = horoData.horoscope
                } catch {
                    const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                    return message.channel.send(`Your request was invalid. Either you wrote the wrong sign or the user you inserted hasn't saved their sign.\nUse \`${guildData.prefix}help horoscope\` for help with your request.`)
                }
            }

            aztroJs.getTomorrowsHoroscope(sign, function(res: any) {
                const exampleEmbed = new MessageEmbed()
                    .setColor(stc(res.color))
                    .setAuthor(`${userID ? message.guild.members.cache.get(userID).user.username : message.author.username}`, userID ? message.guild.members.cache.get(userID).user.avatarURL() : message.author.avatarURL())
                    .setTitle(`${capitalize(sign)}'s horoscope for ${res.current_date}`)
                    .setDescription(res.description)
                    .setTimestamp()
                    .addFields(
                        { name: 'Date Range', value: `Between ${res.date_range}`, inline: true},
                        { name: 'Compatibility 😳', value: `${res.compatibility} 😏`, inline: true},
                        { name: 'Mood', value: `${res.mood}`, inline: true},
                        { name: 'Colour', value: `${res.color}`, inline: true},
                        { name: 'Lucky number', value: `${res.lucky_number}`, inline: true},
                        { name: 'Lucky time', value: `${res.lucky_time}`, inline: true},
                    );     
                return message.channel.send(exampleEmbed)
            });
        }
    }
}