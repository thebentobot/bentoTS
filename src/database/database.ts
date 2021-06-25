import { Sequelize } from 'sequelize';
import * as dotenv from "dotenv";
dotenv.config();

const database = new Sequelize(process.env.postgreSQL, {
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: false
});

export default database;