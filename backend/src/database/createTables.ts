import pool from './db.js'


export async function createMovieTable() {

    try{

        await pool.query(
            `CREATE TABLE IF NOT EXISTS movies (
            id SERIAL PRIMARY KEY, 
            name VARCHAR(255) NOT NULL, 
            url TEXT NOT NULL, 
            genre VARCHAR(50)
            );`
        );

    }catch(err){

        console.log(err)
    }
};


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