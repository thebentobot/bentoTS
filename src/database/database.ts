import { Sequelize } from 'sequelize'
import * as dotenv from 'dotenv'
dotenv.config()

const database = new Sequelize(
	process.env.DBdatabase as string,
	process.env.DBusername as string,
	process.env.DBpassword as string,
	{
		host: process.env.host as string,
		port: 5432,
		dialect: `postgres`,
		pool: {
			max: 5,
			min: 0,
			acquire: 30000,
			idle: 10000,
		},
		logging: false,
	},
)

export default database
