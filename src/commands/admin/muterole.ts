import { Command } from '../../interfaces';
import database from '../../database/database';
import { initModels, muteRole, muteRoleCreationAttributes, guild } from '../../database/models/init-models';
import { Message } from 'discord.js';

export const command: Command = {
    name: 'muterole',
    aliases: [],
    category: 'admin',
    description: 'Set an mute role that users get assigned when a mod mutes them',
    usage: ' is the prefix\nmuterole <status>\nmuterole set <roleID or role mention>\nmuterole delete <roleID>',
    run: async (client, message, args): Promise<Message> => {
        if (!message.member.hasPermission('MANAGE_ROLES')) {
            return message.channel.send('You do not have permission to use this command!').then(m => m.delete({timeout: 10000}));
        };

        initModels(database);

        const guildData = await guild.findOne({raw:true, where: {guildID: message.guild.id}});

        if (args.length < 1) {
            return message.channel.send(`You must specify what you want to do with the mute role settings.\nUse \`${guildData.prefix}help muterole\` to see how to use this command.`);
        };

        if (args[0] == 'status') {
            try {
                const muteRoleData = await muteRole.findOne({raw: true, where: {guildID: message.guild.id}});
                return message.channel.send(`
            mute role is currently \`${muteRoleData ? 'Enabled' : 'Disabled'}\` on this server.`);
            } catch {
                return message.channel.send(`This server doesn't have a mute role.\nUse \`${guildData.prefix}help muterole\` to see how to setup a mute role for this server.`)
            }
        }

        if (args[0] == 'set') {
            if (!args[1]) return message.channel.send('Please assign a role id as the second argument');
            
            try {
                const roleID = message.mentions.roles.first() || message.guild.roles.cache.get(args[1])
                const attr: muteRoleCreationAttributes = {
                    guildID: BigInt(message.guild.id),
                    roleID: BigInt(roleID.id)
                }
                await muteRole.create(attr);
                return message.channel.send(`Your role <@&${roleID.id}> was set as an mute role.`, {disableMentions: 'everyone'}); 
            } catch {
                return message.channel.send(`Your role id ${args[1]} was invalid.\nPlease use a valid role id.`);
            }            
        }

        if (args[0] == 'delete') {
            try {
                await muteRole.destroy({where: { roleID: args[1], guildID: message.guild.id}});
                return message.channel.send(`Your mute role <@&${args[1]}> is now deleted in Bento's database and Bento will from now on not assign users with that role when they get muted by a mod.\nPlease use ${guildData.prefix}muterole set <roleID> to set an mute role again.\nYou can't mute users without a mute role.`);
            } catch {
                return message.channel.send(`You don't have a mute role saved.`)
            }
        }
    }
}