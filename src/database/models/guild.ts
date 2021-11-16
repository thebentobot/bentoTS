import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { announcementSchedule, announcementScheduleId } from './announcementSchedule';
import type { announcementTime, announcementTimeId } from './announcementTime';
import type { autoRole, autoRoleId } from './autoRole';
import type { availableRolesGuild, availableRolesGuildId } from './availableRolesGuild';
import type { ban, banId } from './ban';
import type { bye, byeCreationAttributes, byeId } from './bye';
import type { caseGlobal, caseGlobalCreationAttributes, caseGlobalId } from './caseGlobal';
import type { channelDisable, channelDisableId } from './channelDisable';
import type { guildMember, guildMemberId } from './guildMember';
import type { kick, kickId } from './kick';
import type { memberLog, memberLogCreationAttributes, memberLogId } from './memberLog';
import type { messageLog, messageLogCreationAttributes, messageLogId } from './messageLog';
import type { modLog, modLogCreationAttributes, modLogId } from './modLog';
import type { mute, muteId } from './mute';
import type { muteRole, muteRoleCreationAttributes, muteRoleId } from './muteRole';
import type { role, roleId } from './role';
import type { roleChannel, roleChannelCreationAttributes, roleChannelId } from './roleChannel';
import type { roleMessages, roleMessagesCreationAttributes, roleMessagesId } from './roleMessages';
import type { tag, tagId } from './tag';
import type { warning, warningId } from './warning';
import type { welcome, welcomeCreationAttributes, welcomeId } from './welcome';

export interface guildAttributes {
  guildID: number;
  guildName: string;
  prefix: string;
  tiktok: boolean;
  leaderboard: boolean;
  media: boolean;
  icon?: string;
  memberCount?: number;
}

export type guildPk = "guildID";
export type guildId = guild[guildPk];
export type guildOptionalAttributes = "guildID" | "icon" | "memberCount";
export type guildCreationAttributes = Optional<guildAttributes, guildOptionalAttributes>;

export class guild extends Model<guildAttributes, guildCreationAttributes> implements guildAttributes {
  guildID!: number;
  guildName!: string;
  prefix!: string;
  tiktok!: boolean;
  leaderboard!: boolean;
  media!: boolean;
  icon?: string;
  memberCount?: number;

  // guild hasMany announcementSchedule via guildID
  announcementSchedules!: announcementSchedule[];
  getAnnouncementSchedules!: Sequelize.HasManyGetAssociationsMixin<announcementSchedule>;
  setAnnouncementSchedules!: Sequelize.HasManySetAssociationsMixin<announcementSchedule, announcementScheduleId>;
  addAnnouncementSchedule!: Sequelize.HasManyAddAssociationMixin<announcementSchedule, announcementScheduleId>;
  addAnnouncementSchedules!: Sequelize.HasManyAddAssociationsMixin<announcementSchedule, announcementScheduleId>;
  createAnnouncementSchedule!: Sequelize.HasManyCreateAssociationMixin<announcementSchedule>;
  removeAnnouncementSchedule!: Sequelize.HasManyRemoveAssociationMixin<announcementSchedule, announcementScheduleId>;
  removeAnnouncementSchedules!: Sequelize.HasManyRemoveAssociationsMixin<announcementSchedule, announcementScheduleId>;
  hasAnnouncementSchedule!: Sequelize.HasManyHasAssociationMixin<announcementSchedule, announcementScheduleId>;
  hasAnnouncementSchedules!: Sequelize.HasManyHasAssociationsMixin<announcementSchedule, announcementScheduleId>;
  countAnnouncementSchedules!: Sequelize.HasManyCountAssociationsMixin;
  // guild hasMany announcementTime via guildID
  announcementTimes!: announcementTime[];
  getAnnouncementTimes!: Sequelize.HasManyGetAssociationsMixin<announcementTime>;
  setAnnouncementTimes!: Sequelize.HasManySetAssociationsMixin<announcementTime, announcementTimeId>;
  addAnnouncementTime!: Sequelize.HasManyAddAssociationMixin<announcementTime, announcementTimeId>;
  addAnnouncementTimes!: Sequelize.HasManyAddAssociationsMixin<announcementTime, announcementTimeId>;
  createAnnouncementTime!: Sequelize.HasManyCreateAssociationMixin<announcementTime>;
  removeAnnouncementTime!: Sequelize.HasManyRemoveAssociationMixin<announcementTime, announcementTimeId>;
  removeAnnouncementTimes!: Sequelize.HasManyRemoveAssociationsMixin<announcementTime, announcementTimeId>;
  hasAnnouncementTime!: Sequelize.HasManyHasAssociationMixin<announcementTime, announcementTimeId>;
  hasAnnouncementTimes!: Sequelize.HasManyHasAssociationsMixin<announcementTime, announcementTimeId>;
  countAnnouncementTimes!: Sequelize.HasManyCountAssociationsMixin;
  // guild hasMany autoRole via guildID
  autoRoles!: autoRole[];
  getAutoRoles!: Sequelize.HasManyGetAssociationsMixin<autoRole>;
  setAutoRoles!: Sequelize.HasManySetAssociationsMixin<autoRole, autoRoleId>;
  addAutoRole!: Sequelize.HasManyAddAssociationMixin<autoRole, autoRoleId>;
  addAutoRoles!: Sequelize.HasManyAddAssociationsMixin<autoRole, autoRoleId>;
  createAutoRole!: Sequelize.HasManyCreateAssociationMixin<autoRole>;
  removeAutoRole!: Sequelize.HasManyRemoveAssociationMixin<autoRole, autoRoleId>;
  removeAutoRoles!: Sequelize.HasManyRemoveAssociationsMixin<autoRole, autoRoleId>;
  hasAutoRole!: Sequelize.HasManyHasAssociationMixin<autoRole, autoRoleId>;
  hasAutoRoles!: Sequelize.HasManyHasAssociationsMixin<autoRole, autoRoleId>;
  countAutoRoles!: Sequelize.HasManyCountAssociationsMixin;
  // guild hasMany availableRolesGuild via guildID
  availableRolesGuilds!: availableRolesGuild[];
  getAvailableRolesGuilds!: Sequelize.HasManyGetAssociationsMixin<availableRolesGuild>;
  setAvailableRolesGuilds!: Sequelize.HasManySetAssociationsMixin<availableRolesGuild, availableRolesGuildId>;
  addAvailableRolesGuild!: Sequelize.HasManyAddAssociationMixin<availableRolesGuild, availableRolesGuildId>;
  addAvailableRolesGuilds!: Sequelize.HasManyAddAssociationsMixin<availableRolesGuild, availableRolesGuildId>;
  createAvailableRolesGuild!: Sequelize.HasManyCreateAssociationMixin<availableRolesGuild>;
  removeAvailableRolesGuild!: Sequelize.HasManyRemoveAssociationMixin<availableRolesGuild, availableRolesGuildId>;
  removeAvailableRolesGuilds!: Sequelize.HasManyRemoveAssociationsMixin<availableRolesGuild, availableRolesGuildId>;
  hasAvailableRolesGuild!: Sequelize.HasManyHasAssociationMixin<availableRolesGuild, availableRolesGuildId>;
  hasAvailableRolesGuilds!: Sequelize.HasManyHasAssociationsMixin<availableRolesGuild, availableRolesGuildId>;
  countAvailableRolesGuilds!: Sequelize.HasManyCountAssociationsMixin;
  // guild hasMany ban via guildID
  bans!: ban[];
  getBans!: Sequelize.HasManyGetAssociationsMixin<ban>;
  setBans!: Sequelize.HasManySetAssociationsMixin<ban, banId>;
  addBan!: Sequelize.HasManyAddAssociationMixin<ban, banId>;
  addBans!: Sequelize.HasManyAddAssociationsMixin<ban, banId>;
  createBan!: Sequelize.HasManyCreateAssociationMixin<ban>;
  removeBan!: Sequelize.HasManyRemoveAssociationMixin<ban, banId>;
  removeBans!: Sequelize.HasManyRemoveAssociationsMixin<ban, banId>;
  hasBan!: Sequelize.HasManyHasAssociationMixin<ban, banId>;
  hasBans!: Sequelize.HasManyHasAssociationsMixin<ban, banId>;
  countBans!: Sequelize.HasManyCountAssociationsMixin;
  // guild hasOne bye via guildID
  bye!: bye;
  getBye!: Sequelize.HasOneGetAssociationMixin<bye>;
  setBye!: Sequelize.HasOneSetAssociationMixin<bye, byeId>;
  createBye!: Sequelize.HasOneCreateAssociationMixin<byeCreationAttributes>;
  // guild hasOne caseGlobal via guildID
  caseGlobal!: caseGlobal;
  getCaseGlobal!: Sequelize.HasOneGetAssociationMixin<caseGlobal>;
  setCaseGlobal!: Sequelize.HasOneSetAssociationMixin<caseGlobal, caseGlobalId>;
  createCaseGlobal!: Sequelize.HasOneCreateAssociationMixin<caseGlobalCreationAttributes>;
  // guild hasMany channelDisable via guildID
  channelDisables!: channelDisable[];
  getChannelDisables!: Sequelize.HasManyGetAssociationsMixin<channelDisable>;
  setChannelDisables!: Sequelize.HasManySetAssociationsMixin<channelDisable, channelDisableId>;
  addChannelDisable!: Sequelize.HasManyAddAssociationMixin<channelDisable, channelDisableId>;
  addChannelDisables!: Sequelize.HasManyAddAssociationsMixin<channelDisable, channelDisableId>;
  createChannelDisable!: Sequelize.HasManyCreateAssociationMixin<channelDisable>;
  removeChannelDisable!: Sequelize.HasManyRemoveAssociationMixin<channelDisable, channelDisableId>;
  removeChannelDisables!: Sequelize.HasManyRemoveAssociationsMixin<channelDisable, channelDisableId>;
  hasChannelDisable!: Sequelize.HasManyHasAssociationMixin<channelDisable, channelDisableId>;
  hasChannelDisables!: Sequelize.HasManyHasAssociationsMixin<channelDisable, channelDisableId>;
  countChannelDisables!: Sequelize.HasManyCountAssociationsMixin;
  // guild hasMany guildMember via guildID
  guildMembers!: guildMember[];
  getGuildMembers!: Sequelize.HasManyGetAssociationsMixin<guildMember>;
  setGuildMembers!: Sequelize.HasManySetAssociationsMixin<guildMember, guildMemberId>;
  addGuildMember!: Sequelize.HasManyAddAssociationMixin<guildMember, guildMemberId>;
  addGuildMembers!: Sequelize.HasManyAddAssociationsMixin<guildMember, guildMemberId>;
  createGuildMember!: Sequelize.HasManyCreateAssociationMixin<guildMember>;
  removeGuildMember!: Sequelize.HasManyRemoveAssociationMixin<guildMember, guildMemberId>;
  removeGuildMembers!: Sequelize.HasManyRemoveAssociationsMixin<guildMember, guildMemberId>;
  hasGuildMember!: Sequelize.HasManyHasAssociationMixin<guildMember, guildMemberId>;
  hasGuildMembers!: Sequelize.HasManyHasAssociationsMixin<guildMember, guildMemberId>;
  countGuildMembers!: Sequelize.HasManyCountAssociationsMixin;
  // guild hasMany kick via guildID
  kicks!: kick[];
  getKicks!: Sequelize.HasManyGetAssociationsMixin<kick>;
  setKicks!: Sequelize.HasManySetAssociationsMixin<kick, kickId>;
  addKick!: Sequelize.HasManyAddAssociationMixin<kick, kickId>;
  addKicks!: Sequelize.HasManyAddAssociationsMixin<kick, kickId>;
  createKick!: Sequelize.HasManyCreateAssociationMixin<kick>;
  removeKick!: Sequelize.HasManyRemoveAssociationMixin<kick, kickId>;
  removeKicks!: Sequelize.HasManyRemoveAssociationsMixin<kick, kickId>;
  hasKick!: Sequelize.HasManyHasAssociationMixin<kick, kickId>;
  hasKicks!: Sequelize.HasManyHasAssociationsMixin<kick, kickId>;
  countKicks!: Sequelize.HasManyCountAssociationsMixin;
  // guild hasOne memberLog via guildID
  memberLog!: memberLog;
  getMemberLog!: Sequelize.HasOneGetAssociationMixin<memberLog>;
  setMemberLog!: Sequelize.HasOneSetAssociationMixin<memberLog, memberLogId>;
  createMemberLog!: Sequelize.HasOneCreateAssociationMixin<memberLogCreationAttributes>;
  // guild hasOne messageLog via guildID
  messageLog!: messageLog;
  getMessageLog!: Sequelize.HasOneGetAssociationMixin<messageLog>;
  setMessageLog!: Sequelize.HasOneSetAssociationMixin<messageLog, messageLogId>;
  createMessageLog!: Sequelize.HasOneCreateAssociationMixin<messageLogCreationAttributes>;
  // guild hasOne modLog via guildID
  modLog!: modLog;
  getModLog!: Sequelize.HasOneGetAssociationMixin<modLog>;
  setModLog!: Sequelize.HasOneSetAssociationMixin<modLog, modLogId>;
  createModLog!: Sequelize.HasOneCreateAssociationMixin<modLogCreationAttributes>;
  // guild hasMany mute via guildID
  mutes!: mute[];
  getMutes!: Sequelize.HasManyGetAssociationsMixin<mute>;
  setMutes!: Sequelize.HasManySetAssociationsMixin<mute, muteId>;
  addMute!: Sequelize.HasManyAddAssociationMixin<mute, muteId>;
  addMutes!: Sequelize.HasManyAddAssociationsMixin<mute, muteId>;
  createMute!: Sequelize.HasManyCreateAssociationMixin<mute>;
  removeMute!: Sequelize.HasManyRemoveAssociationMixin<mute, muteId>;
  removeMutes!: Sequelize.HasManyRemoveAssociationsMixin<mute, muteId>;
  hasMute!: Sequelize.HasManyHasAssociationMixin<mute, muteId>;
  hasMutes!: Sequelize.HasManyHasAssociationsMixin<mute, muteId>;
  countMutes!: Sequelize.HasManyCountAssociationsMixin;
  // guild hasOne muteRole via guildID
  muteRole!: muteRole;
  getMuteRole!: Sequelize.HasOneGetAssociationMixin<muteRole>;
  setMuteRole!: Sequelize.HasOneSetAssociationMixin<muteRole, muteRoleId>;
  createMuteRole!: Sequelize.HasOneCreateAssociationMixin<muteRoleCreationAttributes>;
  // guild hasMany role via guildID
  roles!: role[];
  getRoles!: Sequelize.HasManyGetAssociationsMixin<role>;
  setRoles!: Sequelize.HasManySetAssociationsMixin<role, roleId>;
  addRole!: Sequelize.HasManyAddAssociationMixin<role, roleId>;
  addRoles!: Sequelize.HasManyAddAssociationsMixin<role, roleId>;
  createRole!: Sequelize.HasManyCreateAssociationMixin<role>;
  removeRole!: Sequelize.HasManyRemoveAssociationMixin<role, roleId>;
  removeRoles!: Sequelize.HasManyRemoveAssociationsMixin<role, roleId>;
  hasRole!: Sequelize.HasManyHasAssociationMixin<role, roleId>;
  hasRoles!: Sequelize.HasManyHasAssociationsMixin<role, roleId>;
  countRoles!: Sequelize.HasManyCountAssociationsMixin;
  // guild hasOne roleChannel via guildID
  roleChannel!: roleChannel;
  getRoleChannel!: Sequelize.HasOneGetAssociationMixin<roleChannel>;
  setRoleChannel!: Sequelize.HasOneSetAssociationMixin<roleChannel, roleChannelId>;
  createRoleChannel!: Sequelize.HasOneCreateAssociationMixin<roleChannelCreationAttributes>;
  // guild hasOne roleMessages via guildID
  roleMessage!: roleMessages;
  getRoleMessage!: Sequelize.HasOneGetAssociationMixin<roleMessages>;
  setRoleMessage!: Sequelize.HasOneSetAssociationMixin<roleMessages, roleMessagesId>;
  createRoleMessage!: Sequelize.HasOneCreateAssociationMixin<roleMessagesCreationAttributes>;
  // guild hasMany tag via guildID
  tags!: tag[];
  getTags!: Sequelize.HasManyGetAssociationsMixin<tag>;
  setTags!: Sequelize.HasManySetAssociationsMixin<tag, tagId>;
  addTag!: Sequelize.HasManyAddAssociationMixin<tag, tagId>;
  addTags!: Sequelize.HasManyAddAssociationsMixin<tag, tagId>;
  createTag!: Sequelize.HasManyCreateAssociationMixin<tag>;
  removeTag!: Sequelize.HasManyRemoveAssociationMixin<tag, tagId>;
  removeTags!: Sequelize.HasManyRemoveAssociationsMixin<tag, tagId>;
  hasTag!: Sequelize.HasManyHasAssociationMixin<tag, tagId>;
  hasTags!: Sequelize.HasManyHasAssociationsMixin<tag, tagId>;
  countTags!: Sequelize.HasManyCountAssociationsMixin;
  // guild hasMany warning via guildID
  warnings!: warning[];
  getWarnings!: Sequelize.HasManyGetAssociationsMixin<warning>;
  setWarnings!: Sequelize.HasManySetAssociationsMixin<warning, warningId>;
  addWarning!: Sequelize.HasManyAddAssociationMixin<warning, warningId>;
  addWarnings!: Sequelize.HasManyAddAssociationsMixin<warning, warningId>;
  createWarning!: Sequelize.HasManyCreateAssociationMixin<warning>;
  removeWarning!: Sequelize.HasManyRemoveAssociationMixin<warning, warningId>;
  removeWarnings!: Sequelize.HasManyRemoveAssociationsMixin<warning, warningId>;
  hasWarning!: Sequelize.HasManyHasAssociationMixin<warning, warningId>;
  hasWarnings!: Sequelize.HasManyHasAssociationsMixin<warning, warningId>;
  countWarnings!: Sequelize.HasManyCountAssociationsMixin;
  // guild hasOne welcome via guildID
  welcome!: welcome;
  getWelcome!: Sequelize.HasOneGetAssociationMixin<welcome>;
  setWelcome!: Sequelize.HasOneSetAssociationMixin<welcome, welcomeId>;
  createWelcome!: Sequelize.HasOneCreateAssociationMixin<welcomeCreationAttributes>;

  static initModel(sequelize: Sequelize.Sequelize): typeof guild {
    guild.init({
    guildID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    guildName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    prefix: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    tiktok: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    leaderboard: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    media: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true
    },
    memberCount: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'guild',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "guild_guildid_uindex",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
      {
        name: "guild_pk",
        unique: true,
        fields: [
          { name: "guildID" },
        ]
      },
    ]
  });
  return guild;
  }
}
