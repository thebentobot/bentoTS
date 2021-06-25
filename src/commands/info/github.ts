import { Command } from '../../interfaces';

export const command: Command = {
    name: 'github',
    aliases: [],
    category: 'info',
    description: 'Link to the Bento GitHub organisation',
    usage: 'github',
    run: async (client, message, args): Promise<any> => {
        return message.channel.send('https://github.com/thebentobot')
    }
}