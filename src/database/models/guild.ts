import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { autoRole, autoRoleId } from './autoRole.js';
import type { ban, banId } from './ban.js';
import type { bye, byeCreationAttributes, byeId } from './bye.js';
import type { guildMember, guildMemberId } from './guildMember.js';
import type { kick, kickId } from './kick.js';
import type { messageLog, messageLogCreationAttributes, messageLogId } from './messageLog.js';
import type { modLog, modLogCreationAttributes, modLogId } from './modLog.js';
import type { mute, muteId } from './mute.js';
import type { muteRole, muteRoleCreationAttributes, muteRoleId } from './muteRole.js';
import type { tag, tagId } from './tag.js';
import type { warning, warningId } from './warning.js';
import type { welcome, welcomeCreationAttributes, welcomeId } from './welcome.js';

export interface guildAttributes {
  guildID: bigint;
  guildName: string;
  prefix: string;
  tiktok: boolean;
  nsfw: boolean;
  leaderboard: boolean;
  media: boolean;
}

export type guildPk = "guildID";
export type guildId = guild[guildPk];
export type guildCreationAttributes = Optional<guildAttributes, guildPk>;

export class guild extends Model<guildAttributes, guildCreationAttributes> implements guildAttributes {
  guildID!: bigint;
  guildName!: string;
  prefix!: string;
  tiktok!: boolean;
  nsfw!: boolean;
  leaderboard!: boolean;
  media!: boolean;

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
    nsfw: {
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
