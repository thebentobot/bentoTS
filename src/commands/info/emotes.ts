import { Command } from '../../interfaces';

export const command: Command = {
    name: 'emotes',
    aliases: ['emote'],
    category: 'info',
    description: 'Shows list of emotes from the server.',
    usage: 'emotes\nemotes animated\nemotes static',
    run: async (client, message, args): Promise<any> => {
        if (!args.length) {
            return message.channel.send(message.guild.emojis.cache.map(emote => emote.animated ? `<a:${emote.name}:${emote.id}>` : `<:${emote.name}:${emote.id}>`).join(' '), {split: {maxLength: 2000, char: '\n'}})
        }

        if (args[0] === 'animated') {
            return message.channel.send(message.guild.emojis.cache.map(emote => emote.animated ? `<a:${emote.name}:${emote.id}>`: null).join(' '), {split: {maxLength: 2000, char: '\n'}})
        }

        if (args[0] === 'static') {
            return message.channel.send(message.guild.emojis.cache.map(emote => emote.animated ? null :`<:${emote.name}:${emote.id}>`).join(' '), {split: {maxLength: 2000, char: '\n'}})
        }
    }
}