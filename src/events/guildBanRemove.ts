import { Event } from "../interfaces";
import database from '../database/database';
import { initModels, ban, modLog } from '../database/models/init-models';
import { Guild, MessageEmbed, TextChannel, User } from "discord.js";
import moment from "moment";

export const event: Event = {
    name: 'guildBanRemove',
    run: async (client, guild: Guild, user: User): Promise<any> => {
        initModels(database);

        const banCase = await ban.findOne({raw: true, where: {guildID: guild.id, userID: user.id}})

        try {
            let logChannel: TextChannel;
            const channel = await modLog.findOne({raw: true, where: { guildID: guild.id}})
            logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
            const embed = new MessageEmbed()
            .setColor('#f5ec42')
            .setThumbnail(guild.members.cache.get(user.id).user.displayAvatarURL())
            .setTitle(`${guild.members.cache.get(user.id).user.username}#${guild.members.cache.get(user.id).user.discriminator} was unbanned!`)
            .setDescription(`**The reason the user was banned:**\n${banCase.reason ? banCase.reason : 'No reason specified'}\n**Ban notes on the user:**\n${banCase.note ? banCase.note : 'No notes written'}`)
            .addField('User ID', user.id)
            .addField('Ban date', moment(banCase.date).format('dddd, MMMM Do YYYY, HH:mm:ss A z'))
            .addField('Banned by', guild.members.cache.get(`${banCase.actor}`).nickname ? `${guild.members.cache.get(`${banCase.actor}`).nickname} (${guild.members.cache.get(`${banCase.actor}`).user.username}#${guild.members.cache.get(`${banCase.actor}`).user.discriminator})` : `${guild.members.cache.get(`${banCase.actor}`).user.username}#${guild.members.cache.get(`${banCase.actor}`).user.discriminator}`)
            .setTimestamp();
            logChannel.send(embed);
            (await client.users.fetch(user.id)).send(`🙏You were \`unbanned\` from **${guild.name}**`)
            await ban.destroy({where: {guildID: guild.id, userID: user.id}})
        } catch {
            (await client.users.fetch(user.id)).send(`🙏You were \`unbanned\` from **${guild.name}**`)
            await ban.destroy({where: {guildID: guild.id, userID: user.id}})
        }
    }
}