import pool from './db.js'


export const addMovie = async (title: string, url: string, genre: string) => {

    const createMovieEntry = await pool.query(`
            INSERT INTO movies (title, url, genre)
            VALUES ($1, $2, $3)
            RETURNING *;
        `, [title, url, genre]);

    console.log(createMovieEntry)

    return createMovieEntry.rows[0];
};


export const getMovies = async () => {

    const allMovies = await pool.query(`
            SELECT * 
            FROM movies
        `)

    return allMovies.rows;
};