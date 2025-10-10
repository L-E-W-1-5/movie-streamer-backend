import pool from './db.js'


export async function createMovieTable() {

    try{
            //TODO: not updated yet
        await pool.query(
            `CREATE TABLE IF NOT EXISTS movies (
            id SERIAL PRIMARY KEY, 
            title VARCHAR(255) NOT NULL,
            description VARCHAR,
            length VARCHAR,
            year INTEGER,
            genre VARCHAR(50),
            timestamp TIMESTAMP DEFAULT NOW(),
            times_played INTEGER DEFAULT 0 
            );`
        );

    }catch(err){

        console.log(err)
    }
};


export const createUsersTable = async() => {

    try{

        await pool.query(
            `CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                guid VARCHAR,
                is_admin BOOLEAN DEFAULT FALSE,
                is_verified BOOLEAN DEFAULT FALSE,
                pin_number VARCHAR(4),
                is_loggedin BOOLEAN DEFAULT FALSE,
                login_attempts INTEGER DEFAULT 0,
                time_created TIMESTAMP DEFAULT NOW(),
                last_login TIMESTAMP
            );`
        )

    }catch(err){

        console.log(err)
    }
}


export const createMessagesTable = async () => {

    try{

        await pool.query(
            `CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255),
                userid VARCHAR(255),
                timestamp VARCHAR(30),
                message TEXT
            );`
        );
    }catch(err){

        console.log(err);
    }
};


export const dropTable = async (table:string) => {

console.log("drop table")

    try{

        await pool.query(`
                DROP TABLE ${table}   
            `)

    }catch(err){

        console.log(err)
    }
}


export async function checkTableExists(table: string) {

    const result = await pool.query(`
        SELECT to_regclass('public.${table}') AS table_exists;
    `);

    if (result.rows[0].table_exists) {

        console.log('Table exists!');

        return true;

    } else {

        console.log('Table does not exist.');

        return false;
    }
}