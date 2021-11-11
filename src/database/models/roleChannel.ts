import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { guild, guildId } from './guild'

export interface roleChannelAttributes {
	guildID: bigint;
	channelID: bigint;
}

export type roleChannelPk = `guildID`;
export type roleChannelId = roleChannel[roleChannelPk];
export type roleChannelCreationAttributes = Optional<roleChannelAttributes, roleChannelPk>;

export class roleChannel
	extends Model<roleChannelAttributes, roleChannelCreationAttributes>
	implements roleChannelAttributes
{
	guildID!: bigint
	channelID!: bigint

	// roleChannel belongsTo guild via guildID
	guild!: guild
	getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>
	setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>
	createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>

	static initModel(sequelize: Sequelize.Sequelize): typeof roleChannel {
		roleChannel.init(
			{
				guildID: {
					type: DataTypes.BIGINT,
					allowNull: false,
					primaryKey: true,
					references: {
						model: `guild`,
						key: `guildID`,
					},
				},
				channelID: {
					type: DataTypes.BIGINT,
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: `roleChannel`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `rolechannel_channelid_uindex`,
						unique: true,
						fields: [{ name: `channelID` }],
					},
					{
						name: `rolechannel_guildid_uindex`,
						unique: true,
						fields: [{ name: `guildID` }],
					},
					{
						name: `rolechannel_pk`,
						unique: true,
						fields: [{ name: `guildID` }],
					},
				],
			},
		)
		return roleChannel
	}
}
