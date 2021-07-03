// @ts-nocheck
import { Command } from '../../interfaces';
import { trim, urlToColours } from '../../utils/index.js';
import database from '../../database/database.js';
import { initModels } from '../../database/models/init-models.js';
import { Message, MessageEmbed, GuildMember } from 'discord.js';
import { QueryTypes } from 'sequelize';

export const command: Command = {
    name: 'rank',
    aliases: ['lvl', 'level', 'xp'],
    category: 'user',
    description: 'Shows your rank level, xp and praises',
    usage: 'rank [userID/mention a user]',
    run: async (client, message, args): Promise<any> => {
        if (!args.length) {
            return rankFunction (message)
        } else {
            return rankFunction (message, args[0])
        }

        async function rankFunction (message: Message, user?: GuildMember | any) {
            initModels(database);

            let userID: string;
            let guildID: string = message.guild.id;

            if (user) {
                try {
                    const mentionedUser = message.mentions.members.first() || await message.guild.members.fetch(user);
                    userID = mentionedUser.id
                } catch {
                    return message.channel.send(`Error couldn't find a valid user based on your input: \`${user}\`.`)
                }
            } else {
                userID = message.author.id
            }

            const theRank = findRankByID(guildID, userID)
            return await message.channel.send(await theRank)
        }

        async function findRankByID (guildID: string, userID?: string, ) {

            interface Rankings {
                rank: string,
                level?: number,
                xp?: number,
                bento?: number,
                userID: string
            }

            const serverRank: Array<Rankings> = await database.query(`
            SELECT row_number() over () as rank, t.level, t.xp, t."userID"
            FROM "guildMember" AS t
            WHERE t."guildID" = :guild
            GROUP BY t.level, t.xp, t."userID"
            ORDER BY t.level DESC, t.xp DESC`, {
                replacements: { guild: guildID },
                type: QueryTypes.SELECT
            });
            
            const globalRank: Array<Rankings> = await database.query(`
            SELECT row_number() over (ORDER BY t.level DESC, t.xp DESC) AS rank, t.level, t.xp, t."userID"
            FROM "user" AS t
            GROUP BY t.level, t.xp, t."userID"
            ORDER BY t.level DESC, t.xp DESC`, {type: QueryTypes.SELECT});

            const bentoRank: Array<Rankings> = await database.query(`
            SELECT row_number() over (ORDER BY t.bento DESC) AS rank, t.bento, t."userID"
            FROM bento AS t
            GROUP BY t."userID"
            ORDER BY t.bento DESC`, {type: QueryTypes.SELECT});

            let serverRankUser: object[] = [];
            let globalRankUser: object[] = [];
            let bentoRankUser: object[] = [];
            let embeds: object[] = [];

            for (let serverUser of serverRank) {
                if (serverUser.userID == userID) {
                    serverRankUser.push(serverUser)
                }
            }

            for (let globalUser of globalRank) {
                if (globalUser.userID == userID) {
                    globalRankUser.push(globalUser)
                }
            }

            for (let bentoUser of bentoRank) {
                if (bentoUser.userID == userID) {
                    bentoRankUser.push(bentoUser)
                }
            }

            const embed = new MessageEmbed()
            .setColor(`${await urlToColours(message.guild.members.cache.get(userID).user.displayAvatarURL({ format: 'png'}))}`)
            .setAuthor(message.guild.members.cache.get(userID).guild.name, message.guild.members.cache.get(userID).guild.iconURL({format: 'png', dynamic: true}) ? message.guild.members.cache.get(userID).guild.iconURL({format: 'png', dynamic: true}) : client.user.displayAvatarURL({ format: 'png', dynamic: true }))
            .setTitle(`Rankings for ${message.guild.members.cache.get(userID).nickname ? `${message.guild.members.cache.get(userID).nickname} (${message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator})` : message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator}`)
            .setThumbnail(message.guild.members.cache.get(userID).user.displayAvatarURL({ format: 'png', dynamic: true }))
            .setTimestamp()
            .addFields(
                { name: 'Total Bento 🍱', value: bentoRankUser[0].bento, inline: true},
                { name: 'Bento Box 🍱 rank', value: `${bentoRankUser[0].rank}/${bentoRank[bentoRank.length - 1].rank} users`, inline: true},
                { name: 'Server rank', value: `${serverRankUser[0].rank}/${message.guild.members.cache.get(userID).guild.memberCount} users`},
                { name: 'Server Level', value: serverRankUser[0].level, inline: true},
                { name: 'Server XP', value: trim(`${serverRankUser[0].xp} XP\n${(serverRankUser[0].level * serverRankUser[0].level * 100) - serverRankUser[0].xp} XP ⬆️`, 1024), inline: true},
                { name: 'Global rank', value: `${globalRankUser[0].rank}/${globalRank[globalRank.length - 1].rank} users`},
                { name: 'Global level', value: globalRankUser[0].level, inline: true},
                { name: 'Global XP', value: trim(`${globalRankUser[0].xp} XP\n${(globalRankUser[0].level * globalRankUser[0].level * 100) - globalRankUser[0].xp} XP ⬆️`, 1024), inline: true},
            )
            embeds.push(embed);
            return embeds
        }
    }
}