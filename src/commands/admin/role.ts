import { GuildMember, Message, MessageEmbed, Role, TextChannel, Util } from 'discord.js';
import { availableRolesGuild } from '../../database/models/availableRolesGuild';
import { guild } from '../../database/models/guild';
import { role, role as roleDB, roleCreationAttributes} from '../../database/models/role';
import { roleChannel, roleChannelCreationAttributes } from '../../database/models/roleChannel';
import { roleMessages, roleMessagesCreationAttributes } from '../../database/models/roleMessages';
import { Command } from '../../interfaces';
import { urlToColours } from '../../utils';

export async function roleManagement (message: Message) {
    async function roleEmbed (responses: object) {
        const embed = new MessageEmbed()
        embed.setTitle(Util.removeMentions(`${message.member.nickname ? `${message.member.nickname} (${message.author.username}#${message.author.discriminator})` : `${message.author.username}#${message.author.discriminator}`}`))
        embed.setThumbnail(message.author.avatarURL({dynamic: true, format: 'png'}))
        let key: string
        let val: any
        for ([key, val] of Object.entries(responses)) {
            if (val.length > 0) embed.addField(key, val.join(', '), false)
        }
        return embed;
    }
    await message.delete().catch(() => {});

    let args = message.content.trim().split(' ');
    if (args.length < 2) {
        return message.delete({ timeout: 1000 }).catch(() => {});
    }
    let prefix = message.content.trim().match(/^(?:\+|\-)\s*(main|sub|other)/i);
    if (!prefix) {
        return message.reply('Invalid formatting. Please read the instructions above.').then(reply => {
            reply.delete({ timeout: 4000 }).catch(() => {});
        }) 
    }
    let modifier = prefix[0][0];
    let type = prefix[1];
    let roleCommands = message.content.slice(message.content.indexOf(type) + type.length).split(',');
    let rolesToProcess = [];
    let rolesSuccessful = [];
    let rolesUnsuccessful = [];
    let errors = [];

    let member: GuildMember;
    if (message.member) {
        member = message.member;
    } else {
        member = await message.guild.members.fetch(message.author.id) as GuildMember;
    }

    let colour: number | string;

    for (let i = 0; i < roleCommands.length; i++) {
        let roleCommand = roleCommands[i].trim();
        let roleData = await roleDB.findOne({raw: true, where: {roleCommand: roleCommand, guildID: message.guild.id, type: type}})
        let role: Role;
        if (roleData) {
            role = await message.guild.roles.fetch(`${roleData.roleID}`)
        }

        if (role) {
            if (!colour) colour = role.color;

            switch (modifier) {
                case '+':
                    if (member.roles.cache.has(`${roleData.roleID}`) && !rolesUnsuccessful.includes(role)) {
                        rolesUnsuccessful.push(role)
                    } else if (!member.roles.cache.has(`${roleData.roleID}`) && !rolesSuccessful.includes(role)) {
                        rolesToProcess.push(`${roleData.roleID}`)
                        rolesSuccessful.push(role)
                    }
                    break;
                case '-':
                    if (!member.roles.cache.has(`${roleData.roleID}`) && !rolesUnsuccessful.includes(role)) {
                        rolesUnsuccessful.push(role)
                    } else if (member.roles.cache.has(`${roleData.roleID}`) && !rolesUnsuccessful.includes(role)) {
                        rolesToProcess.push(`${roleData.roleID}`)
                        rolesSuccessful.push(role)
                    }
                    break;
            }

        } else {
            errors.push(`"${roleCommand}"`);
        }
    }
    if (!colour) colour = await urlToColours(`${message.guild.iconURL({format: 'png'}) ? message.guild.iconURL({format: 'png'}) : message.author.avatarURL({format: 'png'})}`)

    switch (modifier) {
        case '+':
            member.roles.add(rolesToProcess)
            const addRoleResponses = {'Assigned Roles': rolesSuccessful, 'Current Roles': rolesUnsuccessful, 'Invalid Roles': errors}
            const addRoleEmbed = await roleEmbed(addRoleResponses)
            addRoleEmbed.setColor(colour)
            await message.reply(addRoleEmbed).then(async reply => {
                await reply.delete({timeout: addRoleEmbed.fields.length * 2000 + 2000 })
            })
            break;
        case '-':
            member.roles.remove(rolesToProcess)
            const removeRoleResponses = {'Removed Roles': rolesSuccessful, 'Roles not assigned': rolesUnsuccessful, 'Invalid Roles': errors}
            const removeRoleEmbed = await roleEmbed(removeRoleResponses)
            removeRoleEmbed.setColor(colour)
            await message.reply(removeRoleEmbed).then(async reply => {
                await reply.delete({timeout: removeRoleEmbed.fields.length * 2000 + 2000 })
            })
            break;
    }
}

export const command: Command = {
    name: 'role',
    aliases: [],
    category: 'admin',
    description: 'Command to setup and manage role management on your server. Assign a specific channel where your users can assign roles by themselves. You can write custom instructions, add and delete roles as you like.\nSetup by following the order of the usage commands below. You need to first add the instructions message by using the message argument, then add roles, and then set the channel for role assignment.',
    usage: ' is the prefix\n**role message <content>** Sets or updates the message for the role channel. It is here where you can write instructions on how to assign or remove roles, and what each role means e.g. normal Discord formatting and spaces/new lines are available.\n**role add <main/sub/other> <roleCommand: roleName>[, roleCommand: roleName, ]** adds roles to the role management system. You can add multiple at the same time as long as they got the same type of role. It needs to be name of the role, no mention or id.\nPractical example of how to set a role: ?role add main test1: new role, test2: new role, ez: new role2\n**role remove <main/sub/other> <roleCommand>[, roleCommand, roleCommand]** deletes the saved role commands, and if the role name does not have a role command anymore then it also deletes the role name in the system.\nPractical example: ?role delete test1, test2, ez\n**role channel <mention role channel or its channelID>** sets or updates the message in the role channel. Shows your saved instructions and an embed with a list of all possible roles (by role name, not role command). Also sets as the only channel where you can assign roles.\n**role update** updates the message in the role channel. Useful for when you have deleted roles or got new instructions.\n**role list** shows a list of all saved role commands and role names.',
    website: 'https://www.bentobot.xyz/commands#role',
    run: async (client, message, args): Promise<Message> => {
        if (!message.member.hasPermission('MANAGE_ROLES')) {
            return message.channel.send('You do not have permission to use this command.\nYou are not a mod.').then(m => m.delete({timeout: 5000}));
        }

        const guildData = await guild.findOne({raw:true, where: {guildID: message.guild.id}});
        
        if (args[0] === 'message') {
            return roleMessageFunction (message, args.slice(1).join(' '))
        }
        
        if (args[0] === 'add') {
            return roleSetFunction (message, args[1], args.slice(2).join(' '))
        }
        
        if (args[0] === 'delete') {
            return roleDeleteFunction (message, args[1], args.slice(2).join(' '))
        }

        if (args[0] === 'channel') {
            return rolesChannel (message, args[1])
        }

        if (args[0] === 'update') {
            return rolesChannelUpdate (message)
        }

        if (args[0] === 'list') {
            return rolesList (message)
        }

        if (!args.length) {
            return message.channel.send(`Get help with this command by using\`${guildData.prefix}help role\``)
        }

        async function roleMessageFunction (message: Message, content: string) {
            if (!content) {
                return message.channel.send(`You haven't written a message for your role management channel.\nWrite a message by using\`${guildData.prefix}role message <content>\``)
            }

            const roleMessageData = await roleMessages.findOne({raw: true, where: {guildID: message.guild.id}})

            if (roleMessageData === null) {
                const roleMessageAttr: roleMessagesCreationAttributes = {
                    guildID: BigInt(message.guild.id),
                    message: content
                }
    
                await roleMessages.create(roleMessageAttr)
                return message.channel.send(`The message for your role management channel has been set.`)
            } else {
                try {
                    await roleMessages.update({message: content}, {where: {guildID: message.guild.id}})
                    return message.channel.send(`The message for your role management channel has been updated.`)   
                } catch {
                    return
                }   
            }
        }

        async function roleSetFunction (message: Message, type: string, roleText: string) {
            if (!type) {
                return message.channel.send(`You haven't specified a role type.\nGet help with this command by using\`${guildData.prefix}help role\``)
            }
            
            if (!["main", "sub", "other"].includes(type)) {
                return message.channel.send(`You haven't specified a valid role type.\nIt needs to be either \`main\`, \`sub\` or \`other\`.\nGet help with this command by using\`${guildData.prefix}help role\``)
            }

            if (!roleText) {
                return message.channel.send(`You haven't specified a role text.\nGet help with this command by using\`${guildData.prefix}help role\``)
            }

            const pairs = roleText.split(",")
            const errors: Array<string> = [];
            const rolesAdded: Array<string> = [];
            const rolesExist: Array<string> = [];
            const availableRoleAdded: Array<string> = [];
            const availableRoleExists: Array<string> = [];

            for (let i = 0; i < pairs.length; i++) {
                let pair = pairs[i].trim();
                if (!pair.includes(':')) {
                    errors.push(pair)
                    continue;
                }
                const roles = pair.split(':', 2);
                const roleCommand = roles[0].trim();
                const roleName = roles[1].trim();
                const roleDiscord = message.guild.roles.cache.find(role => role.name == roleName);
                if (roleCommand.length < 1 || roleName.length <1) {
                    errors.push(roleCommand);
                } else if (!roleDiscord || !message.guild.roles.cache.has(roleDiscord.id)) {
                    errors.push(roleCommand)
                } else {
                    const roleID = roleDiscord.id
                    let roleAttr: roleCreationAttributes
                    if (type === 'main') {
                        roleAttr = {
                            roleID: BigInt(roleID),
                            roleCommand: roleCommand,
                            roleName: roleName,
                            guildID: BigInt(message.guild.id),
                            type: 'main'
                        }
                    }
                    if (type === 'sub') {
                        roleAttr = {
                            roleID: BigInt(roleID),
                            roleCommand: roleCommand,
                            roleName: roleName,
                            guildID: BigInt(message.guild.id),
                            type: 'sub'
                        }
                    }
                    if (type === 'other') {
                        roleAttr = {
                            roleID: BigInt(roleID),
                            roleCommand: roleCommand,
                            roleName: roleName,
                            guildID: BigInt(message.guild.id),
                            type: 'other'
                        }
                    }
                    const added = await role.findOrCreate({raw: true, where: {roleName: roleName, roleCommand: roleCommand, type: type, guildID: message.guild.id}, defaults: roleAttr})
                    if (added[1] === true) {
                        rolesAdded.push(roleName)
                    } else {
                        rolesExist.push(roleName)
                    }
                    const availableRole = await availableRolesGuild.findOrCreate({raw: true, where: {role: roleName, type: type, guildID: message.guild.id}})
                    if (availableRole[1] === true) {
                        availableRoleAdded.push(roleName)
                    } else {
                        availableRoleExists.push(roleName)
                    }
                }
            }

            return await message.channel.send(rolesResponse({
                'Role commands added': rolesAdded,
                'Role commands already paired': rolesExist,
                'Errors': errors,
                'Available role added': availableRoleAdded,
                'Available role exists': availableRoleExists
            }))
        }

        async function roleDeleteFunction (message: Message, type: string, roleText: string) {
            if (!type) {
                return message.channel.send(`You haven't specified a role type.\nGet help with this command by using\`${guildData.prefix}help role\``)
            }

            if (!['main', 'sub', 'other'].includes(type)) {
                return message.channel.send(`You haven't specified a valid role type.\nIt needs to be either \`main\`, \`sub\` or \`other\`.\nGet help with this command by using\`${guildData.prefix}help role\``)
            }

            if (!roleText) {
                return message.channel.send(`You haven't specified a role text.\nGet help with this command by using\`${guildData.prefix}help role\``)
            }

            const roleCommands = roleText.split(', ')
            const errors: Array<string> = [];
            const rolesRemoved: Array<string> = [];
            const rolesNotExisting: Array<string> = [];
            const availableRolesRemoved: Array<string> = [];
            const availableRolesNotExisting: Array<string> = [];

            for (let i = 0; i < roleCommands.length; i++) {
                let roleCommand = roleCommands[i].trim();
                if (roleCommand.length < 1) {
                    errors.push(roleCommand);
                } else {
                    const roleData = await role.findOne({where: {roleCommand: roleCommand, guildID: message.guild.id, type: type}})
                    if (roleData === null) {
                        rolesNotExisting.push(roleCommand)
                    }
                    const removed = await role.destroy({where: {roleCommand: roleCommand, guildID: message.guild.id, type: type}})
                    if (removed > 0) {
                        rolesRemoved.push(roleCommand);
                    }
                    const roleCheck = await role.findAndCountAll({raw: true, where: {guildID: message.guild.id, roleName: roleData.roleName, type: roleData.type}})
                    if (roleCheck.count === 0) {
                        const availableRoleData = await availableRolesGuild.findOne({raw: true, where: {guildID: message.guild.id, role: roleData.roleName, type: roleData.type}})
                        if (availableRoleData === null) {
                            availableRolesNotExisting.push(roleData.roleName)
                        } else {
                            await availableRolesGuild.destroy({where: {guildID: message.guild.id, role: roleData.roleName, type: roleData.type}})
                            availableRolesRemoved.push(roleData.roleName)
                        }
                    }
                }
            }

            return await message.channel.send(rolesResponse({
                'Role commands removed': rolesRemoved,
                'Role commands that did not exist': rolesNotExisting,
                'Errors': errors,
                'Available Roles removed': availableRolesRemoved,
                'Available Roles not existing': availableRolesNotExisting
            }))
        }

        async function rolesChannel (message: Message, channelMention?: string) {
            if (!channelMention) {
                return message.channel.send(`You haven't specified a channel for your role management.\nGet help with this command by using\`${guildData.prefix}help role\``)
            }

            let channelID: string;

            try {
                const channel = message.mentions.channels.first() || message.guild.channels.cache.get(channelMention) as TextChannel
                channelID = channel.id
            } catch {
                return message.channel.send(`Your channel id ${channelMention} was invalid.\nPlease use a valid channel id.`);
            }

            const messageData = await roleMessages.findOne({raw: true, where: {guildID: message.guild.id}})
            if (messageData === null) {
                return message.channel.send(`You haven't written a message for your role management channel.\nWrite a message by using\`${guildData.prefix}role message <content>\``)
            }

            const channelData = await roleChannel.findOne({raw: true, where: {guildID: message.guild.id}})

            if (channelData === null) {
                const getChannel = client.channels.cache.get(channelID) as TextChannel
                const embed: MessageEmbed = await roleListEmbed(message)
                const msg = await getChannel.send(messageData.message, embed)

                const roleChannelAttr: roleChannelCreationAttributes = {
                    guildID: BigInt(message.guild.id),
                    channelID: BigInt(channelID)
                }

                await roleMessages.update({messageID: BigInt(msg.id)}, {where: {guildID: message.guild.id}})
                await roleChannel.create(roleChannelAttr)
                return message.channel.send(`Roles channel set to <#${channelID}>`)
            } else {
                const getChannel = client.channels.cache.get(channelID) as TextChannel
                const embed: MessageEmbed = await roleListEmbed(message)
                const msg = await getChannel.send(messageData.message, embed)

                await roleMessages.update({messageID: BigInt(msg.id)}, {where: {guildID: message.guild.id}})
                await roleChannel.update({channelID: BigInt(channelID)}, {where: {guildID: message.guild.id}})
                return message.channel.send(`Roles channel updated to <#${channelID}>`)
            }
        }

        async function rolesChannelUpdate (message: Message) {
            const messageData = await roleMessages.findOne({raw: true, where: {guildID: message.guild.id}})

            if (messageData === null) {
                return await message.channel.send(`No roles channel message assigned.`)
            }

            const messageID = messageData.messageID
            const MessageContent = messageData.message
            const channelData = await roleChannel.findOne({raw: true, where: {guildID: message.guild.id}})
            if (channelData === null) {
                return await message.channel.send(`No roles channel assigned.`)
            }
            const channelID = channelData.channelID
            const roleChannelDiscord = client.channels.cache.get(`${channelID}`) as TextChannel
            let embed = await roleListEmbed(message)

            let oldRoleChannelMessage = await roleChannelDiscord.messages.fetch(`${messageID}`)
            oldRoleChannelMessage.delete();
            let newMessage = await roleChannelDiscord.send(MessageContent, embed)
            await roleMessages.update({messageID: BigInt(newMessage.id)}, {where: {guildID: message.guild.id, messageID: messageData.messageID}})
            return await message.channel.send(`Roles channel message updated.`)
        }

        async function rolesList (message: Message) {
            const roleData = await role.findAndCountAll({raw: true, where: {guildID: message.guild.id}})
            if (roleData.count === 0) {
                return await message.channel.send(`This server hasn't added any roles.`)
            }
            const guild = message.guild
            let mainRoles: Array<string> = [];
            let subRoles: Array<string> = [];
            let otherRoles: Array<string> = [];
            for (let i = 0; i < roleData.rows.length; i++) {
                let row = roleData.rows[i];
                let command = row.roleCommand
                let name = guild.roles.cache.get(`${row.roleID}`).name;
                switch (row.type) {
                    case 'main': mainRoles.push(`${command}: ${name}`); break;
                    case 'sub': subRoles.push(`${command}: ${name}`); break;
                    case 'other': otherRoles.push(`${command}: ${name}`); break;
                    default: console.error('Unexpected value for column: type'); break;
                }
            }
            let mainRolesFinal: string
            let subRolesFinal: string
            let otherRolesFinal: string
            mainRolesFinal = '__**Main Roles**__\n' + mainRoles.join(' **|** ') + '\n';
            subRolesFinal = '__**Sub Roles**__\n' + subRoles.join(' **|** ') + '\n';
            otherRolesFinal = '__**Other Roles**__\n' + otherRoles.join(' **|** ') + '\n';
            const roleList = [mainRolesFinal, subRolesFinal, otherRolesFinal].join('\n');
            return await message.channel.send(roleList)
        }

        async function roleListEmbed (message: Message) {
            const guild = client.guilds.cache.get(message.guild.id);
            const role_rows = await availableRolesGuild.findAll({raw: true, where: {guildID: message.guild.id}})
            if (!role_rows || !role_rows.length) return;

            const main_roles = [];
            const sub_roles = [];
            const other_roles = [];
            for (let i = 0; i < role_rows.length; i++) {
                    const row = role_rows[i];
                    switch (row.type) {
                        case "main": main_roles.push(`\`${row.role}\``); break;
                        case "sub": sub_roles.push(`\`${row.role}\``); break;
                        case "other": other_roles.push(`\`${row.role}\``); break; 
                }
            }

            const embed = new MessageEmbed()
            .setTitle(`Available Roles`)
            .setColor(`${await urlToColours(guild.iconURL({format: 'png'}) ? guild.iconURL({format: 'png'}) : client.user.avatarURL({ format: "png" }))}`)
            if (main_roles.length) embed.addField("Main Roles", main_roles.join(", "), false);
            if (sub_roles.length) embed.addField("Sub Roles", sub_roles.join(", "), false);
            if (other_roles.length) embed.addField("Other Roles", other_roles.join(", "), false);
            return embed;
        }

        function rolesResponse(responses: object) {
            let list = [];
            let key: string
            let val: any
            for ([key, val] of Object.entries(responses)) {
                if (val.length > 0) list.push(`**${key}**: ${val.join(", ")}`)
            }
            return list.join("\n");
        }
    }
}