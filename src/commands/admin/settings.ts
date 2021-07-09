import { Command } from '../../interfaces';
import { Message, MessageEmbed } from 'discord.js';
import database from '../../database/database';
import { initModels, guild, messageLog, modLog, bye, welcome, autoRole, muteRole } from '../../database/models/init-models';
import { trim } from '../../utils/trim';
import { urlToColours } from '../../utils/urlToColours';

export const command: Command = {
    name: 'settings',
    aliases: [],
    category: 'admin',
    description: 'Sends an overview of the server settings',
    usage: 'settings',
    run: async (client, message, args): Promise<Message> => {
        if (!message.member.hasPermission('MANAGE_GUILD')) {
            return message.channel.send('You do not have permission to use this command!').then(m => m.delete({timeout: 10000}));
        };

        initModels(database);

        const guildData = await guild.findOne({raw:true, where: {guildID: message.guild.id}});
        const messageLogData = await messageLog.findOne({raw:true, where: {guildID: message.guild.id}});
        const modLogData = await modLog.findOne({raw:true, where: {guildID: message.guild.id}});
        const byeData = await bye.findOne({raw:true, where: {guildID: message.guild.id}});
        const welcomeData = await welcome.findOne({raw:true, where: {guildID: message.guild.id}});
        const autoRoleData = await autoRole.findAll({raw:true, where: {guildID: message.guild.id}});
        const muteRoleData = await muteRole.findOne({raw:true, where: {guildID: message.guild.id}});

        const modLogText = modLogData ? `<#${modLogData.channel}>`: 'Not configured';
        const msgLogText = messageLogData ? `<#${messageLogData.channel}>`: 'Not configured';
        const byeDataText = byeData ? `Enabled in <#${byeData.channel}>`: 'Disabled';
        const welcomeDataText = welcomeData ? `Enabled in <#${welcomeData.channel}>`: 'Disabled';
        const muteRoleDataText = muteRoleData ? `<@&${muteRoleData.roleID}>`: 'Not configured';

        const Embed = new MessageEmbed()
        .setAuthor('Bento 🍱', 'https://repository-images.githubusercontent.com/322448646/e3422d00-90d9-11eb-9d3d-2939e261681a', 'https://github.com/banner4422/bento')
        .setThumbnail(message.guild.iconURL({ dynamic: true, format: 'png'}))
        .setTitle(`Server settings for ${message.guild.name}`)
        .setTimestamp()
        .setColor(`${message.guild.iconURL() ? await urlToColours(message.guild.iconURL({ format: 'png'})) : await urlToColours(client.user.avatarURL({ format: 'png'}))}`)
        .addFields(
            {name: 'NSFW', value: `${guildData.nsfw ? 'Enabled' : 'Disabled'}`, inline: true},
            {name: 'Tiktok', value: `${guildData.tiktok ? 'Enabled' : 'Disabled'}`, inline: true},
            {name: 'Media', value: `${guildData.media ? 'Enabled' : 'Disabled'}`, inline: true},
            {name: 'leaderboard', value: `${guildData.leaderboard ? 'Enabled' : 'Disabled'}`, inline: true},
            {name: 'Welcome Messages', value: `${byeDataText}`, inline: true},
            {name: 'Bye Messages', value: `${welcomeDataText}`, inline: true},
            {name: 'Mod log channel', value: `${modLogText}`, inline: true},
            {name: 'Message log channel', value: `${msgLogText}`, inline: true},
            {name: 'Mute role', value: `${muteRoleDataText}`, inline: true},
            {name: autoRoleData.length > 1 ? 'Auto assigned roles' : 'Auto assigned role', value: autoRoleData ? trim(autoRoleData.map(r => `<@&${r.roleID}>`).join(' | '), 1024) : 'Not configured', inline: true},
        )

        return message.channel.send(Embed);
    }
}