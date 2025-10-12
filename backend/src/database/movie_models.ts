import pool from './db.js'
import { type Movie } from '../Types/Types.js';








export const addMovie = async (title: string, genre: string = "", description: string = "", year: number = 0, length: string = "") => {

    const createMovieEntry = await pool.query(`
            INSERT INTO movies (title, key, genre, description, year, length)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `, [title, title, genre, description, year, length])
    
    .catch((e) => {
        console.log(e)
    })

    if(!createMovieEntry?.rows[0]){

        throw new Error("movie not added to the database");
    };

    console.log("28 addMovie", createMovieEntry.rows);

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
};


export const updateMovieDetails = async (movie: Movie) => {

    let { title, description, genre, year, id, length } = movie

    const updatedMovie = await pool.query(`
            UPDATE movies
            SET title = $1,
            description = $2,
            genre = $3,
            year = $4,
            length = $5
            WHERE id = $6
            RETURNING *
        `, [title, description, genre, year, length, id])
    .catch((err) => {

        console.log(err);

        throw new Error(`error updating database: ${err}`);
    })

    if(updatedMovie.rows[0]){

        return updatedMovie.rows[0]
    
    }else{

        return `error updating database`;
    }
};

export const increaseTimesPlayed = async (id: number) => {

        await pool.query(`
            UPDATE movies
            SET times_played = times_played + 1
            WHERE id = $1
        `, [id])

}