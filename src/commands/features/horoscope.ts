import { Command } from '../../interfaces';
import { capitalize, horoSigns, horoSignsLow } from '../../utils';
import database from '../../database/database';
import { initModels, guild, horoscope, horoscopeCreationAttributes, horoscopeAttributes } from '../../database/models/init-models';
import { Message, MessageEmbed } from 'discord.js';
const aztroJs = require("aztro-js");
import stc from 'string-to-color'

export const command: Command = {
    name: 'horoscope',
    aliases: ['horo', 'astro', 'zodiac'],
    category: 'features',
    description: 'Provides a horoscope based on day and sign. If you search signs, it provides a list of signs and their date range',
    usage: 'horoscope <save> <sign>\nhoroscope <today/tomorrow/yesterday> [sign or a user mention/id]\nIf you don\'t specify a user or sign, then it will check for yourself. If you don\'t mention anything and have a sign saved, it shows for today.',
    run: async (client, message, args): Promise<any> => {
        if (!args.length) {
            return horoToday(message);
        }

        if (args[0] === 'save') {
            return horoSave(message, args[1]);
        }

        if (args[0] === 'tomorrow') {
            return horoTomorrow(message, args[1]);
        }

        if (args[0] === 'today') {
            return horoToday(message, args[1]);
        }

        if (args[0] === 'yesterday') {
            return horoYesterday(message, args[1]);
        }

        if (args[0] === 'sign' || 'signs') {
            return message.channel.send('https://i.pinimg.com/736x/43/aa/50/43aa50c918f3bd03abb71b6d4aaf93c7--new-zodiac-signs-zodiac-signs-and-dates.jpg')
        }

        if (args[0]) {
            return horoToday(message, args[0]);
        }

        async function horoSave (message: Message, input?: any) {
            initModels(database);

            let userID: string;
            let sign: string;

            userID = message.author.id
            
            if (horoSigns.includes(input) || horoSignsLow.includes(input)) {
                sign = input
            } else {
                const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                return message.channel.send(`Your request was invalid. You wrote the wrong sign or misspelled the sign.\nUse \`${guildData.prefix}signs\` to see a list of horoscopes, or \`${guildData.prefix}help horoscope\` for help with your request.`)
            }

            const horoAttr: horoscopeCreationAttributes = {
                userID: BigInt(userID),
                horoscope: horoscope[capitalize(sign)]
            }
            try {
                await horoscope.create(horoAttr)
                return message.channel.send(`${message.author.username} your horoscope \`${capitalize(sign)}\` was saved!\nYou can now use horoscope commands without signs, to see your horoscope.`)
            } catch {
                return message.channel.send(`Database error, couldn't save your horoscope. I am sorry :-(`)
            }
        }

        async function horoToday (message: Message, input?: any) {
            initModels(database);

            let userID: string;
            let sign: string;

            if (horoSigns.includes(input) || horoSignsLow.includes(input)) {
                sign = input
            } else {
                try {
                const mentionedUser = message.mentions.members.first() || await message.guild.members.fetch(input);
                userID = mentionedUser.id
                const horoData = await horoscope.findOne({raw: true, where : {userID: userID}})
                sign = horoData.horoscope
                } catch {
                    try {
                        const horoData = await horoscope.findOne({raw: true, where : {userID: message.author.id}})
                        sign = horoData.horoscope
                    } catch {
                        const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                        return message.channel.send(`Your request was invalid. Either you wrote the wrong sign or the user you inserted hasn't saved their sign.\nUse \`${guildData.prefix}help horoscope\` for help with your request.`)
                    }
                }
            }

            aztroJs.getTodaysHoroscope(sign, function(res: any) {
                const exampleEmbed = new MessageEmbed()
                    .setColor(stc(res.color))
                    .setAuthor(`${userID ? message.guild.members.cache.get(userID).user.username : message.author.username}`, userID ? message.guild.members.cache.get(userID).user.avatarURL({format: 'png', dynamic: true}) : message.author.avatarURL({format: 'png', dynamic: true}))
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

            if (horoSigns.includes(input) || horoSignsLow.includes(input)) {
                sign = input
            } else {
                try {
                const mentionedUser = message.mentions.members.first() || await message.guild.members.fetch(input);
                userID = mentionedUser.id
                const horoData = await horoscope.findOne({raw: true, where : {userID: userID}})
                sign = horoData.horoscope
                } catch {
                    try {
                        const horoData = await horoscope.findOne({raw: true, where : {userID: message.author.id}})
                        sign = horoData.horoscope
                    } catch {
                        const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                        return message.channel.send(`Your request was invalid. Either you wrote the wrong sign or the user you inserted hasn't saved their sign.\nUse \`${guildData.prefix}help horoscope\` for help with your request.`)
                    }
                }
            }

            aztroJs.getTomorrowsHoroscope(sign, function(res: any) {
                const exampleEmbed = new MessageEmbed()
                    .setColor(stc(res.color))
                    .setAuthor(`${userID ? message.guild.members.cache.get(userID).user.username : message.author.username}`, userID ? message.guild.members.cache.get(userID).user.avatarURL({format: 'png', dynamic: true}) : message.author.avatarURL({format: 'png', dynamic: true}))
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

        async function horoYesterday (message: Message, input?: any) {
            initModels(database);

            let userID: string;
            let sign: string;

            if (horoSigns.includes(input) || horoSignsLow.includes(input)) {
                sign = input
            } else {
                try {
                const mentionedUser = message.mentions.members.first() || await message.guild.members.fetch(input);
                userID = mentionedUser.id
                const horoData = await horoscope.findOne({raw: true, where : {userID: userID}})
                sign = horoData.horoscope
                } catch {
                    try {
                        const horoData = await horoscope.findOne({raw: true, where : {userID: message.author.id}})
                        sign = horoData.horoscope
                    } catch {
                        const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                        return message.channel.send(`Your request was invalid. Either you wrote the wrong sign or the user you inserted hasn't saved their sign.\nUse \`${guildData.prefix}help horoscope\` for help with your request.`)
                    }
                }
            }

            aztroJs.getYesterdaysHoroscope(sign, function(res: any) {
                const exampleEmbed = new MessageEmbed()
                    .setColor(stc(res.color))
                    .setAuthor(`${userID ? message.guild.members.cache.get(userID).user.username : message.author.username}`, userID ? message.guild.members.cache.get(userID).user.avatarURL({format: 'png', dynamic: true}) : message.author.avatarURL({format: 'png', dynamic: true}))
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