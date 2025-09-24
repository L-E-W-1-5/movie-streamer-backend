import pool from './db.js'


export const addMovie = async (title: string, url: string, genre: string) => {

    const createMovieEntry = await pool.query(`
            INSERT INTO movies (title, url, genre)
            VALUES ($1, $2, $3)
            RETURNING *;
        `, [title, url, genre]);

    console.log(createMovieEntry)
    if(!createMovieEntry.rows[0]){

        throw new Error("movie not added to the database");
    };

    return createMovieEntry.rows[0];
};


export const getMovies = async () => {

    const allMovies = await pool.query(`
            SELECT * 
            FROM movies
        `);

    if(!allMovies.rows[0]){

        throw new Error("movies not loaded");
    }

    return allMovies.rows;
};