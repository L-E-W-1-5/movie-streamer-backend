import pool from './db.js'


export const addMovie = async (title: string, genre: string = "", description: string = "", year: number = 0, length: string = "") => {



    const createMovieEntry = await pool.query(`
            INSERT INTO movies (title, genre, description, year, length)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `, [title, genre, description, year, length])
    
    .catch((e) => {
        console.log(e)
    })

    if(!createMovieEntry?.rows[0]){

        throw new Error("movie not added to the database");
    };

    console.log(createMovieEntry.rows);

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