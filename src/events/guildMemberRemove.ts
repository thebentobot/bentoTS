import { Event } from "../interfaces";
import database from '../database/database.js';
import { initModels, guildMember, user, bye, bento, horoscope, lastfm, weather } from '../database/models/init-models.js';
import { GuildMember, TextChannel } from "discord.js"

export const event: Event = {
    name: 'guildMemberRemove',
    run: async (client, member: GuildMember): Promise<any> => {
        initModels(database);

        await guildMember.destroy({where: {guildID: member.guild.id, userID: member.id}});

        try {
            const byeData = await bye.findOne({where: { guildID: member.guild.id }});

            const channel = member.guild.channels.cache.get(`${byeData.channel}`) as TextChannel;
            const msg = byeData.message
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

        try {
            await user.findOne({where: {userID: member.id}});
        } catch {
            await user.destroy({where: {userID: member.id}});
            await bento.destroy({where: {userID: member.id}});
            await horoscope.destroy({where: {userID: member.id}});
            await lastfm.destroy({where: {userID: member.id}});
            await weather.destroy({where: {userID: member.id}});
        }
    }
}