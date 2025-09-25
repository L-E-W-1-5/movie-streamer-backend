import pool from './db.js'


export const addMovie = async (title: string, url: string, genre: string) => {

    const createMovieEntry = await pool.query(`
            INSERT INTO movies (title, url, genre)
            VALUES ($1, $2, $3)
            RETURNING *;
        `, [title, url, genre]);


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


export const deleteMovie = async (id: string) => {

    const movie = await pool.query(`
            DELETE FROM movies
            WHERE id = $1
            RETURNING *
        `, [id])

    console.log(deleteMovie)

    if(!movie.rows[0]){

        throw new Error("movie not deleted from database");
    }

    return movie.rows[0];
}