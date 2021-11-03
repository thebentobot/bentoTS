import axios from 'axios';
import { Message } from 'discord.js';
import { guild } from '../../database/models/guild';
import { rpsGame, rpsGameCreationAttributes } from '../../database/models/rpsGame';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'rps',
    aliases: [],
    category: 'features',
    description: 'Play Rock, Paper, Scissors with Bento 🍱',
    usage: 'rps <rock, paper, scissors>',
    website: 'https://www.bentobot.xyz/commands#rps',
    run: async (client, message, args): Promise<Message> => {
        const acceptedReplies = ['rock', 'paper', 'scissors'];
        const bentoReplies = ['Rock 🪨', 'Paper 🧻', 'Scissors ✂️'];
        const random = Math.floor((Math.random() * acceptedReplies.length));
        const bentoResult = bentoReplies[random]
        const result = acceptedReplies[random];

        const guildData = await guild.findOne({raw: true, where: {guildID: message.guild.id}})

        const choice = args[0];
        if (!choice) return message.channel.send(`How to play: \`${guildData.prefix}rps <rock|paper|scissors>\``);
        if (!acceptedReplies.includes(choice)) return message.channel.send(`Only these responses are accepted: \`${acceptedReplies.join(', ')}\``);
        
        const username = message.member?.nickname ? message.member?.nickname : message.author.username

        message.channel.send(bentoResult)

        const userDefault: rpsGameCreationAttributes = {
            userID: BigInt(message.author.id),
            paperLosses: 0,
            paperWins: 0,
            rockLosses: 0,
            rockWins: 0,
            scissorWins: 0,
            scissorsLosses: 0,
            paperTies: 0,
            rockTies: 0,
            scissorsTies: 0
        }

        if (result === choice) {
            switch (choice) {
                case 'rock': {
                    const userData = await rpsGame.findOrCreate({raw: true, where: {userID: message.author.id}, defaults: userDefault})
                    await rpsGame.update({rockTies: userData[0].rockTies +1}, {where: {userID: message.author.id}})                    
                }
                case 'paper': {
                    const userData = await rpsGame.findOrCreate({raw: true, where: {userID: message.author.id}, defaults: userDefault})
                    await rpsGame.update({paperTies: userData[0].paperTies +1}, {where: {userID: message.author.id}})        
                }
                case 'scissors': {
                    const userData = await rpsGame.findOrCreate({raw: true, where: {userID: message.author.id}, defaults: userDefault})
                    await rpsGame.update({scissorsTies: userData[0].scissorsTies +1}, {where: {userID: message.author.id}})  
                }
            }
            return message.channel.send(`**${username}** Its a tie 👔! We had the same choice 😂`);
        }

        switch (choice) {
            case 'rock': {
                if (result === 'paper') {
                    const userData = await rpsGame.findOrCreate({raw: true, where: {userID: message.author.id}, defaults: userDefault})
                    await rpsGame.update({rockLosses: userData[0].rockLosses +1}, {where: {userID: message.author.id}})
                    return message.channel.send(`**${username}** I won! 🤣`);
                }
                else {
                    const userData = await rpsGame.findOrCreate({raw: true, where: {userID: message.author.id}, defaults: userDefault})
                    await rpsGame.update({rockWins: userData[0].rockWins +1}, {where: {userID: message.author.id}})
                    return message.channel.send(`**${username}** You won! 😔`);
                }
            }
            case 'paper': {
                if (result === 'scissors') {
                    const userData = await rpsGame.findOrCreate({raw: true, where: {userID: message.author.id}, defaults: userDefault})
                    await rpsGame.update({paperLosses: userData[0].paperLosses +1}, {where: {userID: message.author.id}})
                    return message.channel.send(`**${username}** I won! 🤣`);
                }
                else {
                    const userData = await rpsGame.findOrCreate({raw: true, where: {userID: message.author.id}, defaults: userDefault})
                    await rpsGame.update({paperWins: userData[0].paperWins +1}, {where: {userID: message.author.id}})
                    return message.channel.send(`**${username}** You won! 😔`);
                }        
            }
            case 'scissors': {
                if (result === 'rock') {
                    const userData = await rpsGame.findOrCreate({raw: true, where: {userID: message.author.id}, defaults: userDefault})
                    await rpsGame.update({scissorsLosses: userData[0].scissorsLosses +1}, {where: {userID: message.author.id}})
                    return message.channel.send(`**${username}** I won! 🤣`);
                }
                else {
                    const userData = await rpsGame.findOrCreate({raw: true, where: {userID: message.author.id}, defaults: userDefault})
                    await rpsGame.update({scissorWins: userData[0].scissorWins +1}, {where: {userID: message.author.id}})
                    return message.channel.send(`**${username}** You won! 😔`);
                }
            }
            default: {
                return message.channel.send(`Only these responses are accepted: \`${acceptedReplies.join(', ')}\``);
            }
        }
    }
}