import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { guild, guildId } from './guild'

export interface warningAttributes {
	warningCase?: number;
	userID: bigint;
	guildID: bigint;
	date?: Date;
	note?: string;
	actor: bigint;
	reason?: string;
}

export type warningPk = `warningCase`;
export type warningId = warning[warningPk];
export type warningCreationAttributes = Optional<warningAttributes, warningPk>;

export class warning extends Model<warningAttributes, warningCreationAttributes> implements warningAttributes {
	warningCase?: number
	userID!: bigint
	guildID!: bigint
	date?: Date
	note?: string
	actor!: bigint
	reason?: string

	// warning belongsTo guild via guildID
	guild!: guild
	getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>
	setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>
	createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>

	static initModel(sequelize: Sequelize.Sequelize): typeof warning {
		warning.init(
			{
				warningCase: {
					autoIncrement: true,
					type: DataTypes.BIGINT,
					allowNull: false,
					primaryKey: true,
				},
				userID: {
					type: DataTypes.BIGINT,
					allowNull: false,
				},
				guildID: {
					type: DataTypes.BIGINT,
					allowNull: false,
					references: {
						model: `guild`,
						key: `guildID`,
					},
				},
				date: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: Sequelize.Sequelize.fn(`now`),
				},
				note: {
					type: DataTypes.STRING,
					allowNull: true,
				},
				actor: {
					type: DataTypes.BIGINT,
					allowNull: false,
				},
				reason: {
					type: DataTypes.STRING,
					allowNull: true,
				},
			},
			{
				sequelize,
				tableName: `warning`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `warning_mutecase_uindex`,
						unique: true,
						fields: [{ name: `warningCase` }],
					},
					{
						name: `warning_pk`,
						unique: true,
						fields: [{ name: `warningCase` }],
					},
				],
			},
		)
		return warning
	}
}
