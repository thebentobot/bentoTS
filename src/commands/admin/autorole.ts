import { Command } from '../../interfaces';
import database from '../../database/database';
import { initModels, autoRole, autoRoleCreationAttributes, guild } from '../../database/models/init-models';
import { Message } from 'discord.js';

export const command: Command = {
    name: 'autorole',
    aliases: [],
    category: 'admin',
    description: 'Set an auto role that users get assigned automatically when they join. You can add multiple roles.',
    usage: 'autorole <status>\nautorole set <roleID or role mention>\nautorole delete <roleID>\nautorole list',
    website: 'https://www.bentobot.xyz/commands#autorole',
    run: async (client, message, args): Promise<Message> => {
        if (!message.member.hasPermission('MANAGE_ROLES')) {
            return message.channel.send('You do not have permission to use this command!').then(m => m.delete({timeout: 10000}));
        };

        initModels(database);

        const guildData = await guild.findOne({raw:true, where: {guildID: message.guild.id}});

        if (args.length < 1) {
            return message.channel.send(`You must specify what you want to do with the auto role settings.\nUse \`${guildData.prefix}help autorole\` to see how to use this command.`);
        };

        if (args[0] == 'status') {
            try {
                const autoRoleData = await autoRole.findOne({raw: true, where: {guildID: message.guild.id}});
                return message.channel.send(`Auto role is currently \`${autoRoleData ? 'Enabled' : 'Disabled'}\` on this server.`);
            } catch {
                return message.channel.send(`This server doesn't have a auto role.\nUse \`${guildData.prefix}help autorole\` to see how to setup a auto role for this server.`)
            }
        }

        if (args[0] == 'set') {
            if (!args[1]) return message.channel.send('Please assign a role id as the second argument');
            try {
                const roleID = message.mentions.roles.first() || message.guild.roles.cache.get(args[1])
                const attr: autoRoleCreationAttributes = {
                    guildID: BigInt(message.guild.id),
                    roleID: BigInt(roleID.id)
                }
                await autoRole.create(attr);
                if (roleID.position > message.guild.members.resolve(client.user).roles.highest.position) {
                    return message.channel.send(`Your role <@&${roleID.id}> was set as an auto role.\n**PLEASE hierarchically position the highest role for ${client.user} higher than <@&${roleID.id}> or else the auto role won't be assigned for joining users.\nTo see a list of your auto roles use ${guildData.prefix}autorole list`, {disableMentions: 'everyone'});
                } else {
                    return message.channel.send(`Your role <@&${roleID.id}> was set as an auto role.\nTo see a list of your auto roles use ${guildData.prefix}autorole list`, {disableMentions: 'everyone'});
                }
            } catch {
                return message.channel.send(`Your role id ${args[1]} was invalid.\nPlease use a valid role id.`);
            } 
        }

        if (args[0] == 'delete') {
            try {
                const roleID = message.mentions.roles.first() || await message.guild.roles.cache.get(args[1])
                await autoRole.destroy({where: { roleID: roleID.id, guildID: message.guild.id}});
                return message.channel.send(`Your auto role <@&${roleID.id}> is now deleted in Bento's database and Bento will from now on not assign new users with that role.\nPlease use ${guildData.prefix}autorole set <roleID> to set an auto role again.`, {disableMentions: 'everyone'});
            } catch {
                return message.channel.send(`<@&${args[1]}> wasn't saved as an auto role, or is invalid.`, {disableMentions: 'everyone'});
            }
        }

        if (args[0] == 'list') {
            try {
                const roles = await autoRole.findAll({where: { guildID: message.guild.id}});
                const iterator = roles.values();

                for (const value of iterator) {
                    message.channel.send(`<@&${value.roleID}>`)
                }
            } catch {
                return message.channel.send(`You don't have any auto roles saved.`)
            }
        }
    }
}