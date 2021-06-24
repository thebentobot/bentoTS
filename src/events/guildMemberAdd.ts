import { Event } from "../interfaces";
import database from '../database/database';
import { initModels, guildMember, guildMemberCreationAttributes, user, userCreationAttributes, welcome, messageLog } from '../database/models/init-models';
import { GuildMember, TextChannel } from "discord.js"

export const event: Event = {
    name: 'guildMemberAdd',
    run: async (client, member: GuildMember) => {
        initModels(database);

        const userAttr: userCreationAttributes = {
            userID: parseInt(member.id),
            discriminator: member.user.discriminator,
            xp: 0,
            level: 1,
            username: member.user.username
        }

        await user.findOrCreate({where: { userID: member.id}, defaults: userAttr});

        const guildMemberAttr: guildMemberCreationAttributes = {
            userID: parseInt(member.id),
            guildID: parseInt(member.guild.id),
            xp: 0,
            level: 1
        }

        await guildMember.create(guildMemberAttr);

        try {
            const welcomeData = await welcome.findOne({where: { guildID: member.guild.id }});

            const channel = member.guild.channels.cache.get(`${welcomeData.channel}`) as TextChannel;
            const msg = welcomeData.message
            const msgClean = msg
            .replace('{user}', `${member.user}`)
            .replace('{username}', member.user.username)
            .replace('{discriminator}', member.user.discriminator)
            .replace('{usertag}', member.user.username + '#' + member.user.discriminator)
            .replace('{server}', member.guild.name)
            .replace('{memberCount}', `${member.guild.memberCount}`)
            .replace('{space}', '\n')
            .replace(`\\`, '').replace(`\\`, '').replace(`\\`, '').replace(`\\`, '').replace(`\\`, '').replace(`\\`, '')

            channel.send(msgClean)
        } catch {
            return
        }
    }
}