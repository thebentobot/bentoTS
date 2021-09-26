import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { user, userId } from './user';

export interface profileAttributes {
  userID: bigint;
  lastfmBoard?: boolean;
  xpBoard?: boolean;
  backgroundUrl?: string;
  BackgroundColourOpacity?: number;
  backgroundColour?: string;
  descriptionColourOpacity?: number;
  descriptionColour?: string;
  overlayOpacity?: number;
  overlayColour?: string;
  usernameColour?: string;
  discriminatorColour?: string;
  sidebarItemServerColour?: string;
  sidebarItemGlobalColour?: string;
  sidebarItemBentoColour?: string;
  sidebarItemTimezoneColour?: string;
  sidebarValueServerColour?: string;
  sidebarValueGlobalColour?: string;
  sidebarValueBentoColour?: string;
  sidebarOpacity?: number;
  sidebarColour?: string;
  sidebarBlur?: number;
  fmDivBGOpacity?: number;
  fmDivBGColour?: string;
  fmSongTextOpacity?: number;
  fmSongTextColour?: string;
  fmArtistTextOpacity?: number;
  fmArtistTextColour?: string;
  xpDivBGOpacity?: number;
  xpDivBGColour?: string;
  xpTextOpacity?: number;
  xpTextColour?: string;
  xpText2Opacity?: number;
  xpText2Colour?: string;
  xpDoneServerColour1Opacity?: number;
  xpDoneServerColour1?: string;
  xpDoneServerColour2Opacity?: number;
  xpDoneServerColour2?: string;
  xpDoneServerColour3Opacity?: number;
  xpDoneServerColour3?: string;
  xpDoneGlobalColour1Opacity?: number;
  xpDoneGlobalColour1?: string;
  xpDoneGlobalColour2Opacity?: number;
  xpDoneGlobalColour2?: string;
  xpDoneGlobalColour3Opacity?: number;
  xpDoneGlobalColour3?: string;
  description?: string;
  timezone?: string;
  birthday?: string;
  xpBarOpacity?: number;
  xpBarColour?: string;
  xpBar2Opacity?: number;
  xpBar2Colour?: string;
}

export type profilePk = "userID";
export type profileId = profile[profilePk];
export type profileCreationAttributes = Optional<profileAttributes, profilePk>;

export class profile extends Model<profileAttributes, profileCreationAttributes> implements profileAttributes {
  userID!: bigint;
  lastfmBoard?: boolean;
  xpBoard?: boolean;
  backgroundUrl?: string;
  BackgroundColourOpacity?: number;
  backgroundColour?: string;
  descriptionColourOpacity?: number;
  descriptionColour?: string;
  overlayOpacity?: number;
  overlayColour?: string;
  usernameColour?: string;
  discriminatorColour?: string;
  sidebarItemServerColour?: string;
  sidebarItemGlobalColour?: string;
  sidebarItemBentoColour?: string;
  sidebarItemTimezoneColour?: string;
  sidebarValueServerColour?: string;
  sidebarValueGlobalColour?: string;
  sidebarValueBentoColour?: string;
  sidebarOpacity?: number;
  sidebarColour?: string;
  sidebarBlur?: number;
  fmDivBGOpacity?: number;
  fmDivBGColour?: string;
  fmSongTextOpacity?: number;
  fmSongTextColour?: string;
  fmArtistTextOpacity?: number;
  fmArtistTextColour?: string;
  xpDivBGOpacity?: number;
  xpDivBGColour?: string;
  xpTextOpacity?: number;
  xpTextColour?: string;
  xpText2Opacity?: number;
  xpText2Colour?: string;
  xpDoneServerColour1Opacity?: number;
  xpDoneServerColour1?: string;
  xpDoneServerColour2Opacity?: number;
  xpDoneServerColour2?: string;
  xpDoneServerColour3Opacity?: number;
  xpDoneServerColour3?: string;
  xpDoneGlobalColour1Opacity?: number;
  xpDoneGlobalColour1?: string;
  xpDoneGlobalColour2Opacity?: number;
  xpDoneGlobalColour2?: string;
  xpDoneGlobalColour3Opacity?: number;
  xpDoneGlobalColour3?: string;
  description?: string;
  timezone?: string;
  birthday?: string;
  xpBarOpacity?: number;
  xpBarColour?: string;
  xpBar2Opacity?: number;
  xpBar2Colour?: string;

  // profile belongsTo user via userID
  user!: user;
  getUser!: Sequelize.BelongsToGetAssociationMixin<user>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<user>;

  static initModel(sequelize: Sequelize.Sequelize): typeof profile {
    profile.init({
    userID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'user',
        key: 'userID'
      }
    },
    lastfmBoard: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    xpBoard: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    backgroundUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    BackgroundColourOpacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    backgroundColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    descriptionColourOpacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    descriptionColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    overlayOpacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    overlayColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    usernameColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    discriminatorColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sidebarItemServerColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sidebarItemGlobalColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sidebarItemBentoColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sidebarItemTimezoneColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sidebarValueServerColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sidebarValueGlobalColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sidebarValueBentoColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sidebarOpacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sidebarColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sidebarBlur: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fmDivBGOpacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fmDivBGColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fmSongTextOpacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fmSongTextColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fmArtistTextOpacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fmArtistTextColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    xpDivBGOpacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    xpDivBGColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    xpTextOpacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    xpTextColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    xpText2Opacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    xpText2Colour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    xpDoneServerColour1Opacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    xpDoneServerColour1: {
      type: DataTypes.STRING,
      allowNull: true
    },
    xpDoneServerColour2Opacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    xpDoneServerColour2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    xpDoneServerColour3Opacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    xpDoneServerColour3: {
      type: DataTypes.STRING,
      allowNull: true
    },
    xpDoneGlobalColour1Opacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    xpDoneGlobalColour1: {
      type: DataTypes.STRING,
      allowNull: true
    },
    xpDoneGlobalColour2Opacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    xpDoneGlobalColour2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    xpDoneGlobalColour3Opacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    xpDoneGlobalColour3: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    birthday: {
      type: DataTypes.STRING,
      allowNull: true
    },
    xpBarOpacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    xpBarColour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    xpBar2Opacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    xpBar2Colour: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'profile',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "profile_pk",
        unique: true,
        fields: [
          { name: "userID" },
        ]
      },
      {
        name: "profile_userid_uindex",
        unique: true,
        fields: [
          { name: "userID" },
        ]
      },
    ]
  });
  return profile;
  }
}
