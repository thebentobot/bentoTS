import { Message } from 'discord.js';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'kick',
    aliases: [],
    category: 'moderation',
    description: 'Link to the Bento GitHub organisation',
    usage: 'kick',
    run: async (client, message, args): Promise<Message> => {
        return message.channel.send('https://github.com/thebentobot')
    }
}