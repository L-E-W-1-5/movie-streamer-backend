// import * as movieModel from '../database/movie_models.js';
// import { type Movie, type Images } from '../Types/Types.js';


// export const createMovieStream = async ({ title, genre, description, year, length, dbPath, images }: any) => {

//     const formattedTitle = title.split(" ").join("-");


//     const imageLocations: Images[] = images.map((image: { originalname: string; mimetype: string }) => {

//       return {
//         key: `images/${formattedTitle}/${image.originalname}`,
//         url: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/images/${formattedTitle}/${image.originalname}`,
//         mimeType: image.mimetype,
//         title,
//         originalName: image.originalname
//       };
//     });

//     const movie = await movieModel.addMovie(
//         title,
//         dbPath,
//         genre,
//         description,
//         year,
//         length
//     );

//     if (!movie) {

//       throw new Error("Movie was not created");
//     };

//     if(imageLocations.length > 0){

//         const savedImages = await Promise.all(

//             imageLocations.map(img => 

//                 movieModel.addImage(movie.id, img)
//             )
//         );

//         movie.images = savedImages;
//     };

//     return movie;
    

// };