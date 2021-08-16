import { Command } from '../../interfaces';
import database from '../../database/database';
import { initModels, bento, bentoCreationAttributes, guildMember } from '../../database/models/init-models';
import { GuildMember, Message, Util } from 'discord.js';
import moment from 'moment';
import { getTimeRemaining } from '../../utils/getTimeRemaining';

export const command: Command = {
    name: 'bento',
    aliases: ['bentobox', '🍱'],
    category: 'user',
    description: 'Give a Bento Box 🍱 to your friend every 12th hour :D.',
    usage: 'bento [<user>]. If you just write the command, it shows when you can give a Bento Box 🍱 again.',
    run: async (client, message, args): Promise<Message> => {
        if (!args.length) {
            return giveBento (message)
        } else {
            return giveBento (message, args[0])
        }

        async function giveBento (message: Message, user?: guildMember | any) {
            initModels(database);

            if (!user) {
                let bentoData: any;
                let then: Date
                try {
                    bentoData = await bento.findOne({raw: true, where: {userID: message.author.id}});
                    then = new Date(bentoData.bentoDate);
                } catch {
                    return message.channel.send(Util.removeMentions(`${(await message.guild.members.fetch(message.author.id)).nickname ? (await message.guild.members.fetch(message.author.id)).nickname : message.author.username} you haven't tried to give someone a Bento Box 🍱 before.\nPlease do the command again and mention a friend or a userID to give them a Bento 🍱!\nYou'll most likely get one back! 🥺`))
                }
                const now: Date = new Date();
                const diff: number = now.getTime() - then.getTime();
                const diffHours = Math.round(diff / (1000 * 60 * 60));
                const hours = 12;
                // to make it 12 hours, i assume it's just changing 24 to 12, and for the moment add days it's 12 hours instead of 1 day
                if (diffHours < hours) {
                    return message.channel.send(Util.removeMentions(`${(await message.guild.members.fetch(message.author.id)).nickname ? (await message.guild.members.fetch(message.author.id)).nickname : message.author.username}, you can give someone a Bento Box 🍱 again in ${getTimeRemaining(moment(bentoData.bentoDate).add(12, 'hour')).hours} hours, ${getTimeRemaining(moment(bentoData.bentoDate).add(12, 'hour')).minutes} minutes and ${getTimeRemaining(moment(bentoData.bentoDate).add(12, 'hour')).seconds} seconds`));
                }
                if (diffHours >= hours) {
                    return message.channel.send(`You didn't specify a user to give a Bento 🍱 to 🥺`);
                }
            } else {
                let mentionedUser: GuildMember;
                try {
                    mentionedUser = message.mentions.members.first() || await message.guild.members.fetch(user);
                } catch {
                    return message.channel.send(`Your input was invalid. Please specify a user.`)
                }
                if (mentionedUser.id === message.author.id) return message.channel.send(`You can't give yourself a Bento 🍱 😠`)
                if (mentionedUser.user.bot === true) return message.channel.send(`You can't give a bot a Bento 🍱, don't feed bots food 😭`)

                const bentoAttr: bentoCreationAttributes = {
                    userID: BigInt(message.author.id),
                    bento: 0,
                }

                const bentoData = await bento.findOrCreate({raw: true, where: {userID: message.author.id}, defaults: bentoAttr});
                const now: Date = new Date()
                const then: Date = new Date(bentoData[0].bentoDate)

                const diff = now.getTime() - then.getTime()
                const diffHours = Math.round(diff / (1000 * 60 * 60))
                const hours = 12

                if (diffHours < hours && bentoData[1] === false) {
                    return message.channel.send(Util.removeMentions(`${(await message.guild.members.fetch(message.author.id)).nickname ? (await message.guild.members.fetch(message.author.id)).nickname : message.author.username}, you can give someone a Bento Box 🍱 again in ${getTimeRemaining(moment(bentoData[0].bentoDate).add(12, 'hour')).hours} hours, ${getTimeRemaining(moment(bentoData[0].bentoDate).add(12, 'hour')).minutes} minutes and ${getTimeRemaining(moment(bentoData[0].bentoDate).add(12, 'hour')).seconds} seconds`));
                } else {

                    const newUserDate = moment(now).add(-12, 'hour').toDate()

                    const bentoAttrTarget: bentoCreationAttributes = {
                        userID: BigInt(mentionedUser.id),
                        bento: 0,
                        bentoDate: new Date(newUserDate)
                    }

                    await bento.update({bentoDate: now}, {where: {userID: bentoData[0].userID}})
                    const bentoDataTarget = await bento.findOrCreate({raw: true, where: {userID: mentionedUser.id}, defaults: bentoAttrTarget})
                    const targetIncrement = await bento.increment('bento', {by: 1, where: { userID: bentoDataTarget[0].userID}});

                    return message.channel.send(Util.removeMentions(`**${(await message.guild.members.fetch(message.author.id)).nickname ? (await message.guild.members.fetch(message.author.id)).nickname : message.author.username}** just gave a Bento 🍱 to **${(await message.guild.members.fetch(mentionedUser.id)).nickname ? `${(await message.guild.members.fetch(mentionedUser.id)).nickname} (${(await message.guild.members.fetch(mentionedUser.id)).user.username}#${(await message.guild.members.fetch(mentionedUser.id)).user.discriminator})` : `${(await message.guild.members.fetch(mentionedUser.id)).user.username}#${(await message.guild.members.fetch(mentionedUser.id)).user.discriminator}`}**!\n**${(await message.guild.members.fetch(mentionedUser.id)).nickname ? `${(await message.guild.members.fetch(mentionedUser.id)).nickname} (${(await message.guild.members.fetch(mentionedUser.id)).user.username}#${(await message.guild.members.fetch(mentionedUser.id)).user.discriminator})` : `${(await message.guild.members.fetch(mentionedUser.id)).user.username}#${(await message.guild.members.fetch(mentionedUser.id)).user.discriminator}`}** has received **${targetIncrement[0][0][0].bento} Bento** 🍱 over time 😋\n**${(await message.guild.members.fetch(message.author.id)).nickname ? (await message.guild.members.fetch(message.author.id)).nickname : message.author.username}** can give a Bento 🍱 again in 12 hours.`))
                }
            }
        }
    }
}