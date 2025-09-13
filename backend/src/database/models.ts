import pool from './db.js'


export const addMovie = async (title: string, url: string, genre: string) => {

    const createMovieEntry = await pool.query(`
            INSERT INTO movies (name, url, genre)
            VALUES ($1, $2, $3)
            RETURNING *;
        `, [title, url, genre]);

    console.log(createMovieEntry)

    return createMovieEntry.rows[0];
}


export const getMovies = async () => {
//console.log("allmovies")
    const allMovies = await pool.query(`
            SELECT * FROM movies
        `)

    //console.log(allMovies.rows)

    return allMovies.rows;
}