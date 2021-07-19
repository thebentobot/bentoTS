import { Command } from '../../interfaces';
import { capitalize, horoSigns, horoSignsLow, urlToColours } from '../../utils';
import database from '../../database/database';
import { initModels, guild, horoscope, horoscopeCreationAttributes} from '../../database/models/init-models';
import { Message, MessageEmbed, GuildMember } from 'discord.js';
//const aztroJs = require("aztro-js");
import * as aztroJs from 'aztro-js'
import chroma from 'chroma-js'
import { QueryTypes } from 'sequelize';

export const command: Command = {
    name: 'horoscope',
    aliases: ['horo', 'astro', 'zodiac', 'hs'],
    category: 'features',
    description: 'Provides a horoscope based on day and sign. If you search signs, it provides a list of signs and their date range',
    usage: '**horoscope <save> <sign>** to save your horoscope\n**horoscope <today/tomorrow/yesterday> [sign or a user mention/id]** to show horoscope for a given day and for a given user\nIf you don\'t specify a user or sign, then it will check for yourself. If you don\'t mention anything and have a sign saved, it shows for today.\n**horoscope list** shows a list of all users on the server who has saved their horoscope.\n**horoscope search <query>** makes you able to search for users who has a specific horoscope.',
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

        if (args[0] === 'search') {
            return horoSearch (message, args[1]);
        }

        if (args[0] === 'list') {
            return horoList (message);
        }

        if (args[0]) {
            return horoToday(message, args[0]);
        }

        if (args[0] === 'sign' || 'signs') {
            return message.channel.send('https://i.pinimg.com/736x/43/aa/50/43aa50c918f3bd03abb71b6d4aaf93c7--new-zodiac-signs-zodiac-signs-and-dates.jpg')
        }

        async function horoSave (message: Message, input?: GuildMember | any) {
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
                if (mentionedUser.user.bot === true) return message.channel.send(`A bot doesn't have a horoscope`)
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

            aztroJs.getTodaysHoroscope(sign, async function(res: any) {
                let colour: string = res.color
                const exampleEmbed = new MessageEmbed()
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
                try {
                    exampleEmbed.setColor(chroma(colour).hex())
                } catch {
                    exampleEmbed.setColor(`${userID ? await urlToColours(message.guild.members.cache.get(userID).user.avatarURL({format: 'png'})) : await urlToColours(message.author.avatarURL({format: 'png'}))}`)
                }
                return message.channel.send(exampleEmbed)
            });
        }

        async function horoTomorrow (message: Message, input?: GuildMember | any) {
            initModels(database);

            let userID: string;
            let sign: string;

            if (horoSigns.includes(input) || horoSignsLow.includes(input)) {
                sign = input
            } else {
                try {
                const mentionedUser = message.mentions.members.first() || await message.guild.members.fetch(input);
                if (mentionedUser.user.bot === true) return message.channel.send(`A bot doesn't have a horoscope`)
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

            aztroJs.getTomorrowsHoroscope(sign, async function(res: any) {
                let colour: string = res.color
                const exampleEmbed = new MessageEmbed()
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
                try {
                    exampleEmbed.setColor(chroma(colour).hex())
                } catch {
                    exampleEmbed.setColor(`${userID ? await urlToColours(message.guild.members.cache.get(userID).user.avatarURL({format: 'png'})) : await urlToColours(message.author.avatarURL({format: 'png'}))}`)
                }
                return message.channel.send(exampleEmbed)
            });
        }

        async function horoYesterday (message: Message, input?: GuildMember | any) {
            initModels(database);

            let userID: string;
            let sign: string;

            if (horoSigns.includes(input) || horoSignsLow.includes(input)) {
                sign = input
            } else {
                try {
                const mentionedUser = message.mentions.members.first() || await message.guild.members.fetch(input);
                if (mentionedUser.user.bot === true) return message.channel.send(`A bot doesn't have a horoscope`)
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

            aztroJs.getYesterdaysHoroscope(sign, async function(res: any) {
                let colour: string = res.color
                const exampleEmbed = new MessageEmbed()
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
                try {
                    exampleEmbed.setColor(chroma(colour).hex())
                } catch {
                    exampleEmbed.setColor(`${userID ? await urlToColours(message.guild.members.cache.get(userID).user.avatarURL({format: 'png'})) : await urlToColours(message.author.avatarURL({format: 'png'}))}`)
                }
                return message.channel.send(exampleEmbed)
            });
        }

        async function horoList (message: Message) {
            const serverRank = await database.query(`
            SELECT u.username, u.discriminator, horo.horoscope
            FROM horoscope AS horo
            INNER JOIN "user" u on u."userID" = horo."userID"
            INNER JOIN "guildMember" gM on u."userID" = gM."userID"
            WHERE "guildID" = :guild
            GROUP BY u.username, u.discriminator, horo.horoscope
            ORDER BY u.username ASC;`, {
                replacements: { guild: message.guild.id },
                type: QueryTypes.SELECT
            });

            let currentPage: number = 0;
            const embeds = await generateHoroListEmbed(serverRank)
            const queueEmbed = await message.channel.send(`Current Page: ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
            await queueEmbed.react('⬅️');
            await queueEmbed.react('➡️');
            await queueEmbed.react('❌');
            const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
            const collector = queueEmbed.createReactionCollector(filter);

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '➡️') {
                    if (currentPage < embeds.length-1) {
                      currentPage++;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page: ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
                    } 
                } else if (reaction.emoji.name === '⬅️') {
                    if (currentPage !== 0) {
                      --currentPage;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
                    }
                } else {
                    collector.stop();
                    await queueEmbed.delete();
                }
            })

            async function generateHoroListEmbed (data) {
                const embeds = [];
                let k = 10;
                for(let i =0; i < data.length; i += 10) {
                    const current = data.slice(i, k);
                    let j = i;
                    k += 10;
                    // det foroven skærer, så det kun bliver 10 pr. page.
                    const info = current.map(horoscope => `${++j}. **${horoscope.username}#${horoscope.discriminator}:** ${horoscope.horoscope}`).join(`\n`)
                    const embed = new MessageEmbed()
                    .setDescription(`${info}`)
                    .setColor(message.guild.iconURL() ? `${await urlToColours(message.guild.iconURL({ format: 'png'}))}` : `${await urlToColours(client.user.displayAvatarURL({ format: 'png'}))}`)
                    .setTitle(`All horoscopes for ${message.guild.name}`)
                    .setThumbnail(message.guild.iconURL() ? message.guild.iconURL() : '')
                    .setAuthor(message.guild.iconURL() ? message.guild.name : client.user.username, message.guild.iconURL() ? message.guild.iconURL() : client.user.displayAvatarURL())
                    .setTimestamp()
                    // denne funktion skal skubbe siderne
                    embeds.push(embed)
                }
                return embeds;
            }
        }

        async function horoSearch (message: Message, query?: string) {
            const queryData = await database.query(`
            SELECT u.username, u.discriminator, horo.horoscope
            FROM horoscope AS horo
            INNER JOIN "user" u on u."userID" = horo."userID"
            INNER JOIN "guildMember" gM on u."userID" = gM."userID"
            WHERE gM."guildID" = :guild AND horo.horoscope::text ILIKE :query
            GROUP BY u.username, u.discriminator, horo.horoscope
            ORDER BY u.username ASC;`, {
                replacements: { guild: message.guild.id, query: '%' + query + '%' },
                type: QueryTypes.SELECT
            });

            if (!queryData.length) {
                return message.channel.send(`No horoscopes found containing \`${query}\`.\nSearch for something else please.`);
            }

            let currentPage: number = 0;
            const embeds = await generateTagSearchEmbed(queryData)
            const queueEmbed = await message.channel.send(`Current Page: ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
            await queueEmbed.react('⬅️');
            await queueEmbed.react('➡️');
            await queueEmbed.react('❌');
            const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
            const collector = queueEmbed.createReactionCollector(filter);

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '➡️') {
                    if (currentPage < embeds.length-1) {
                      currentPage++;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page: ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
                    } 
                } else if (reaction.emoji.name === '⬅️') {
                    if (currentPage !== 0) {
                      --currentPage;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
                    }
                } else {
                    collector.stop();
                    await queueEmbed.delete();
                }
            })

            async function generateTagSearchEmbed (data) {
                const embeds = [];
                let k = 10;
                for(let i =0; i < data.length; i += 10) {
                    const current = data.slice(i, k);
                    let j = i;
                    k += 10;
                    // det foroven skærer, så det kun bliver 10 pr. page.
                    const info = current.map(horoscope => `${++j}. **${horoscope.username}#${horoscope.discriminator}:** ${horoscope.horoscope}`).join(`\n`)
                    const embed = new MessageEmbed()
                    .setDescription(`${info}`)
                    .setColor(message.guild.iconURL() ? `${await urlToColours(message.guild.iconURL({ format: 'png'}))}` : `${await urlToColours(client.user.displayAvatarURL({ format: 'png'}))}`)
                    .setTitle(`All horoscopes that includes \`${query}\``)
                    .setThumbnail(message.guild.iconURL() ? message.guild.iconURL() : '')
                    .setAuthor(message.guild.iconURL() ? message.guild.name : client.user.username, message.guild.iconURL() ? message.guild.iconURL() : client.user.displayAvatarURL())
                    .setTimestamp()
                    // denne funktion skal skubbe siderne
                    embeds.push(embed)
                }
                return embeds;
            }
        }
    }
}