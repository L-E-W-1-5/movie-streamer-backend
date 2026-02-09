import pool from './db.js'
import { type Movie } from '../Types/Types.js';

type MovieData = {
    id: number,
    key: number,
    title: string,
    description: string,
    length: string,
    year: number,
    genre: string,
    timestamp: Date,
    times_played: number,
    images: ImageData[]
}
    

type ImageData = {
    id: number,
    filename: string,
    mime_type: string,
    buffer: string
}



export const addMovie = async (title: string, key: string, genre: string = "", description: string = "", year: number = 1, length: string = "") => {

    console.log(typeof year, year);
    
//change this so that if the movie is in a folder, the key will be the file path and the title will remailn the same
    const createMovieEntry = await pool.query(`
            INSERT INTO movies (title, key, genre, description, year, length)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `, [title, key, genre, description, year, length])
    
    .catch((e) => {

        console.log("model addMovie 20", e)

        throw new Error("movie not added to the database");
    })

// do i need this?
    if(!createMovieEntry?.rows[0]){

        throw new Error("movie not added to the database");
    };

    console.log("28 addMovie", createMovieEntry.rows);

    return createMovieEntry.rows[0];
};


export const addImage = async (movieId: number, key: string, url: string, mimeType: string, title: string, originalName: string) => {

    console.log(url)


    const createImageEntry = await pool.query(`
            INSERT INTO images (movie_id, key, url, mime_type, title, original_name)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [movieId, key, url, mimeType, title, originalName])
    
    .catch((err) => {

        console.log(err);

        throw new Error("Image not added to database")
    })

    return createImageEntry.rows[0]
};


export const deleteImage = async (imageId: number) => {

    const deleteImageEntry = await pool.query(`
            DELETE FROM images
            WHERE id = $1
            RETURNING *
        `, [imageId])
    
    .catch((err) => {

        console.log(err)

        throw new Error("Image not deleted from database", err)
    })

    console.log(deleteImageEntry.rows)

    return deleteImageEntry.rows[0]
}


export const getMovies = async () => {

    const allMovies = await pool.query(`
            SELECT * 
            FROM movies
        `);

    const gptQuery = await pool.query(`
        SELECT movies.*,
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', images.id,
                        'key', images.key,
                        'mime_type', images.mime_type,
                        'url', images.url,
                        'movie_title', images.title,
                        'original_name', images.original_name
                    )
                ) 
                FILTER (WHERE images.id IS NOT NULL),
                '[]'
            ) AS images
            FROM movies
            LEFT JOIN images ON movies.id = images.movie_id
            GROUP BY movies.id
        `)

    //console.log("gpt query data", gptQuery.rows)

    
    if(!allMovies.rows[0]){
        
        throw new Error("movies not loaded");
    }

    //console.log(gptQuery.rows)

    // for(let i = 0; i < gptQuery.rows.length; i++){

    //     //console.log("allMovieRows", i, gptQuery.rows[i])

    //     if(gptQuery.rows[i].images && gptQuery.rows[i].images.length > 0){

    //         const bufferSplit = gptQuery.rows[i].images[0].buffer.slice(2)

    //         const bufferTest = gptQuery.rows[i].images[0].buffer.slice(2)

    //         //console.log(bufferSplit)

    //         const base64Image = bufferSplit.toString('base64')
            
    //         console.log(i, base64Image.substring(0, 20))

    //         gptQuery.rows[i].images[0].buffer = `data:image/jpeg;base64,${bufferTest}`;
    //     }
        
    // }
    
    // console.log(gptQuery.rows)


    return gptQuery.rows;
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