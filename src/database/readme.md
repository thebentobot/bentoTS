# How to create the database
Run or copy the DDL file for your database

# How to make the models in the models folder

* Install sequelize-auto, both locally and globally

* Run the following in the command line of the project

```sequelize-auto -h [host address] -d [database name] -u [username] -p [port, default postgres is 5432]  --dialect [postgres is used for this project. Highly recommended to use postgres] -o [path to save models. For this project it's src/database/models] -t [all the tables to export to models] -l [language which is ts]```