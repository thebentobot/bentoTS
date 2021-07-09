import { Message } from 'discord.js';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'warning',
    aliases: ['warn'],
    category: 'moderation',
    description: 'Link to the Bento GitHub organisation',
    usage: 'warning',
    run: async (client, message, args): Promise<Message> => {
        return message.channel.send('https://github.com/thebentobot')
    }
}