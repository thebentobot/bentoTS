import { Command } from '../../interfaces';
import database from '../../database/database.js';
import { initModels, muteRole, muteRoleCreationAttributes, guild } from '../../database/models/init-models.js';

export const command: Command = {
    name: 'muterole',
    aliases: [],
    category: 'admin',
    description: 'Set an mute role that users get assigned when a mod mutes them',
    usage: ' is the prefix\nmuterole <status>\nmuterole set <roleID>\nmuterole delete <roleID>',
    run: async (client, message, args): Promise<any> => {
        if (!message.member.hasPermission('MANAGE_GUILD')) {
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
            let regExp = /[a-zA-Z]/g;
            let role = args[1]
            if (regExp.test(role) == true) return message.channel.send(`Your role id ${args[1]} was invalid.\nPlease use a valid role id.`);
            
            const attr: muteRoleCreationAttributes = {
                guildID: BigInt(message.guild.id),
                roleID: BigInt(role)
            }
            await muteRole.create(attr);
            
            return message.channel.send(`Your role <@&${role}> was set as an mute role.`); 
        }

        if (args[0] == 'delete') {
            message.channel.send(`Your mute role <@&${args[1]}> is now deleted in Bento's database and Bento will from now on not assign users with that role when they get muted by a mod.\nPlease use ${guildData.prefix}muterole set <roleID> to set an mute role again.\nYou can't mute users without a mute role.`);
            await muteRole.destroy({where: { roleID: args[1], guildID: message.guild.id}});
        }
    }
}