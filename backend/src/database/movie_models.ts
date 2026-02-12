import pool from './db.js'
import express, { type Express, type Request, type Response , type Application } from 'express';
import { type Movie, type Images } from '../Types/Types.js';

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

    return {
        payload: deleteImageEntry.rows[0],
        status: "success"
    }
}


export const getMovies = async () => {

    const gptQuery = await pool.query(`
        SELECT movies.*,
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', images.id,
                        'key', images.key,
                        'mime_type', images.mime_type,
                        'movie_title', images.title,
                        'original_name', images.original_name,
                        'movie_id', images.movie_id,
                        'url', images.url
                    )
                ) 
                FILTER (WHERE images.id IS NOT NULL),
                '[]'
            ) AS images
            FROM movies
            LEFT JOIN images ON movies.id = images.movie_id
            GROUP BY movies.id
        `)

    if(!gptQuery.rows[0]){
        
        throw new Error("movies not loaded");
    }

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


export const updateMovieDetails = async (title: string, description: string = "", genre: string = "", year: number = 1, id: number, length: string = "") => {


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


export const addToDatabase = async (req: Request, filePath: string | null = null, imageLocations: Images[] | []) => {

  let { title, genre, description, year, length } = req.body;

  let key: string = title;

  if(filePath){

    key = filePath;
  }

  let movieDatabaseRecord, imageDatabaseRecord = []

  console.log("150", imageLocations)

  try{

    if (year !== undefined){

      year = parseInt(year);
    }

    movieDatabaseRecord = await addMovie(title, key, genre, description, year, length);

    

    if(imageLocations.length > 0){

      for(const image of imageLocations){

        try{

          const imageRes = await addImage(movieDatabaseRecord.id, image.key, image.url, image.mimeType, image.title, image.originalName)
      
          console.log(imageRes)

          imageDatabaseRecord.push(imageRes);

          //TODO: add imageRes to the returned object so the image can be shown straight away

        }catch(err){

          console.error(err)

        }
      }

    }

  }catch(err){

    console.log(err);

    return {

      data: "not added",
      status: "error"
    }

  }

  console.log(imageDatabaseRecord);

  movieDatabaseRecord.images = imageDatabaseRecord;

  console.log(movieDatabaseRecord);

  return {

    data: movieDatabaseRecord,
    status: "success"
  };
}