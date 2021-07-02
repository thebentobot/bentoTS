import { Command } from '../../interfaces';
import database from '../../database/database';
import { Message, MessageEmbed } from 'discord.js';
import { QueryTypes } from 'sequelize';
import { urlToColours } from '../../utils';

export const command: Command = {
    name: 'leaderboard',
    aliases: ['ranking', 'rankings', 'lb'],
    category: 'user',
    description: 'Shows the XP/level leaderboard for a server, globally for the bot, or global/local Bentos 🍱',
    usage: 'leaderboard [<global/bento>] [global]',
    run: async (client, message, args): Promise<any> => {
        if (!args.length) {
            return serverLeaderboard (message)
        }
        
        if (args[0] === 'global') {
            return globalLeaderboard (message)
        }
        
        if (args[0] === 'bento') {
            return bentoServerLeaderboard (message)
        }
        
        if (args[0] === 'bento' && args[1] === 'global') {
            return bentoGlobalLeaderboard (message)
        }
        

        async function serverLeaderboard (message: Message) {
            interface Rankings {
                rank: string,
                level?: number,
                xp?: number,
                bento?: number,
                userID: string
            }
            const serverRank: Array<Rankings> = await database.query(`
            SELECT row_number() over () as rank, t.level, t.xp, u.username, u.discriminator
            FROM "guildMember" AS t
            INNER JOIN "user" u on u."userID" = t."userID"
            WHERE t."guildID" = :guild
            GROUP BY t.level, t.xp, u.username, u.discriminator
            ORDER BY t.level DESC, t.xp DESC`, {
                replacements: { guild: message.guild.id },
                type: QueryTypes.SELECT
            });
            let currentPage = 0;
            const embeds = generateServerLBembed(serverRank, message)
            const queueEmbed = await message.channel.send(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
            await queueEmbed.react('⬅️');
            await queueEmbed.react('➡️');
            await queueEmbed.react('❌');
            const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
            const collector = queueEmbed.createReactionCollector(filter);

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '➡️') {
                    if (currentPage < (await embeds).length-1) {
                      currentPage++;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    } 
                  } else if (reaction.emoji.name === '⬅️') {
                    if (currentPage !== 0) {
                      --currentPage;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    }
                  } else {
                    collector.stop();
                    await queueEmbed.delete();
                  }
            })
        }

        async function globalLeaderboard (message: Message) {
            interface Rankings {
                rank: string,
                level?: number,
                xp?: number,
                bento?: number,
                userID: string
            }
            const globalRank: Array<Rankings> = await database.query(`
            SELECT row_number() over (ORDER BY t.level DESC, t.xp DESC) AS rank, t.level, t.xp, t.username, t.discriminator
            FROM "user" AS t
            GROUP BY t.level, t.xp, t.username, t.discriminator
            ORDER BY t.level DESC, t.xp DESC`, {type: QueryTypes.SELECT});
            let currentPage = 0;
            const embeds = generateGlobalLBembed(globalRank, message)
            const queueEmbed = await message.channel.send(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
            await queueEmbed.react('⬅️');
            await queueEmbed.react('➡️');
            await queueEmbed.react('❌');
            const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
            const collector = queueEmbed.createReactionCollector(filter);

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '➡️') {
                    if (currentPage < (await embeds).length-1) {
                      currentPage++;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    } 
                  } else if (reaction.emoji.name === '⬅️') {
                    if (currentPage !== 0) {
                      --currentPage;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    }
                  } else {
                    collector.stop();
                    await queueEmbed.delete();
                  }
            })
        }

        async function bentoGlobalLeaderboard (message: Message) {
            interface Rankings {
                rank: string,
                level?: number,
                xp?: number,
                bento?: number,
                userID: string
            }
            const bentoRank: Array<Rankings> = await database.query(`
            SELECT row_number() over (ORDER BY t.bento DESC) AS rank, t.bento, u.username, u.discriminator
            FROM bento AS t
            INNER JOIN "user" u on u."userID" = t."userID"
            GROUP BY t.bento, u.username, u.discriminator
            ORDER BY t.bento DESC;`, {type: QueryTypes.SELECT});
            let currentPage = 0;
            const embeds = generateGlobalBentoEmbed(bentoRank, message)
            const queueEmbed = await message.channel.send(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
            await queueEmbed.react('⬅️');
            await queueEmbed.react('➡️');
            await queueEmbed.react('❌');
            const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
            const collector = queueEmbed.createReactionCollector(filter);

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '➡️') {
                    if (currentPage < (await embeds).length-1) {
                      currentPage++;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    } 
                  } else if (reaction.emoji.name === '⬅️') {
                    if (currentPage !== 0) {
                      --currentPage;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    }
                  } else {
                    collector.stop();
                    await queueEmbed.delete();
                  }
            })
        }

        async function bentoServerLeaderboard (message: Message) {
            interface Rankings {
                rank: string,
                level?: number,
                xp?: number,
                bento?: number,
                userID: string
            }
            const serverRank: Array<Rankings> = await database.query(`
            SELECT row_number() over (ORDER BY t.bento DESC) AS rank, t.bento, u.username, u.discriminator
            FROM bento AS t
            INNER JOIN "user" u on u."userID" = t."userID"
            INNER JOIN "guildMember" gM on u."userID" = gM."userID"
            WHERE gM."guildID" = :guild
            GROUP BY t.bento, u.username, u.discriminator
            ORDER BY t.bento DESC;`, {
                replacements: { guild: message.guild.id },
                type: QueryTypes.SELECT
            });
            let currentPage = 0;
            const embeds = generateServerBentoEmbed(serverRank, message)
            const queueEmbed = await message.channel.send(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
            await queueEmbed.react('⬅️');
            await queueEmbed.react('➡️');
            await queueEmbed.react('❌');
            const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
            const collector = queueEmbed.createReactionCollector(filter);

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '➡️') {
                    if (currentPage < (await embeds).length-1) {
                      currentPage++;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    } 
                  } else if (reaction.emoji.name === '⬅️') {
                    if (currentPage !== 0) {
                      --currentPage;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    }
                  } else {
                    collector.stop();
                    await queueEmbed.delete();
                  }
            })
        }
        
        async function generateGlobalLBembed (input: any[], message: Message) {
            const embeds = [];
            let k = 10;
            for(let i =0; i < input.length; i += 10) {
                const current = input.slice(i, k);
                //let j = i;
                k += 10;
                // det foroven skærer, så det kun bliver 10 pr. page.
                const embed = new MessageEmbed()
                embed.setColor(`${await urlToColours(client.user.displayAvatarURL({ format: 'png'}))}`)
                embed.setTimestamp()
                current.map(async user => embed.addField(`${user.rank}. ${user.username + '#' + user.discriminator}`, `Level ${user.level}, ${user.xp} XP`))
                embed.setTitle(`Leaderboard for ${client.user.username}`)
                embed.setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png'}));
                embeds.push(embed)
            }
            return embeds;
        }

        async function generateServerLBembed (input: any[], message: Message) {
            const embeds = [];
            let k = 10;
            for(let i =0; i < input.length; i += 10) {
                const current = input.slice(i, k);
                //let j = i;
                k += 10;
                // det foroven skærer, så det kun bliver 10 pr. page.
                const embed = new MessageEmbed()
                embed.setColor(`${await urlToColours(message.guild.iconURL({ format: 'png'}))}`)
                embed.setTimestamp()
                current.map(async user => embed.addField(`${user.rank}. ${user.username + '#' + user.discriminator}`, `Level ${user.level}, ${user.xp} XP`))
                embed.setTitle(`Leaderboard for ${message.guild.name}`)
                embed.setThumbnail(message.guild.iconURL({ dynamic: true, format: 'png'}));
                embeds.push(embed)
            }
            return embeds;
        }

        async function generateServerBentoEmbed (input: any[], message: Message) {
            const embeds = [];
            let k = 10;
            for(let i =0; i < input.length; i += 10) {
                const current = input.slice(i, k);
                //let j = i;
                k += 10;
                // det foroven skærer, så det kun bliver 10 pr. page.
                const embed = new MessageEmbed()
                embed.setColor(`${await urlToColours(message.guild.iconURL({ format: 'png'}))}`)
                embed.setTimestamp()
                current.map(async user => embed.addField(`${user.rank}. ${user.username + '#' + user.discriminator}`, `${user.bento} Bento 🍱`))
                embed.setTitle(`Leaderboard for ${message.guild.name}`)
                embed.setThumbnail(message.guild.iconURL({ dynamic: true, format: 'png'}));
                embeds.push(embed)
            }
            return embeds;
        }

        async function generateGlobalBentoEmbed (input: any[], message: Message) {
            const embeds = [];
            let k = 10;
            for(let i =0; i < input.length; i += 10) {
                const current = input.slice(i, k);
                //let j = i;
                k += 10;
                // det foroven skærer, så det kun bliver 10 pr. page.
                const embed = new MessageEmbed()
                embed.setColor(`${await urlToColours(client.user.displayAvatarURL({ format: 'png'}))}`)
                embed.setTimestamp()
                current.map(async user => embed.addField(`${user.rank}. ${user.username + '#' + user.discriminator}`, `${user.bento} Bento 🍱`))
                embed.setTitle(`Bento 🍱 Leaderboard for ${client.user.username}`)
                embed.setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: 'png'}));
                embeds.push(embed)
            }
            return embeds;
        }
    }
}