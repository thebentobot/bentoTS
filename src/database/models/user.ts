import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { bento, bentoCreationAttributes, bentoId } from './bento'
import type { guildMember, guildMemberId } from './guildMember'
import type { horoscope, horoscopeCreationAttributes, horoscopeId } from './horoscope'
import type { lastfm, lastfmCreationAttributes, lastfmId } from './lastfm'
import type { notificationMessage, notificationMessageId } from './notificationMessage'
import type { patreon, patreonId } from './patreon'
import type { profile, profileCreationAttributes, profileId } from './profile'
import type { reminder, reminderId } from './reminder'
import type { tag, tagId } from './tag'
import type { weather, weatherCreationAttributes, weatherId } from './weather'

export interface userAttributes {
	userID: bigint;
	discriminator: string;
	xp: number;
	level: number;
	username?: string;
	avatarURL?: string;
}

export type userPk = `userID`;
export type userId = user[userPk];
export type userCreationAttributes = Optional<userAttributes, userPk>;

export class user extends Model<userAttributes, userCreationAttributes> implements userAttributes {
	userID!: bigint
	discriminator!: string
	xp!: number
	level!: number
	username?: string
	avatarURL?: string

	// user hasOne bento via userID
	bento!: bento
	getBento!: Sequelize.HasOneGetAssociationMixin<bento>
	setBento!: Sequelize.HasOneSetAssociationMixin<bento, bentoId>
	createBento!: Sequelize.HasOneCreateAssociationMixin<bentoCreationAttributes>
	// user hasMany guildMember via userID
	guildMembers!: guildMember[]
	getGuildMembers!: Sequelize.HasManyGetAssociationsMixin<guildMember>
	setGuildMembers!: Sequelize.HasManySetAssociationsMixin<guildMember, guildMemberId>
	addGuildMember!: Sequelize.HasManyAddAssociationMixin<guildMember, guildMemberId>
	addGuildMembers!: Sequelize.HasManyAddAssociationsMixin<guildMember, guildMemberId>
	createGuildMember!: Sequelize.HasManyCreateAssociationMixin<guildMember>
	removeGuildMember!: Sequelize.HasManyRemoveAssociationMixin<guildMember, guildMemberId>
	removeGuildMembers!: Sequelize.HasManyRemoveAssociationsMixin<guildMember, guildMemberId>
	hasGuildMember!: Sequelize.HasManyHasAssociationMixin<guildMember, guildMemberId>
	hasGuildMembers!: Sequelize.HasManyHasAssociationsMixin<guildMember, guildMemberId>
	countGuildMembers!: Sequelize.HasManyCountAssociationsMixin
	// user hasOne horoscope via userID
	horoscope!: horoscope
	getHoroscope!: Sequelize.HasOneGetAssociationMixin<horoscope>
	setHoroscope!: Sequelize.HasOneSetAssociationMixin<horoscope, horoscopeId>
	createHoroscope!: Sequelize.HasOneCreateAssociationMixin<horoscopeCreationAttributes>
	// user hasOne lastfm via userID
	lastfm!: lastfm
	getLastfm!: Sequelize.HasOneGetAssociationMixin<lastfm>
	setLastfm!: Sequelize.HasOneSetAssociationMixin<lastfm, lastfmId>
	createLastfm!: Sequelize.HasOneCreateAssociationMixin<lastfmCreationAttributes>
	// user hasMany notificationMessage via userID
	notificationMessages!: notificationMessage[]
	getNotificationMessages!: Sequelize.HasManyGetAssociationsMixin<notificationMessage>
	setNotificationMessages!: Sequelize.HasManySetAssociationsMixin<notificationMessage, notificationMessageId>
	addNotificationMessage!: Sequelize.HasManyAddAssociationMixin<notificationMessage, notificationMessageId>
	addNotificationMessages!: Sequelize.HasManyAddAssociationsMixin<notificationMessage, notificationMessageId>
	createNotificationMessage!: Sequelize.HasManyCreateAssociationMixin<notificationMessage>
	removeNotificationMessage!: Sequelize.HasManyRemoveAssociationMixin<notificationMessage, notificationMessageId>
	removeNotificationMessages!: Sequelize.HasManyRemoveAssociationsMixin<notificationMessage, notificationMessageId>
	hasNotificationMessage!: Sequelize.HasManyHasAssociationMixin<notificationMessage, notificationMessageId>
	hasNotificationMessages!: Sequelize.HasManyHasAssociationsMixin<notificationMessage, notificationMessageId>
	countNotificationMessages!: Sequelize.HasManyCountAssociationsMixin
	// user hasMany patreon via userID
	patreons!: patreon[]
	getPatreons!: Sequelize.HasManyGetAssociationsMixin<patreon>
	setPatreons!: Sequelize.HasManySetAssociationsMixin<patreon, patreonId>
	addPatreon!: Sequelize.HasManyAddAssociationMixin<patreon, patreonId>
	addPatreons!: Sequelize.HasManyAddAssociationsMixin<patreon, patreonId>
	createPatreon!: Sequelize.HasManyCreateAssociationMixin<patreon>
	removePatreon!: Sequelize.HasManyRemoveAssociationMixin<patreon, patreonId>
	removePatreons!: Sequelize.HasManyRemoveAssociationsMixin<patreon, patreonId>
	hasPatreon!: Sequelize.HasManyHasAssociationMixin<patreon, patreonId>
	hasPatreons!: Sequelize.HasManyHasAssociationsMixin<patreon, patreonId>
	countPatreons!: Sequelize.HasManyCountAssociationsMixin
	// user hasOne profile via userID
	profile!: profile
	getProfile!: Sequelize.HasOneGetAssociationMixin<profile>
	setProfile!: Sequelize.HasOneSetAssociationMixin<profile, profileId>
	createProfile!: Sequelize.HasOneCreateAssociationMixin<profileCreationAttributes>
	// user hasMany reminder via userID
	reminders!: reminder[]
	getReminders!: Sequelize.HasManyGetAssociationsMixin<reminder>
	setReminders!: Sequelize.HasManySetAssociationsMixin<reminder, reminderId>
	addReminder!: Sequelize.HasManyAddAssociationMixin<reminder, reminderId>
	addReminders!: Sequelize.HasManyAddAssociationsMixin<reminder, reminderId>
	createReminder!: Sequelize.HasManyCreateAssociationMixin<reminder>
	removeReminder!: Sequelize.HasManyRemoveAssociationMixin<reminder, reminderId>
	removeReminders!: Sequelize.HasManyRemoveAssociationsMixin<reminder, reminderId>
	hasReminder!: Sequelize.HasManyHasAssociationMixin<reminder, reminderId>
	hasReminders!: Sequelize.HasManyHasAssociationsMixin<reminder, reminderId>
	countReminders!: Sequelize.HasManyCountAssociationsMixin
	// user hasMany tag via userID
	tags!: tag[]
	getTags!: Sequelize.HasManyGetAssociationsMixin<tag>
	setTags!: Sequelize.HasManySetAssociationsMixin<tag, tagId>
	addTag!: Sequelize.HasManyAddAssociationMixin<tag, tagId>
	addTags!: Sequelize.HasManyAddAssociationsMixin<tag, tagId>
	createTag!: Sequelize.HasManyCreateAssociationMixin<tag>
	removeTag!: Sequelize.HasManyRemoveAssociationMixin<tag, tagId>
	removeTags!: Sequelize.HasManyRemoveAssociationsMixin<tag, tagId>
	hasTag!: Sequelize.HasManyHasAssociationMixin<tag, tagId>
	hasTags!: Sequelize.HasManyHasAssociationsMixin<tag, tagId>
	countTags!: Sequelize.HasManyCountAssociationsMixin
	// user hasOne weather via userID
	weather!: weather
	getWeather!: Sequelize.HasOneGetAssociationMixin<weather>
	setWeather!: Sequelize.HasOneSetAssociationMixin<weather, weatherId>
	createWeather!: Sequelize.HasOneCreateAssociationMixin<weatherCreationAttributes>

	static initModel(sequelize: Sequelize.Sequelize): typeof user {
		user.init(
			{
				userID: {
					type: DataTypes.BIGINT,
					allowNull: false,
					primaryKey: true,
				},
				discriminator: {
					type: DataTypes.STRING,
					allowNull: false,
				},
				xp: {
					type: DataTypes.INTEGER,
					allowNull: false,
				},
				level: {
					type: DataTypes.INTEGER,
					allowNull: false,
				},
				username: {
					type: DataTypes.STRING,
					allowNull: true,
				},
				avatarURL: {
					type: DataTypes.STRING,
					allowNull: true,
				},
			},
			{
				sequelize,
				tableName: `user`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `user_pk`,
						unique: true,
						fields: [{ name: `userID` }],
					},
					{
						name: `user_userid_uindex`,
						unique: true,
						fields: [{ name: `userID` }],
					},
				],
			},
		)
		return user
	}
}
