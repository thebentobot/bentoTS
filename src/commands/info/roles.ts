import { Command } from '../../interfaces';

export const command: Command = {
    name: 'roles',
    aliases: ['role'],
    category: 'info',
    description: 'Shows list of roles on the server.',
    usage: 'roles',
    run: async (client, message, args): Promise<any> => {
        return message.channel.send(message.guild.roles.cache.map(role => `${role}`).join(' | '), {disableMentions: "everyone"})
    }
}