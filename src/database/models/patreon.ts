import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { user, userId } from './user'

export interface patreonAttributes {
	id?: number;
	userID: bigint;
	name?: string;
	avatar?: string;
	supporter: boolean;
	follower: boolean;
	enthusiast: boolean;
	disciple: boolean;
	sponsor: boolean;
	emoteSlot1?: string;
	emoteSlot2?: string;
	emoteSlot3?: string;
	emoteSlot4?: string;
}

export type patreonPk = `id`;
export type patreonId = patreon[patreonPk];
export type patreonCreationAttributes = Optional<patreonAttributes, patreonPk>;

export class patreon extends Model<patreonAttributes, patreonCreationAttributes> implements patreonAttributes {
	id?: number
	userID!: bigint
	name?: string
	avatar?: string
	supporter!: boolean
	follower!: boolean
	enthusiast!: boolean
	disciple!: boolean
	sponsor!: boolean
	emoteSlot1?: string
	emoteSlot2?: string
	emoteSlot3?: string
	emoteSlot4?: string

	// patreon belongsTo user via userID
	user!: user
	getUser!: Sequelize.BelongsToGetAssociationMixin<user>
	setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>
	createUser!: Sequelize.BelongsToCreateAssociationMixin<user>

	static initModel(sequelize: Sequelize.Sequelize): typeof patreon {
		patreon.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				userID: {
					type: DataTypes.BIGINT,
					allowNull: false,
					references: {
						model: `user`,
						key: `userID`,
					},
				},
				name: {
					type: DataTypes.STRING,
					allowNull: true,
				},
				avatar: {
					type: DataTypes.STRING,
					allowNull: true,
				},
				supporter: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
				},
				follower: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
				},
				enthusiast: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
				},
				disciple: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
				},
				sponsor: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
				},
				emoteSlot1: {
					type: DataTypes.STRING,
					allowNull: true,
				},
				emoteSlot2: {
					type: DataTypes.STRING,
					allowNull: true,
				},
				emoteSlot3: {
					type: DataTypes.STRING,
					allowNull: true,
				},
				emoteSlot4: {
					type: DataTypes.STRING,
					allowNull: true,
				},
			},
			{
				sequelize,
				tableName: `patreon`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `patreon_id_uindex`,
						unique: true,
						fields: [{ name: `id` }],
					},
					{
						name: `patreon_pk`,
						unique: true,
						fields: [{ name: `id` }],
					},
					{
						name: `patreon_userid_uindex`,
						unique: true,
						fields: [{ name: `userID` }],
					},
				],
			},
		)
		return patreon
	}
}
