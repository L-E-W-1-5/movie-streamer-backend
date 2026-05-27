import * as movieModel from '../database/movie_models.js';
import { type Movie, type Images } from '../Types/Types.js';


type MovieData = {
    title: string,
    genre: string,
    description: string,
    year: number,
    length: string,
    dbPath: string,
    images: Express.Multer.File[]         
}


export const createMovieStream = async ({ title, genre, description, year, length, dbPath, images }: MovieData) => {

    const formattedTitle = title.replaceAll(" ", "-");
console.log("formattedTitle", formattedTitle);

    const imageLocations: Images[] = images.map((image: { originalname: string; mimetype: string }) => {

      return {
        key: `images/${formattedTitle}/${image.originalname}`,
        url: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/images/${formattedTitle}/${image.originalname}`,
        mimeType: image.mimetype,
        title,
        originalName: image.originalname
      };
    });

    console.log("imageLocations", imageLocations);

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

                movieModel.addImage(movie.id, img)
            )
        );

        movie.images = savedImages;
    };

    console.log("createStream 63", movie);

    return movie;
    

};
