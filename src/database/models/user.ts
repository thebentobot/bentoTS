import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { ban, banId } from './ban';
import type { bento, bentoCreationAttributes, bentoId } from './bento';
import type { guildMember, guildMemberId } from './guildMember';
import type { horoscope, horoscopeCreationAttributes, horoscopeId } from './horoscope';
import type { kick, kickId } from './kick';
import type { lastfm, lastfmCreationAttributes, lastfmId } from './lastfm';
import type { mute, muteId } from './mute';
import type { tag, tagId } from './tag';
import type { warning, warningId } from './warning';
import type { weather, weatherCreationAttributes, weatherId } from './weather';

export interface userAttributes {
  userID: bigint;
  discriminator: string;
  xp: number;
  level: number;
  username?: string;
}

export type userPk = "userID";
export type userId = user[userPk];
export type userCreationAttributes = Optional<userAttributes, userPk>;

export class user extends Model<userAttributes, userCreationAttributes> implements userAttributes {
  userID!: bigint;
  discriminator!: string;
  xp!: number;
  level!: number;
  username?: string;

  // user hasMany ban via userID
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
  // user hasMany ban via actor
  actor_bans!: ban[];
  getActor_bans!: Sequelize.HasManyGetAssociationsMixin<ban>;
  setActor_bans!: Sequelize.HasManySetAssociationsMixin<ban, banId>;
  addActor_ban!: Sequelize.HasManyAddAssociationMixin<ban, banId>;
  addActor_bans!: Sequelize.HasManyAddAssociationsMixin<ban, banId>;
  createActor_ban!: Sequelize.HasManyCreateAssociationMixin<ban>;
  removeActor_ban!: Sequelize.HasManyRemoveAssociationMixin<ban, banId>;
  removeActor_bans!: Sequelize.HasManyRemoveAssociationsMixin<ban, banId>;
  hasActor_ban!: Sequelize.HasManyHasAssociationMixin<ban, banId>;
  hasActor_bans!: Sequelize.HasManyHasAssociationsMixin<ban, banId>;
  countActor_bans!: Sequelize.HasManyCountAssociationsMixin;
  // user hasOne bento via userID
  bento!: bento;
  getBento!: Sequelize.HasOneGetAssociationMixin<bento>;
  setBento!: Sequelize.HasOneSetAssociationMixin<bento, bentoId>;
  createBento!: Sequelize.HasOneCreateAssociationMixin<bentoCreationAttributes>;
  // user hasMany guildMember via userID
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
  // user hasOne horoscope via userID
  horoscope!: horoscope;
  getHoroscope!: Sequelize.HasOneGetAssociationMixin<horoscope>;
  setHoroscope!: Sequelize.HasOneSetAssociationMixin<horoscope, horoscopeId>;
  createHoroscope!: Sequelize.HasOneCreateAssociationMixin<horoscopeCreationAttributes>;
  // user hasMany kick via userID
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
  // user hasMany kick via actor
  actor_kicks!: kick[];
  getActor_kicks!: Sequelize.HasManyGetAssociationsMixin<kick>;
  setActor_kicks!: Sequelize.HasManySetAssociationsMixin<kick, kickId>;
  addActor_kick!: Sequelize.HasManyAddAssociationMixin<kick, kickId>;
  addActor_kicks!: Sequelize.HasManyAddAssociationsMixin<kick, kickId>;
  createActor_kick!: Sequelize.HasManyCreateAssociationMixin<kick>;
  removeActor_kick!: Sequelize.HasManyRemoveAssociationMixin<kick, kickId>;
  removeActor_kicks!: Sequelize.HasManyRemoveAssociationsMixin<kick, kickId>;
  hasActor_kick!: Sequelize.HasManyHasAssociationMixin<kick, kickId>;
  hasActor_kicks!: Sequelize.HasManyHasAssociationsMixin<kick, kickId>;
  countActor_kicks!: Sequelize.HasManyCountAssociationsMixin;
  // user hasOne lastfm via userID
  lastfm!: lastfm;
  getLastfm!: Sequelize.HasOneGetAssociationMixin<lastfm>;
  setLastfm!: Sequelize.HasOneSetAssociationMixin<lastfm, lastfmId>;
  createLastfm!: Sequelize.HasOneCreateAssociationMixin<lastfmCreationAttributes>;
  // user hasMany mute via userID
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
  // user hasMany mute via actor
  actor_mutes!: mute[];
  getActor_mutes!: Sequelize.HasManyGetAssociationsMixin<mute>;
  setActor_mutes!: Sequelize.HasManySetAssociationsMixin<mute, muteId>;
  addActor_mute!: Sequelize.HasManyAddAssociationMixin<mute, muteId>;
  addActor_mutes!: Sequelize.HasManyAddAssociationsMixin<mute, muteId>;
  createActor_mute!: Sequelize.HasManyCreateAssociationMixin<mute>;
  removeActor_mute!: Sequelize.HasManyRemoveAssociationMixin<mute, muteId>;
  removeActor_mutes!: Sequelize.HasManyRemoveAssociationsMixin<mute, muteId>;
  hasActor_mute!: Sequelize.HasManyHasAssociationMixin<mute, muteId>;
  hasActor_mutes!: Sequelize.HasManyHasAssociationsMixin<mute, muteId>;
  countActor_mutes!: Sequelize.HasManyCountAssociationsMixin;
  // user hasMany tag via userID
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
  // user hasMany warning via userID
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
  // user hasMany warning via actor
  actor_warnings!: warning[];
  getActor_warnings!: Sequelize.HasManyGetAssociationsMixin<warning>;
  setActor_warnings!: Sequelize.HasManySetAssociationsMixin<warning, warningId>;
  addActor_warning!: Sequelize.HasManyAddAssociationMixin<warning, warningId>;
  addActor_warnings!: Sequelize.HasManyAddAssociationsMixin<warning, warningId>;
  createActor_warning!: Sequelize.HasManyCreateAssociationMixin<warning>;
  removeActor_warning!: Sequelize.HasManyRemoveAssociationMixin<warning, warningId>;
  removeActor_warnings!: Sequelize.HasManyRemoveAssociationsMixin<warning, warningId>;
  hasActor_warning!: Sequelize.HasManyHasAssociationMixin<warning, warningId>;
  hasActor_warnings!: Sequelize.HasManyHasAssociationsMixin<warning, warningId>;
  countActor_warnings!: Sequelize.HasManyCountAssociationsMixin;
  // user hasOne weather via userID
  weather!: weather;
  getWeather!: Sequelize.HasOneGetAssociationMixin<weather>;
  setWeather!: Sequelize.HasOneSetAssociationMixin<weather, weatherId>;
  createWeather!: Sequelize.HasOneCreateAssociationMixin<weatherCreationAttributes>;

  static initModel(sequelize: Sequelize.Sequelize): typeof user {
    user.init({
    userID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    discriminator: {
      type: DataTypes.STRING,
      allowNull: false
    },
    xp: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'user',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "user_pk",
        unique: true,
        fields: [
          { name: "userID" },
        ]
      },
      {
        name: "user_userid_uindex",
        unique: true,
        fields: [
          { name: "userID" },
        ]
      },
    ]
  });
  return user;
  }
}
