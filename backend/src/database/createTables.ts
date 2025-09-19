import pool from './db.js'


export async function createMovieTable() {

    try{

        await pool.query(
            `CREATE TABLE IF NOT EXISTS movies (
            id SERIAL PRIMARY KEY, 
            title VARCHAR(255) NOT NULL, 
            url TEXT NOT NULL, 
            genre VARCHAR(50)
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
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                guid UUID,
                is_admin BOOLEAN DEFAULT FALSE,
                is_verified BOOLEAN DEFAULT FALSE
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


export const dropTable = async () => {

console.log("drop table")

    try{

        await pool.query(`
                DROP TABLE movies   
            `)

    }catch(err){
        console.log(err)
    }
}


export async function checkTableExists() {

    const result = await pool.query(`
        SELECT to_regclass('public.movies') AS table_exists;
    `);

    if (result.rows[0].table_exists) {

        console.log('Table exists!');
    } else {

        console.log('Table does not exist.');
    }
}