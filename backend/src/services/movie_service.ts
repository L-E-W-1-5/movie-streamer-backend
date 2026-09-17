import * as mediaModel from '../database/movie_models.js';
import { type Movie, type Images, type S3File } from '../Types/Types.js';
import { putImage } from '../util/putObject.js';
import express, { type Express, type Request, type Response , type Application } from 'express';



type MovieData = {
    title: string,
    genre: string,
    description: string,
    year: number,
    length: string,
    dbPath: string,
    images: S3File[],
    media_format: string,
    season_number?: number,
    episode_number?: number,
    episode_title?: string      
}

type SeriesData = {
    title: string,
    description: string,
    year: number,
    genre: string,
}




export const createMovieStream = async ({ title, genre, description, year, length, dbPath, images, media_format, season_number, episode_number, episode_title }: MovieData) => {

    //const formattedTitle = title.replaceAll(" ", "-");
//console.log("formattedTitle", formattedTitle);

    const imageLocations: Images[] = images.map((image: S3File, index: number) => {

       // TODO: consider adding season and episode numbers to image path if they exist

      return {
        key: image.key, //`images/${formattedTitle}/${image.originalname}`,
        url: image.location, //`https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/images/${formattedTitle}/${image.originalname}`,
        mimeType: image.mimetype,
        title,
        originalName: image.originalname,
        usage: (index === 0 ? 'container' : index === 1 ? 'card' : 'other')
      };
    });

    console.log("imageLocations", imageLocations);


    //TODO: Add logic to handle media_format, season_number, episode_number, and episode_title if needed
    const movie = await mediaModel.addMovie(
        title,
        dbPath,
        genre,
        description,
        year,
        length,
        media_format,
        season_number,
        episode_number,
        episode_title
    );

    console.log("createStream 43", movie);

    if (!movie) {

      throw new Error("Movie was not created");
    };

    if(imageLocations.length > 0){

        const savedImages = await Promise.all(

            imageLocations.map(img => 

                mediaModel.addImage(movie.id, img, img.usage)
            )
        );

        movie.images = savedImages;
    };

    console.log("createMovieStream", movie);

    return movie;
    
};


export const saveSeriesToDatabase = async (title: string, description: string, genre: string, year: number, images: S3File[]) => {

    console.log("seriesDB function", images)

    const s3SavedImages = await saveImagesToS3(images, title)

    const imageLocations = s3SavedImages.map((image: Images, index: number) => ({
  
            ...image,
            usage: (index === 0 ? 'series-container' : index === 1 ? 'series-card' : 'series-other')   
        })
    );

    console.log("imageLocations-series", imageLocations)

    const seriesRecord = await mediaModel.addSeries(
        title, 
        description, 
        genre, 
        year
    );

    console.log("series record", seriesRecord)

    if(!seriesRecord){

        throw new Error("series record was not created")
    }

    if(imageLocations && imageLocations.length > 0){

        const savedImages = await Promise.all(

            imageLocations.map(image => 

                mediaModel.addImage(seriesRecord.id, image, image.usage)
            )
        );

        seriesRecord.images = savedImages;
    };

    console.log("finished record", seriesRecord)

    return seriesRecord

};



export const saveImagesToS3 = async (images: Express.Multer.File[], title: string) => {

    let imageLocations: Images[] = [];

    if(images){
    
        for(const image of images){
    
          const imageRes = await putImage(image.originalname, title, image.buffer, image.mimetype)
    
          if(imageRes){
    
            imageLocations.push(imageRes);
          };
    
        };
    };

    return imageLocations;
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

    movieDatabaseRecord = await mediaModel.addMovie(title, key, genre, description, year, length);

    if(imageLocations.length > 0){

      for(const image of imageLocations){

        try{

          const imageRes = await mediaModel.addImage(movieDatabaseRecord.id, image)   //.key, image.url, image.mimeType, image.title, image.originalName);

          imageDatabaseRecord.push(imageRes);

        }catch(err){

          console.error(err)
        };
      };
    };

  }catch(err){

    console.log(err);

    return {

      data: "not added",
      status: "error"
    };
  };

  movieDatabaseRecord.images = imageDatabaseRecord;

  return {

    data: movieDatabaseRecord,
    status: "success"
  };
}
