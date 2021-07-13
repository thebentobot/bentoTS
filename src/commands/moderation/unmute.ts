import { Message } from 'discord.js';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'unmute',
    aliases: [],
    category: 'moderation',
    description: 'Link to the Bento GitHub organisation',
    usage: 'umutemute',
    run: async (client, message, args): Promise<Message> => {
        return message.channel.send('https://github.com/thebentobot')
    }
}