import express, { type Express, type Request, type Response , type Application } from 'express';
import { deleteImage, addMovie, getMovies, deleteMovie, updateMovieDetails, increaseTimesPlayed, addImage } from '../database/movie_models.js'
import { putImage, putObject } from '../util/putObject.js';
import { deleteObject } from '../util/deleteObjects.js';
import multer from 'multer';
import mime from 'mime-types'
import { verifyToken } from '../middleware/auth.js';
import { getObjects, getObjectUnsigned, generateSignedPlaylist} from '../util/getObjects.js';
import { type Movie } from '../Types/Types.js';


const movieRouter = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10 GB limit
});

const uploadFieldsSingle = upload.fields([
  { name: 'movie', maxCount: 1},
  { name: 'images[]', maxCount: 5 },           
])

// const uploadFieldsHLS = upload.fields([
//   { name: 'images', maxCount: 5 },       
//   { name: 'hls_files[]', maxCount: 1500 }    
// ])


// fetch all movies at login 
movieRouter.get('/', async (req:Request, res: Response) => {

  let movies

  try{

    movies = await getMovies()

  }catch(err){

    console.log(err);

    return res.status(400).json({
      payload: err,
      status: "error"
    })
  }


  if(!movies) 

    return res.status(400).json({
      payload: "failed to load movies",
      status: "error"
  })

  return res.status(200).json({
    payload: movies,
    status: "success"
  })
});


//upload hls
// movieRouter.post('/hls', upload.array('hls_files[]'), async (req, res) => {

//   console.log("hls")

//   let { title } = req.body;

//   const files = req.files as Express.Multer.File[];

//   const uploadResults = [];

//   for(const file of files){

//     const fileName = file.originalname// || file['relativePath'];

//     const mimeType = mime.lookup(fileName) || 'application/octet-stream';

//     let result;

//     try{

//       result = await putObject(file.buffer, fileName, mimeType, title);
    
//     }catch(err){

//       console.log(err)

//       return res.status(500).json({
//         payload: `failed to add to s3: ${err}`,
//         status: "error"
//       })
//     }


//     if(fileName.endsWith('.m3u8')){

//       uploadResults.unshift({fileName, url: result?.url, key: result?.key})
    
//     }else{

//       uploadResults.push({fileName, url: result?.url, key: result?.key});
//     }
//   };

//   const filePath = `${title}_hls/${uploadResults[0]?.fileName}`

//   const isAdded = await addToDatabase(req, filePath);

//   if(isAdded.status === "error"){

//     return res.status(500).json({
//       payload: "added to s3 but failed to add to database",
//       status: "error"
//     })
//   }

//   return res.status(201).json({
//     payload: isAdded.data,
//     status: "success"
//   })
// })


const addToDatabase = async (req: Request, filePath: string | null = null, images: Express.Multer.File[] = []) => {

  let { title, genre, description, year, length } = req.body;

  let key: string = title;

  if(filePath){

    key = filePath;
  }

  let movieDatabaseRecord

  try{

    if (year !== undefined){

      year = parseInt(year);
    }

    movieDatabaseRecord = await addMovie(title, key, genre, description, year, length);


    for(const image of images){

      console.log(image)

      try{

        const isImageAdded = await addImage(movieDatabaseRecord.id, image.originalname, image.mimetype, image.buffer)
    
        console.log(isImageAdded);

      
    
      }catch(err){

        console.error(err);

        return {

          data: "image not added",
          status: "error"
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

  return {

    data: movieDatabaseRecord,
    status: "success"
  };

  
}


// upload new movie
movieRouter.post('/', uploadFieldsSingle, async (req: Request,  res: Response) => {

  let { title } = req.body;  

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const images = files['images[]'];
  
  const movie = files['movie']

  // if(!movie || !movie[0]) return

  

  // console.log(file);



  // if(images){

  //   putImage(title, images)
  // }

 //addToDatabase(req, "filePath", images);
  
  

  if(!title || typeof title !== 'string' || !movie || !movie[0]){ // || !genre || typeof genre !== 'string'

    return res.status(400).json({

      payload: "all fields required",
      status: "error"
    });
  };

  const file = movie[0]

  const mimeType = mime.lookup(file.originalname) || 'video/mp4';

  let result;

  try{

    result = await putObject(file.buffer, title, mimeType);

  }catch(err){
    
    console.log(err);

    return res.status(500).json({

      payload: "Upload failed due to server error",
      status: "error"
    });
  };

  if(!result){

    return res.status(500).send({

      payload: "upload failed",
      status: "error"
    })
  }

  const filePath = `${title}/${title}`

  const isAdded = await addToDatabase(req, filePath, images)

  if(isAdded.status === "error"){

    return res.status(500).json({
      payload: "added to s3 but failed to add to database",
      status: "error"
    })
  }

  return res.status(201).json({
    payload: isAdded.data,
    status: "success"
  })

});


// delete a movie
movieRouter.post('/delete_movie', async (req: Request, res: Response) => {

  const { title, id, key } = req.body.movie;

  let s3Return

  try{

    s3Return = await deleteObject(key);
    console.log(s3Return)
  
  }catch(err){

    console.log(err);

    return res.status(500).json({
      payload: err,
      status: "error"
    })
  }

  let databaseReturn

  if(s3Return === "deleted"){

    try{

      databaseReturn = await deleteMovie(id);

    }catch(err){

      console.log(err);

      return res.status(400).json({
        payload: err,
        status: "error"
      });
    };

    if(databaseReturn){

      return res.status(200).json({
        payload: "movie deleted successfully from all storage",
        status: "success"
      })
    }else{

      return res.status(400).json({
        payload: "movie not deleted from database",
        status: "error"
      })
    }
  }

  return

})

// fetch movie from s3
movieRouter.post('/get_s3', verifyToken, async (req, res) => {

  
  const { key, id } = req.body.film;

  try{

    if(!key.includes('.m3u8')){

      const signedMovie = await getObjects(key)

      console.log('m3u8')

      if(signedMovie){

         increaseTimesPlayed(id)

        return res.status(200).send(signedMovie)
      }
    }

    const playlistFile = await getObjectUnsigned(key);


    //console.log(key)

    const slashIndex = key.lastIndexOf('/');

    let directoryPath

    if(slashIndex !== -1){

      directoryPath = key.substring(0, slashIndex);
    
    }else{

      directoryPath = ""
    }

    console.log(directoryPath)

    if(playlistFile){

      const signedPlaylist = await generateSignedPlaylist(playlistFile, directoryPath);

      //console.log(signedPlaylist)

      // res.json({
      //   payload: signedPlaylist,
      //   status: "success"
      // })

      res.status(200).setHeader('Content-Type', 'application/vnd.apple.mpegurl').send(signedPlaylist)
    }

  
  }catch(err){

    console.log(err);

    return res.status(400).send("failed to get signed url")
    
  }

})


movieRouter.post('/update_movie', verifyToken, (req, res) => {

  console.log(req.body)

  const movie: Movie = req.body.edit;

  console.log(movie);
 
  try{

    updateMovieDetails(movie)
  
  }catch(err){

    console.log(err);

    return res.status(400).json({
      payload: err,
      status: "error"
    })
  }

  res.status(200).json({
    payload: "movie details updated",
    status: "success"
  })
})


export default movieRouter