import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { user, userId } from './user'

export interface reminderAttributes {
	id?: number;
	userID: bigint;
	date?: Date;
	reminder: string;
}

export type reminderPk = `id`;
export type reminderId = reminder[reminderPk];
export type reminderCreationAttributes = Optional<reminderAttributes, reminderPk>;

export class reminder extends Model<reminderAttributes, reminderCreationAttributes> implements reminderAttributes {
	id?: number
	userID!: bigint
	date?: Date
	reminder!: string

	// reminder belongsTo user via userID
	user!: user
	getUser!: Sequelize.BelongsToGetAssociationMixin<user>
	setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>
	createUser!: Sequelize.BelongsToCreateAssociationMixin<user>

	static initModel(sequelize: Sequelize.Sequelize): typeof reminder {
		reminder.init(
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
				date: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: Sequelize.Sequelize.fn(`now`),
				},
				reminder: {
					type: DataTypes.STRING,
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: `reminder`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `reminder_id_uindex`,
						unique: true,
						fields: [{ name: `id` }],
					},
					{
						name: `reminder_pk`,
						unique: true,
						fields: [{ name: `id` }],
					},
				],
			},
		)
		return reminder
	}
}
