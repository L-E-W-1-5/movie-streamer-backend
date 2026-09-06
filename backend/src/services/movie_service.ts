import * as movieModel from '../database/movie_models.js';
import { type Movie, type Images, type S3File } from '../Types/Types.js';



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




export const createMovieStream = async ({ title, genre, description, year, length, dbPath, images, media_format, season_number, episode_number, episode_title }: MovieData) => {

    //const formattedTitle = title.replaceAll(" ", "-");
//console.log("formattedTitle", formattedTitle);

    const imageLocations: Images[] = images.map((image: S3File, index: number) => {

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
    const movie = await movieModel.addMovie(
        title,
        dbPath,
        genre,
        description,
        year,
        length
    );

    console.log("createStream 43", movie);

    if (!movie) {

      throw new Error("Movie was not created");
    };

    if(imageLocations.length > 0){

        const savedImages = await Promise.all(

            imageLocations.map(img => 

                movieModel.addImage(movie.id, img, img.usage)
            )
        );

        movie.images = savedImages;
    };

    console.log("createStream 63", movie);

    return movie;
    

};
