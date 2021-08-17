import { Message, MessageEmbed } from 'discord.js';
import ExtendedClient from '../../client/index';
import { Command } from '../../interfaces';
import database from '../../database/database';
import { initModels, guild } from '../../database/models/init-models';
import { stringify } from 'querystring';
import { urlToColours } from '../../utils/urlToColours';

export const command: Command = {
    name: 'help',
    aliases: [],
    category: 'info',
    description: 'Displays bot help message or info for a command',
    usage: 'help [command name]',
    website: 'https://www.bentobot.xyz/commands#help',
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
                .addField('The Bento Bot Website', 'https://www.bentobot.xyz/')
                .addField('Want to check out the code for Bento 🍱?', 'https://github.com/thebentobot/bentoTS')
                .addField('Need help? Or do you have some ideas or feedback to Bento 🍱? Feel free to join the support server', 'https://discord.gg/dd68WwP')
                .setFooter('Bento 🍱 is created by Banner#1017', (await client.users.fetch('232584569289703424')).avatarURL({dynamic: true}))
            await message.channel.send(embed);
        }

        async function getCMD(client: ExtendedClient, message: Message, input: any) {
            const guildDB = await guild.findOne({raw: true, where: {guildID: message.guild.id}})
        
            const embed = new MessageEmbed()
        
            const cmd = client.commands.get(input.toLowerCase()) || client.commands.get(`${client.aliases.get(input.toLowerCase()).name}`);
        
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
            if (cmd.website) info += `\n**Website**: ${cmd.website}`;
        
            return message.channel.send(embed.setColor(`${await urlToColours(client.user.avatarURL({ format: 'png'}))}`).setDescription(info));
        }
    }
}