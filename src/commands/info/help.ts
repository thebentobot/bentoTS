import { Message, MessageEmbed } from 'discord.js';
import ExtendedClient from '../../client/index.js';
import { Command } from '../../interfaces';
import database from '../../database/database.js';
import { initModels, guild } from '../../database/models/init-models.js';
import { stringify } from 'querystring';
import { urlToColours } from '../../utils/urlToColours.js';

export const command: Command = {
    name: 'help',
    aliases: [],
    category: 'info',
    description: 'Displays bot help message or info for a command',
    usage: 'help [command name]',
    run: async (client, message, args): Promise<any> => {
        if (args[0]) {
            return getCMD(client, message, args[0]);
        } else {
            return helpMSG(client, message);
        }

        async function helpMSG(client: ExtendedClient, message: Message) {
            initModels(database);

            const guildDB = await guild.findOne({raw: true, where: {guildID: message.guild.id}})
        
            const embed = new MessageEmbed()
                .setColor(`${await urlToColours(client.user.avatarURL({ format: 'png'}))}`)
                .setTitle('Help')
                .setThumbnail(client.user.avatarURL())
                .setDescription(`For a full list of commands, please type \`${guildDB.prefix}commands\` \nTo see more info about a specific command, please type \`${guildDB.prefix}help <command>\` without the \`<>\``)
                .addField('About Bento Bot 🍱', 'A Discord bot for chat moderation and fun features you did not know you needed on Discord.')
                .addField('Github', 'https://github.com/thebentobot')
                .setFooter('Created by Banner#1017');
            message.channel.send(embed);
        }

        async function getCMD(client: ExtendedClient, message: Message, input: any) {
            const guildDB = await guild.findOne({raw: true, where: {guildID: message.guild.id}})
        
            const embed = new MessageEmbed()

            const aliases:any = client.aliases.get(input.toLowerCase())
        
            const cmd = client.commands.get(input.toLowerCase()) || client.commands.get(aliases);
        
            let info = `No information found for command **${input.toLowerCase()}**`;
        
            if (!cmd) {
                return message.channel.send(embed.setColor(`${await urlToColours(client.user.avatarURL({ format: 'png'}))}`).setDescription(info));
            }
        
            cmd.aliases = Array.prototype.slice.call(cmd.aliases)
            if (cmd.name) info = `**Command Name**: ${cmd.name}`
            if (cmd.aliases) info += `\n**Aliases**: ${cmd.aliases.map(a => `\`${stringify({a}).slice(2)}\``).join(', ')}`;
            if (cmd.description) info += `\n**Description**: ${cmd.description}`;
            if (cmd.usage) {
                info += `\n**Usage**: ${guildDB.prefix}${cmd.usage}`;
                embed.setFooter('<> = REQUIRED | [] = OPTIONAL')
            }
            //if (cmd.usage2) info += `\n**Usage 2**: ${guildDB.prefix}${cmd.usage2}`;
        
            return message.channel.send(embed.setColor(`${await urlToColours(client.user.avatarURL({ format: 'png'}))}`).setDescription(info));
        }
    }
}