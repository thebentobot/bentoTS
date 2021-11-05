import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { guild, guildId } from './guild'

export interface roleMessagesAttributes {
	guildID: bigint;
	messageID?: bigint;
	message?: string;
}

export type roleMessagesPk = `guildID`;
export type roleMessagesId = roleMessages[roleMessagesPk];
export type roleMessagesCreationAttributes = Optional<roleMessagesAttributes, roleMessagesPk>;

export class roleMessages
	extends Model<roleMessagesAttributes, roleMessagesCreationAttributes>
	implements roleMessagesAttributes
{
	guildID!: bigint
	messageID?: bigint
	message?: string

	// roleMessages belongsTo guild via guildID
	guild!: guild
	getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>
	setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>
	createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>

	static initModel(sequelize: Sequelize.Sequelize): typeof roleMessages {
		roleMessages.init(
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
				messageID: {
					type: DataTypes.BIGINT,
					allowNull: true,
				},
				message: {
					type: DataTypes.STRING,
					allowNull: true,
				},
			},
			{
				sequelize,
				tableName: `roleMessages`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `rolemessages_pk`,
						unique: true,
						fields: [{ name: `guildID` }],
					},
				],
			},
		)
		return roleMessages
	}
}
