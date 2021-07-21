import type { Sequelize, Model } from "sequelize";
import { autoRole } from "./autoRole";
import type { autoRoleAttributes, autoRoleCreationAttributes } from "./autoRole";
import { ban } from "./ban";
import type { banAttributes, banCreationAttributes } from "./ban";
import { bento } from "./bento";
import type { bentoAttributes, bentoCreationAttributes } from "./bento";
import { bye } from "./bye";
import type { byeAttributes, byeCreationAttributes } from "./bye";
import { caseGlobal } from "./caseGlobal";
import type { caseGlobalAttributes, caseGlobalCreationAttributes } from "./caseGlobal";
import { guild } from "./guild";
import type { guildAttributes, guildCreationAttributes } from "./guild";
import { guildMember } from "./guildMember";
import type { guildMemberAttributes, guildMemberCreationAttributes } from "./guildMember";
import { horoscope } from "./horoscope";
import type { horoscopeAttributes, horoscopeCreationAttributes } from "./horoscope";
import { kick } from "./kick";
import type { kickAttributes, kickCreationAttributes } from "./kick";
import { lastfm } from "./lastfm";
import type { lastfmAttributes, lastfmCreationAttributes } from "./lastfm";
import { messageLog } from "./messageLog";
import type { messageLogAttributes, messageLogCreationAttributes } from "./messageLog";
import { modLog } from "./modLog";
import type { modLogAttributes, modLogCreationAttributes } from "./modLog";
import { mute } from "./mute";
import type { muteAttributes, muteCreationAttributes } from "./mute";
import { muteRole } from "./muteRole";
import type { muteRoleAttributes, muteRoleCreationAttributes } from "./muteRole";
import { reminder } from "./reminder";
import type { reminderAttributes, reminderCreationAttributes } from "./reminder";
import { tag } from "./tag";
import type { tagAttributes, tagCreationAttributes } from "./tag";
import { user } from "./user";
import type { userAttributes, userCreationAttributes } from "./user";
import { warning } from "./warning";
import type { warningAttributes, warningCreationAttributes } from "./warning";
import { weather } from "./weather";
import type { weatherAttributes, weatherCreationAttributes } from "./weather";
import { welcome } from "./welcome";
import type { welcomeAttributes, welcomeCreationAttributes } from "./welcome";

export {
  autoRole,
  ban,
  bento,
  bye,
  caseGlobal,
  guild,
  guildMember,
  horoscope,
  kick,
  lastfm,
  messageLog,
  modLog,
  mute,
  muteRole,
  reminder,
  tag,
  user,
  warning,
  weather,
  welcome,
};

export type {
  autoRoleAttributes,
  autoRoleCreationAttributes,
  banAttributes,
  banCreationAttributes,
  bentoAttributes,
  bentoCreationAttributes,
  byeAttributes,
  byeCreationAttributes,
  caseGlobalAttributes,
  caseGlobalCreationAttributes,
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
  messageLogAttributes,
  messageLogCreationAttributes,
  modLogAttributes,
  modLogCreationAttributes,
  muteAttributes,
  muteCreationAttributes,
  muteRoleAttributes,
  muteRoleCreationAttributes,
  reminderAttributes,
  reminderCreationAttributes,
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
};

export function initModels(sequelize: Sequelize) {
  autoRole.initModel(sequelize);
  ban.initModel(sequelize);
  bento.initModel(sequelize);
  bye.initModel(sequelize);
  caseGlobal.initModel(sequelize);
  guild.initModel(sequelize);
  guildMember.initModel(sequelize);
  horoscope.initModel(sequelize);
  kick.initModel(sequelize);
  lastfm.initModel(sequelize);
  messageLog.initModel(sequelize);
  modLog.initModel(sequelize);
  mute.initModel(sequelize);
  muteRole.initModel(sequelize);
  reminder.initModel(sequelize);
  tag.initModel(sequelize);
  user.initModel(sequelize);
  warning.initModel(sequelize);
  weather.initModel(sequelize);
  welcome.initModel(sequelize);

  autoRole.belongsTo(guild, { as: "guild", foreignKey: "guildID"});
  guild.hasMany(autoRole, { as: "autoRoles", foreignKey: "guildID"});
  ban.belongsTo(guild, { as: "guild", foreignKey: "guildID"});
  guild.hasMany(ban, { as: "bans", foreignKey: "guildID"});
  bye.belongsTo(guild, { as: "guild", foreignKey: "guildID"});
  guild.hasOne(bye, { as: "bye", foreignKey: "guildID"});
  guildMember.belongsTo(guild, { as: "guild", foreignKey: "guildID"});
  guild.hasMany(guildMember, { as: "guildMembers", foreignKey: "guildID"});
  kick.belongsTo(guild, { as: "guild", foreignKey: "guildID"});
  guild.hasMany(kick, { as: "kicks", foreignKey: "guildID"});
  messageLog.belongsTo(guild, { as: "guild", foreignKey: "guildID"});
  guild.hasOne(messageLog, { as: "messageLog", foreignKey: "guildID"});
  modLog.belongsTo(guild, { as: "guild", foreignKey: "guildID"});
  guild.hasOne(modLog, { as: "modLog", foreignKey: "guildID"});
  mute.belongsTo(guild, { as: "guild", foreignKey: "guildID"});
  guild.hasMany(mute, { as: "mutes", foreignKey: "guildID"});
  muteRole.belongsTo(guild, { as: "guild", foreignKey: "guildID"});
  guild.hasOne(muteRole, { as: "muteRole", foreignKey: "guildID"});
  tag.belongsTo(guild, { as: "guild", foreignKey: "guildID"});
  guild.hasMany(tag, { as: "tags", foreignKey: "guildID"});
  warning.belongsTo(guild, { as: "guild", foreignKey: "guildID"});
  guild.hasMany(warning, { as: "warnings", foreignKey: "guildID"});
  welcome.belongsTo(guild, { as: "guild", foreignKey: "guildID"});
  guild.hasOne(welcome, { as: "welcome", foreignKey: "guildID"});
  ban.belongsTo(user, { as: "user", foreignKey: "userID"});
  user.hasMany(ban, { as: "bans", foreignKey: "userID"});
  ban.belongsTo(user, { as: "actor_user", foreignKey: "actor"});
  user.hasMany(ban, { as: "actor_bans", foreignKey: "actor"});
  bento.belongsTo(user, { as: "user", foreignKey: "userID"});
  user.hasOne(bento, { as: "bento", foreignKey: "userID"});
  guildMember.belongsTo(user, { as: "user", foreignKey: "userID"});
  user.hasMany(guildMember, { as: "guildMembers", foreignKey: "userID"});
  horoscope.belongsTo(user, { as: "user", foreignKey: "userID"});
  user.hasOne(horoscope, { as: "horoscope", foreignKey: "userID"});
  kick.belongsTo(user, { as: "user", foreignKey: "userID"});
  user.hasMany(kick, { as: "kicks", foreignKey: "userID"});
  kick.belongsTo(user, { as: "actor_user", foreignKey: "actor"});
  user.hasMany(kick, { as: "actor_kicks", foreignKey: "actor"});
  lastfm.belongsTo(user, { as: "user", foreignKey: "userID"});
  user.hasOne(lastfm, { as: "lastfm", foreignKey: "userID"});
  mute.belongsTo(user, { as: "user", foreignKey: "userID"});
  user.hasMany(mute, { as: "mutes", foreignKey: "userID"});
  mute.belongsTo(user, { as: "actor_user", foreignKey: "actor"});
  user.hasMany(mute, { as: "actor_mutes", foreignKey: "actor"});
  reminder.belongsTo(user, { as: "user", foreignKey: "userID"});
  user.hasMany(reminder, { as: "reminders", foreignKey: "userID"});
  tag.belongsTo(user, { as: "user", foreignKey: "userID"});
  user.hasMany(tag, { as: "tags", foreignKey: "userID"});
  warning.belongsTo(user, { as: "user", foreignKey: "userID"});
  user.hasMany(warning, { as: "warnings", foreignKey: "userID"});
  warning.belongsTo(user, { as: "actor_user", foreignKey: "actor"});
  user.hasMany(warning, { as: "actor_warnings", foreignKey: "actor"});
  weather.belongsTo(user, { as: "user", foreignKey: "userID"});
  user.hasOne(weather, { as: "weather", foreignKey: "userID"});

  return {
    autoRole: autoRole,
    ban: ban,
    bento: bento,
    bye: bye,
    caseGlobal: caseGlobal,
    guild: guild,
    guildMember: guildMember,
    horoscope: horoscope,
    kick: kick,
    lastfm: lastfm,
    messageLog: messageLog,
    modLog: modLog,
    mute: mute,
    muteRole: muteRole,
    reminder: reminder,
    tag: tag,
    user: user,
    warning: warning,
    weather: weather,
    welcome: welcome,
  };
}
