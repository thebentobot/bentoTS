import { GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js';
import database from '../../database/database';
import { ban, banCreationAttributes } from '../../database/models/ban';
import { initModels } from '../../database/models/init-models';
import { modLog } from '../../database/models/modLog';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'ban',
    aliases: [],
    category: 'moderation',
    description: 'Bans the mentioned user from your server.',
    usage: 'ban <user id or mention user> [reason]',
    website: 'https://www.bentobot.xyz/commands#ban',
    run: async (client, message, args): Promise<Message> => {
        if (!message.member.hasPermission('BAN_MEMBERS')) {
            return message.channel.send('You do not have permission to use this command.\nYou are not a mod.').then(m => m.delete({timeout: 5000}));
        }

        if (!args[0]) {
            return message.channel.send(`You need to specify a user to ban.\nUse the help command with ban to check options when using the ban command.`)
        }

        let bannedUser: GuildMember;
        let bannedUserID: string;

        try {
            bannedUser = message.mentions.members.has(client.user.id) ? (message.mentions.members.size > 1 ? message.mentions.members.last() : message.member) : message.mentions.members.first() || await message.guild.members.fetch(args[0]);
            bannedUserID = bannedUser.id
        } catch {
            return message.channel.send('I cannot find the specified member. Please mention a valid member in this Discord server.')
        }

        if (!bannedUser.bannable) {
            return message.channel.send('This member is not bannable.')
        }

        if (message.member.roles.highest.position <= bannedUser.roles.highest.position) {
            return message.channel.send('You cannot ban someone with a higher role than you.')
        }

        let reason: string;
        
        if (args.length > 1) {
            reason = args.slice(1).join(' ');
        }

        const banAttr: banCreationAttributes = {
            userID: BigInt(bannedUserID),
            guildID: BigInt(message.guild.id),
            date: new Date(),
            actor: BigInt(message.author.id),
            reason: reason
        }

        initModels(database);

        const banned = await ban.findOrCreate({raw: true, where: {userID: bannedUserID, guildID: message.guild.id}, defaults: banAttr}).catch(console.error)

        if (banned[1] === false) {
            return message.channel.send(`${message.guild.members.cache.get(`${bannedUserID}`).nickname ? `${message.guild.members.cache.get(`${bannedUserID}`).nickname} (${message.guild.members.cache.get(`${bannedUserID}`).user.username + '#' + message.guild.members.cache.get(`${bannedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${bannedUserID}`).user.username + '#' + message.guild.members.cache.get(`${bannedUserID}`).user.discriminator}`} is already banned on this server.\nThe case number for this ban is: \`${banned[0].banCase}\` if you want to look up details for this ban use the case check command.`);
        } else {
            try {
                let logChannel: TextChannel;
                const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                const embed = new MessageEmbed()
                .setColor('#ff0000')
                .setAuthor(message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`, message.author.avatarURL())
                .setThumbnail(bannedUser.user.avatarURL())
                .setTitle(`${bannedUser.nickname ? `${bannedUser.nickname} (${bannedUser.user.username}#${bannedUser.user.discriminator})` : `${bannedUser.user.username}#${bannedUser.user.discriminator}`} was banned!`)
                .setDescription(`**Reason**\n${reason ? reason : 'Reason not listed'}`)
                .addField('Username', bannedUser.user.username + '#' + bannedUser.user.discriminator)
                .addField('User ID', bannedUser.id)
                .addField('Banned by', message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`)
                .setFooter(`Ban Case Number: ${banned[0].banCase}`)
                .setTimestamp();
                await logChannel.send(embed);
                try {
                    (await client.users.fetch(bannedUserID)).send(`🔨You were \`banned\` from **${message.guild.name}** 🔨 \n**Reason**: ${reason}.`).catch(error => { console.error(`Could not send ban DM`, error)})
                    await bannedUser.ban({reason: reason, days: 7});
                    return await message.channel.send(`**${message.guild.members.cache.get(`${bannedUserID}`).nickname ? `${message.guild.members.cache.get(`${bannedUserID}`).nickname} (${message.guild.members.cache.get(`${bannedUserID}`).user.username + '#' + message.guild.members.cache.get(`${bannedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${bannedUserID}`).user.username + '#' + message.guild.members.cache.get(`${bannedUserID}`).user.discriminator}`}** was successfully **banned** on this server.\n**Case number: ${banned[0].banCase}**.\n**Reason:** ${banned[0].reason}\nYou can add notes for this ban by using the case command, together with the case number.`)
                } catch {
                    await bannedUser.ban({reason: reason, days: 7});
                    return await message.channel.send(`**${message.guild.members.cache.get(`${bannedUserID}`).nickname ? `${message.guild.members.cache.get(`${bannedUserID}`).nickname} (${message.guild.members.cache.get(`${bannedUserID}`).user.username + '#' + message.guild.members.cache.get(`${bannedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${bannedUserID}`).user.username + '#' + message.guild.members.cache.get(`${bannedUserID}`).user.discriminator}`}** was successfully **banned** on this server.\n**Case number: ${banned[0].banCase}**.\n**Reason:** ${banned[0].reason}\nYou can add notes for this ban by using the case command, together with the case number.`)
                }
            } catch {
                try {
                    (await client.users.fetch(bannedUserID)).send(`🔨You were \`banned\` from **${message.guild.name}** 🔨 \n**Reason**: ${reason}.`).catch(error => { console.error(`Could not send ban DM`, error)})
                    await bannedUser.ban({reason: reason, days: 7});
                    return await message.channel.send(`**${message.guild.members.cache.get(`${bannedUserID}`).nickname ? `${message.guild.members.cache.get(`${bannedUserID}`).nickname} (${message.guild.members.cache.get(`${bannedUserID}`).user.username + '#' + message.guild.members.cache.get(`${bannedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${bannedUserID}`).user.username + '#' + message.guild.members.cache.get(`${bannedUserID}`).user.discriminator}`}** was successfully **banned** on this server.\n**Case number: ${banned[0].banCase}**.\n**Reason:** ${banned[0].reason}\nYou can add notes for this ban by using the case command, together with the case number.`)
                } catch {
                    await bannedUser.ban({reason: reason, days: 7});
                    return await message.channel.send(`**${message.guild.members.cache.get(`${bannedUserID}`).nickname ? `${message.guild.members.cache.get(`${bannedUserID}`).nickname} (${message.guild.members.cache.get(`${bannedUserID}`).user.username + '#' + message.guild.members.cache.get(`${bannedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${bannedUserID}`).user.username + '#' + message.guild.members.cache.get(`${bannedUserID}`).user.discriminator}`}** was successfully **banned** on this server.\n**Case number: ${banned[0].banCase}**.\n**Reason:** ${banned[0].reason}\nYou can add notes for this ban by using the case command, together with the case number.`)
                }
            }
        }
    }
}