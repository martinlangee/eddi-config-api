# EDDI Config API - a WBS Final Project

Server-Side module of the EDDI Configurator web site. Web site project on GitHub: [https://github.com/martinlangee/eddi-configurator](https://github.com/martinlangee/eddi-configurator).

To run the project locally, you have to run a PostgreSQL instance with a DB called "eddi_db". The tables are created automatically. Enter the DB credentials in the "db.js" file.

To get an impression of the UI go to http://eddi-configurator.netlify.app/.

## Packages

Following packages must be installed after first git pull before first start:

#### `npm i express`

#### `npm i pg`

#### `npm i nodemon`

#### `npm i http-status-codes`

## Database

PostgreSQL database is used.

Start PostgrSQL command line and use following commands to prepare initial DB content:

#### `CREATE DATABASE EDDI_DB;`

#### `/c`

#### `CreateDB.sql`

If some sample data shall be inserted for a start:

#### `CreateData.sql`

## Test

#### `nodemon app.js`

Currently using Postman for testing the API.

## ToDo's
