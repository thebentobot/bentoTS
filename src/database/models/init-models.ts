import type { Sequelize, Model } from "sequelize";
import { autoRole } from "./autoRole.js";
import type { autoRoleAttributes, autoRoleCreationAttributes } from "./autoRole.js";
import { ban } from "./ban.js";
import type { banAttributes, banCreationAttributes } from "./ban.js";
import { bento } from "./bento.js";
import type { bentoAttributes, bentoCreationAttributes } from "./bento.js";
import { bye } from "./bye.js";
import type { byeAttributes, byeCreationAttributes } from "./bye.js";
import { guild } from "./guild.js";
import type { guildAttributes, guildCreationAttributes } from "./guild.js";
import { guildMember } from "./guildMember.js";
import type { guildMemberAttributes, guildMemberCreationAttributes } from "./guildMember.js";
import { horoscope } from "./horoscope.js";
import type { horoscopeAttributes, horoscopeCreationAttributes } from "./horoscope.js";
import { kick } from "./kick.js";
import type { kickAttributes, kickCreationAttributes } from "./kick.js";
import { lastfm } from "./lastfm.js";
import type { lastfmAttributes, lastfmCreationAttributes } from "./lastfm.js";
import { messageLog } from "./messageLog.js";
import type { messageLogAttributes, messageLogCreationAttributes } from "./messageLog.js";
import { modLog } from "./modLog.js";
import type { modLogAttributes, modLogCreationAttributes } from "./modLog.js";
import { mute } from "./mute.js";
import type { muteAttributes, muteCreationAttributes } from "./mute.js";
import { muteRole } from "./muteRole.js";
import type { muteRoleAttributes, muteRoleCreationAttributes } from "./muteRole.js";
import { tag } from "./tag.js";
import type { tagAttributes, tagCreationAttributes } from "./tag.js";
import { user } from "./user.js";
import type { userAttributes, userCreationAttributes } from "./user.js";
import { warning } from "./warning.js";
import type { warningAttributes, warningCreationAttributes } from "./warning.js";
import { weather } from "./weather.js";
import type { weatherAttributes, weatherCreationAttributes } from "./weather.js";
import { welcome } from "./welcome.js";
import type { welcomeAttributes, welcomeCreationAttributes } from "./welcome.js";

export {
  autoRole,
  ban,
  bento,
  bye,
  guild,
  guildMember,
  horoscope,
  kick,
  lastfm,
  messageLog,
  modLog,
  mute,
  muteRole,
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
  guild.initModel(sequelize);
  guildMember.initModel(sequelize);
  horoscope.initModel(sequelize);
  kick.initModel(sequelize);
  lastfm.initModel(sequelize);
  messageLog.initModel(sequelize);
  modLog.initModel(sequelize);
  mute.initModel(sequelize);
  muteRole.initModel(sequelize);
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
    guild: guild,
    guildMember: guildMember,
    horoscope: horoscope,
    kick: kick,
    lastfm: lastfm,
    messageLog: messageLog,
    modLog: modLog,
    mute: mute,
    muteRole: muteRole,
    tag: tag,
    user: user,
    warning: warning,
    weather: weather,
    welcome: welcome,
  };
}
