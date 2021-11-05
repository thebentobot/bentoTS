import type { Sequelize } from 'sequelize'
import { autoRole } from './autoRole'
import type { autoRoleAttributes, autoRoleCreationAttributes } from './autoRole'
import { availableRolesGuild } from './availableRolesGuild'
import type { availableRolesGuildAttributes, availableRolesGuildCreationAttributes } from './availableRolesGuild'
import { ban } from './ban'
import type { banAttributes, banCreationAttributes } from './ban'
import { bento } from './bento'
import type { bentoAttributes, bentoCreationAttributes } from './bento'
import { bye } from './bye'
import type { byeAttributes, byeCreationAttributes } from './bye'
import { caseGlobal } from './caseGlobal'
import type { caseGlobalAttributes, caseGlobalCreationAttributes } from './caseGlobal'
import { gfycatBlacklist } from './gfycatBlacklist'
import type { gfycatBlacklistAttributes, gfycatBlacklistCreationAttributes } from './gfycatBlacklist'
import { guild } from './guild'
import type { guildAttributes, guildCreationAttributes } from './guild'
import { guildMember } from './guildMember'
import type { guildMemberAttributes, guildMemberCreationAttributes } from './guildMember'
import { horoscope } from './horoscope'
import type { horoscopeAttributes, horoscopeCreationAttributes } from './horoscope'
import { kick } from './kick'
import type { kickAttributes, kickCreationAttributes } from './kick'
import { lastfm } from './lastfm'
import type { lastfmAttributes, lastfmCreationAttributes } from './lastfm'
import { memberLog } from './memberLog'
import type { memberLogAttributes, memberLogCreationAttributes } from './memberLog'
import { messageLog } from './messageLog'
import type { messageLogAttributes, messageLogCreationAttributes } from './messageLog'
import { modLog } from './modLog'
import type { modLogAttributes, modLogCreationAttributes } from './modLog'
import { mute } from './mute'
import type { muteAttributes, muteCreationAttributes } from './mute'
import { muteRole } from './muteRole'
import type { muteRoleAttributes, muteRoleCreationAttributes } from './muteRole'
import { notificationMessage } from './notificationMessage'
import type { notificationMessageAttributes, notificationMessageCreationAttributes } from './notificationMessage'
import { patreon } from './patreon'
import type { patreonAttributes, patreonCreationAttributes } from './patreon'
import { profile } from './profile'
import type { profileAttributes, profileCreationAttributes } from './profile'
import { reminder } from './reminder'
import type { reminderAttributes, reminderCreationAttributes } from './reminder'
import { role } from './role'
import type { roleAttributes, roleCreationAttributes } from './role'
import { roleChannel } from './roleChannel'
import type { roleChannelAttributes, roleChannelCreationAttributes } from './roleChannel'
import { roleMessages } from './roleMessages'
import type { roleMessagesAttributes, roleMessagesCreationAttributes } from './roleMessages'
import { rpsGame } from './rpsGame'
import type { rpsGameAttributes, rpsGameCreationAttributes } from './rpsGame'
import { tag } from './tag'
import type { tagAttributes, tagCreationAttributes } from './tag'
import { user } from './user'
import type { userAttributes, userCreationAttributes } from './user'
import { warning } from './warning'
import type { warningAttributes, warningCreationAttributes } from './warning'
import { weather } from './weather'
import type { weatherAttributes, weatherCreationAttributes } from './weather'
import { welcome } from './welcome'
import type { welcomeAttributes, welcomeCreationAttributes } from './welcome'

export {
	autoRole,
	availableRolesGuild,
	ban,
	bento,
	bye,
	caseGlobal,
	gfycatBlacklist,
	guild,
	guildMember,
	horoscope,
	kick,
	lastfm,
	memberLog,
	messageLog,
	modLog,
	mute,
	muteRole,
	notificationMessage,
	patreon,
	profile,
	reminder,
	role,
	roleChannel,
	roleMessages,
	rpsGame,
	tag,
	user,
	warning,
	weather,
	welcome,
}

export type {
	autoRoleAttributes,
	autoRoleCreationAttributes,
	availableRolesGuildAttributes,
	availableRolesGuildCreationAttributes,
	banAttributes,
	banCreationAttributes,
	bentoAttributes,
	bentoCreationAttributes,
	byeAttributes,
	byeCreationAttributes,
	caseGlobalAttributes,
	caseGlobalCreationAttributes,
	gfycatBlacklistAttributes,
	gfycatBlacklistCreationAttributes,
	guildAttributes,
	guildCreationAttributes,
	guildMemberAttributes,
	guildMemberCreationAttributes,
	horoscopeAttributes,
	horoscopeCreationAttributes,
	kickAttributes,
	kickCreationAttributes,
	lastfmAttributes,
	lastfmCreationAttributes,
	memberLogAttributes,
	memberLogCreationAttributes,
	messageLogAttributes,
	messageLogCreationAttributes,
	modLogAttributes,
	modLogCreationAttributes,
	muteAttributes,
	muteCreationAttributes,
	muteRoleAttributes,
	muteRoleCreationAttributes,
	notificationMessageAttributes,
	notificationMessageCreationAttributes,
	patreonAttributes,
	patreonCreationAttributes,
	profileAttributes,
	profileCreationAttributes,
	reminderAttributes,
	reminderCreationAttributes,
	roleAttributes,
	roleCreationAttributes,
	roleChannelAttributes,
	roleChannelCreationAttributes,
	roleMessagesAttributes,
	roleMessagesCreationAttributes,
	rpsGameAttributes,
	rpsGameCreationAttributes,
	tagAttributes,
	tagCreationAttributes,
	userAttributes,
	userCreationAttributes,
	warningAttributes,
	warningCreationAttributes,
	weatherAttributes,
	weatherCreationAttributes,
	welcomeAttributes,
	welcomeCreationAttributes,
}

export function initModels(sequelize: Sequelize) {
	autoRole.initModel(sequelize)
	availableRolesGuild.initModel(sequelize)
	ban.initModel(sequelize)
	bento.initModel(sequelize)
	bye.initModel(sequelize)
	caseGlobal.initModel(sequelize)
	gfycatBlacklist.initModel(sequelize)
	guild.initModel(sequelize)
	guildMember.initModel(sequelize)
	horoscope.initModel(sequelize)
	kick.initModel(sequelize)
	lastfm.initModel(sequelize)
	memberLog.initModel(sequelize)
	messageLog.initModel(sequelize)
	modLog.initModel(sequelize)
	mute.initModel(sequelize)
	muteRole.initModel(sequelize)
	notificationMessage.initModel(sequelize)
	patreon.initModel(sequelize)
	profile.initModel(sequelize)
	reminder.initModel(sequelize)
	role.initModel(sequelize)
	roleChannel.initModel(sequelize)
	roleMessages.initModel(sequelize)
	rpsGame.initModel(sequelize)
	tag.initModel(sequelize)
	user.initModel(sequelize)
	warning.initModel(sequelize)
	weather.initModel(sequelize)
	welcome.initModel(sequelize)

	autoRole.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasMany(autoRole, { as: `autoRoles`, foreignKey: `guildID` })
	availableRolesGuild.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasMany(availableRolesGuild, { as: `availableRolesGuilds`, foreignKey: `guildID` })
	ban.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasMany(ban, { as: `bans`, foreignKey: `guildID` })
	bye.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasOne(bye, { as: `bye`, foreignKey: `guildID` })
	caseGlobal.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasOne(caseGlobal, { as: `caseGlobal`, foreignKey: `guildID` })
	guildMember.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasMany(guildMember, { as: `guildMembers`, foreignKey: `guildID` })
	kick.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasMany(kick, { as: `kicks`, foreignKey: `guildID` })
	memberLog.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasOne(memberLog, { as: `memberLog`, foreignKey: `guildID` })
	messageLog.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasOne(messageLog, { as: `messageLog`, foreignKey: `guildID` })
	modLog.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasOne(modLog, { as: `modLog`, foreignKey: `guildID` })
	mute.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasMany(mute, { as: `mutes`, foreignKey: `guildID` })
	muteRole.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasOne(muteRole, { as: `muteRole`, foreignKey: `guildID` })
	role.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasMany(role, { as: `roles`, foreignKey: `guildID` })
	roleChannel.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasOne(roleChannel, { as: `roleChannel`, foreignKey: `guildID` })
	roleMessages.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasOne(roleMessages, { as: `roleMessage`, foreignKey: `guildID` })
	tag.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasMany(tag, { as: `tags`, foreignKey: `guildID` })
	warning.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasMany(warning, { as: `warnings`, foreignKey: `guildID` })
	welcome.belongsTo(guild, { as: `guild`, foreignKey: `guildID` })
	guild.hasOne(welcome, { as: `welcome`, foreignKey: `guildID` })
	bento.belongsTo(user, { as: `user`, foreignKey: `userID` })
	user.hasOne(bento, { as: `bento`, foreignKey: `userID` })
	guildMember.belongsTo(user, { as: `user`, foreignKey: `userID` })
	user.hasMany(guildMember, { as: `guildMembers`, foreignKey: `userID` })
	horoscope.belongsTo(user, { as: `user`, foreignKey: `userID` })
	user.hasOne(horoscope, { as: `horoscope`, foreignKey: `userID` })
	lastfm.belongsTo(user, { as: `user`, foreignKey: `userID` })
	user.hasOne(lastfm, { as: `lastfm`, foreignKey: `userID` })
	notificationMessage.belongsTo(user, { as: `user`, foreignKey: `userID` })
	user.hasMany(notificationMessage, { as: `notificationMessages`, foreignKey: `userID` })
	patreon.belongsTo(user, { as: `user`, foreignKey: `userID` })
	user.hasMany(patreon, { as: `patreons`, foreignKey: `userID` })
	profile.belongsTo(user, { as: `user`, foreignKey: `userID` })
	user.hasOne(profile, { as: `profile`, foreignKey: `userID` })
	reminder.belongsTo(user, { as: `user`, foreignKey: `userID` })
	user.hasMany(reminder, { as: `reminders`, foreignKey: `userID` })
	rpsGame.belongsTo(user, { as: `user`, foreignKey: `userID` })
	user.hasMany(rpsGame, { as: `rpsGames`, foreignKey: `userID` })
	tag.belongsTo(user, { as: `user`, foreignKey: `userID` })
	user.hasMany(tag, { as: `tags`, foreignKey: `userID` })
	weather.belongsTo(user, { as: `user`, foreignKey: `userID` })
	user.hasOne(weather, { as: `weather`, foreignKey: `userID` })

	return {
		autoRole: autoRole,
		availableRolesGuild: availableRolesGuild,
		ban: ban,
		bento: bento,
		bye: bye,
		caseGlobal: caseGlobal,
		gfycatBlacklist: gfycatBlacklist,
		guild: guild,
		guildMember: guildMember,
		horoscope: horoscope,
		kick: kick,
		lastfm: lastfm,
		memberLog: memberLog,
		messageLog: messageLog,
		modLog: modLog,
		mute: mute,
		muteRole: muteRole,
		notificationMessage: notificationMessage,
		patreon: patreon,
		profile: profile,
		reminder: reminder,
		role: role,
		roleChannel: roleChannel,
		roleMessages: roleMessages,
		rpsGame: rpsGame,
		tag: tag,
		user: user,
		warning: warning,
		weather: weather,
		welcome: welcome,
	}
}
