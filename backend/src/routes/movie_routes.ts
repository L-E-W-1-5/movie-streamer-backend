import express, { type Express, type Request, type Response , type Application } from 'express';
import { deleteImage, addMovie, getMovies, deleteMovie, updateMovieDetails, increaseTimesPlayed, addImage, addToDatabase } from '../database/movie_models.js'
import { putImage, putObject } from '../util/putObject.js';
import { deleteObject, deleteImageFromS3 } from '../util/deleteObjects.js';
import multer from 'multer';
import mime from 'mime-types'
import { verifyToken } from '../middleware/auth.js';
import { getObjects, getObjectUnsigned, generateSignedPlaylist} from '../util/getObjects.js';
import { type Movie, type Images } from '../Types/Types.js';


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

const uploadFieldsHLS = upload.fields([
  { name: 'hls_files[]', maxCount: 1500 },    
  { name: 'images[]', maxCount: 5 }      
])

const uploadImage = upload.fields([
  { name: 'image[]', maxCount: 2 }
])




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
movieRouter.post('/hls', uploadFieldsHLS, async (req, res) => {

  let { title } = req.body;

  const files = req.files as { [ fieldName: string ] : Express.Multer.File[] };

  const hlsFiles = files['hls_files[]']

  const images = files['images']

  const uploadResults = [];

  let imageLocations = [];

  if(images){

    for(const image of images){

      const imageRes = await putImage(image.originalname, title, image.buffer, image.mimetype)

      if(imageRes){

        imageLocations.push(imageRes);
      };

    };
  };

  if(hlsFiles){

    for(const file of hlsFiles){

      const fileName = file.originalname// || file['relativePath'];

      const mimeType = mime.lookup(fileName) || 'application/octet-stream';

      let result;

      try{

        result = await putObject(file.buffer, fileName, mimeType, title);
    
      }catch(err){

        console.log(err)

        return res.status(500).json({
          payload: `failed to add to s3: ${err}`,
          status: "error"
        })
      }


      if(fileName.endsWith('.m3u8')){

        uploadResults.unshift({fileName, url: result?.url, key: result?.key})
    
      }else{

        uploadResults.push({fileName, url: result?.url, key: result?.key});
      }
    };
  }

  const filePath = `${title}_hls/${uploadResults[0]?.fileName}`

  const isAdded = await addToDatabase(req, filePath, imageLocations);

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
})




// upload new movie
movieRouter.post('/', uploadFieldsSingle, verifyToken, async (req: Request,  res: Response) => {

  let { title } = req.body;  

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const images = files['images[]'];
  
  const movie = files['movie']

  let imageLocations: Images[] = []


  if(images && images.length > 0){

    for(const image of images){

      const imageRes = await putImage(image.originalname, title, image.buffer, image.mimetype)

      if(imageRes){

        imageLocations.push(imageRes)
      };

    };
  };

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

  const isAdded = await addToDatabase(req, filePath, imageLocations)
  
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

      res.status(200).setHeader('Content-Type', 'application/vnd.apple.mpegurl').send(signedPlaylist)
    }

  
  }catch(err){

    console.log(err);

    return res.status(400).send("failed to get signed url")
    
  }
})



//update movie details and/or images
movieRouter.post('/update_movie', uploadImage, verifyToken, async (req, res) => {

  let { title, description, genre, year, id, length } = req.body;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const images = files['image[]'];

  let imageDBResponses: Images[] = []

  let updatedMovie


  if(images && images.length > 0){

    for(const image of images){

      const reply = await putImage(image.originalname, title, image.buffer, image.mimetype)

      if(reply){

        const dbRecord = await addImage(id, reply.key, reply.url, reply.mimeType, title, image.originalname)

        imageDBResponses.push(dbRecord)
      }
    }
  }

  try{

    updatedMovie = await updateMovieDetails(title, description, genre, year, id, length)
  
  }catch(err){

    console.log(err);

    return res.status(400).json({
      payload: err,
      status: "error"
    })
  }

  updatedMovie.images = imageDBResponses;

  console.log(updatedMovie)
  
  res.status(200).json({
    payload: updatedMovie,
    status: "success"
  })
})



// delete an image from a movie
movieRouter.post('/image_delete', verifyToken, async (req, res) => {

  const image = req.body.image

  console.log(image)

  if(!image.key || !image.id) return

  try{

    const dbReply = await deleteImage(image.id)
    
    if(dbReply?.status === "success"){
      
      const reply = await deleteImageFromS3(image.key);

      console.log(reply)
      
      if(reply.status === "success"){

        return res.status(201).json({

          payload: "image deleted from s3 and database successfully",
          status: "success"
        })
      }
    
    }
  
  }catch(err){

    console.error(err)

    return res.status(500).json({

      payload: "Server error, image not deleted",
      status: "error"
    })
  }

  return res.status(500).json({

      payload: "Server error, image not deleted",
      status: "error"
    })

})



export default movieRouter


// {
//     "Version": "2012-10-17",
//     "Statement": [
//         {
//             "Sid": "Statement1",
//             "Effect": "Allow",
//             "Principal": "*",
//             "Action": [
//                 "s3:GetObject",
//                 "s3:PutObject",
//                 "s3:DeleteObject"
//             ],
//             "Resource": "arn:aws:s3:::luluapps-luluflix-s3/*"
//         },
//         {
//             "Sid": "AllowPublicReadForSpecificFolder",
//             "Effect": "Allow",
//             "Principal": "*",
//             "Action": "s3:GetObject",
//             "Resource": "arn:aws:s3:::luluapps-luluflix-s3/images/*"
//         }
//     ]
// }