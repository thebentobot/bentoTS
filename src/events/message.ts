import { Event, Command } from '../interfaces';
import { Message, MessageEmbed, User } from 'discord.js';
import database from '../database/database';

import { checkURL } from '../utils/checkURL';
import { tiktokEmbedding } from '../utils/tiktok';
import { addXpServer, addXpGlobal } from '../utils/xp'
// [table] Attributes is the interface defining the fields
// [table] CreationAttributes is the interface defining the fields when creating a new record
import { initModels, guild, tag, user, userCreationAttributes, guildMemberCreationAttributes, guildMember } from '../database/models/init-models';
import { QueryTypes } from 'sequelize';
import { urlToColours } from '../utils';
import moment from 'moment';

export const event: Event = {
    name: 'message',
    run: async (client, message: Message): Promise<any> => {
        if (message.author.bot) return;
        
        initModels(database); //imports models into sequelize instance

        const userAttr: userCreationAttributes = {
            userID: BigInt(message.author.id),
            discriminator: message.author.discriminator,
            username: message.author.username,
            xp: 0,
            level: 1
        }

        const guildMemberAttr: guildMemberCreationAttributes = {
            userID: BigInt(message.author.id),
            guildID: BigInt(message.guild.id),
            xp: 0,
            level: 1
        }

        await user.findOrCreate({where: {userID: message.author.id}, defaults: userAttr})
        await guildMember.findOrCreate({where: {userID: message.author.id, guildID: message.guild.id}, defaults: guildMemberAttr})

        interface notificationValues {
            id: number,
            userID: bigint,
            guildID: bigint,
            content: string,
            global: boolean
        }
        
        const notificationData: Array<notificationValues> = await database.query(`
        SELECT *
        FROM "notificationMessage"
        WHERE content ILIKE ANY(ARRAY [:content]);`, {
            type: QueryTypes.SELECT,
            replacements: { content: message.content.split(' ') }
        })

        if (notificationData) {
            for (const noti of notificationData) {
                if (noti.global === false && `${noti.guildID}` !== message.guild.id) return
                let user: User;
                try {
                    user = client.users.cache.get(`${noti.userID}`)
                    const lastMessages = (await message.channel.messages.fetch({limit: 3})).array().reverse()
                    const embed = new MessageEmbed()
                    .setTimestamp()
                    .setThumbnail(message.author.avatarURL({format: 'png', size: 1024, dynamic: true}))
                    .setColor(`${await urlToColours(client.user.avatarURL({ format: "png" }))}`)
                    .setDescription(`🗨 ${message.member.nickname ? `${message.member.nickname} (${message.author.username}#${message.author.discriminator})` : `${message.author.username}#${message.author.discriminator}`} mentioned \`${noti.content}\` in ${message.channel} on **${message.guild.name}**.\nLink to the message [here](${message.url})\n${lastMessages.map(msg => `**[${moment(msg.createdAt).format('HH:mm:ss Z')}] ${msg.member.nickname ? `${msg.member.nickname} (${msg.author.username}#${msg.author.discriminator})` : `${msg.author.username}#${msg.author.discriminator}`}**\n> ${msg.content === '' ? '[MessageEmbed]' : msg.content.replace(noti.content, `**${noti.content}**`)}\n`).join('')}`)
                    await user.send(embed).catch(error => { console.error(`Could not send notification DM`, error)})
                } catch {
                    return
                }
            }
        }

        // finds prefix by guildID
        const messageGuild = await guild.findOne({raw: true, where: {guildID: message.guild.id}}); //raw: true returns only the dataValues

        if (message.content.includes('tiktok.com')) {
            if (messageGuild.tiktok == false) {
                return
            }
            const url = checkURL(message.content);
            const tiktok = await tiktokEmbedding(url);
            try {
                await message.channel.send(tiktok[0])
                await message.channel.send(tiktok[1])
            } catch {
                return
            }
        }

        if (messageGuild.leaderboard === true) {
            await addXpServer(message.guild.id, message.author.id, 23).catch();
            await addXpGlobal(message.author.id, 23).catch();
        }

        const prefix = messageGuild.prefix

        if (!message.content.startsWith(prefix)) return

        const args = message.content
        .slice(prefix.length)
        .trim()
        .split(/ +/g);

        if (!message.guild) return;

        const cmd = args.shift().toLowerCase();

        if (!cmd) return;
        const command = client.commands.get(cmd) || client.aliases.get(cmd);

        // custom tags
        if (command) {
            (command as Command).run(client, message, args);
        } else {
            const customCommand = await tag.findOne({raw: true, where: {guildID: message.guild.id, command: cmd}})
            if (customCommand) {
                await tag.increment('count', {where: {command: cmd}})
            }
            try {
                return message.channel.send(customCommand.content)
            } catch {
                return
            }
        }
    }
}