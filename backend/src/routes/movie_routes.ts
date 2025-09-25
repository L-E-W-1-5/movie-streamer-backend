import express, { type Express, type Request, type Response , type Application } from 'express';
import { addMovie, getMovies, deleteMovie } from '../database/movie_models.js'
import { putObject } from '../util/putObject.js';
import { deleteObject } from '../util/deleteObjects.js';
import multer from 'multer';
import mime from 'mime-types'


const movieRouter = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10 GB limit
});


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


// upload new movie
movieRouter.post('/', upload.single('movie'), async (req: Request,  res: Response) => {

  const title = req.body.title;

  const genre = req.body.genre;

  const file: Express.Multer.File | undefined = req.file;

  if(!title || typeof title !== 'string' || !file || !genre || typeof genre !== 'string'){

    return res.status(400).json({
      payload: "all fields required",
      status: "error"
    });

  };

  const mimeType = mime.lookup(file.originalname) || 'video/mp4';

  console.log(`uploading file with MIME type ${mimeType}`);

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

  let movieDatabaseRecord

  try{

    movieDatabaseRecord = await addMovie(title, result.url, genre);
  
  }catch(err){

    console.log(err);

    return res.status(500).json({
      payload: "movie uploaded to s3 but failed to save to database",
      url: result.url,
      key: result.key,
      status: "error"
    })
  }


  return res.status(201).send({
    payload: movieDatabaseRecord,
    status: "success"
  });

});

// delete a movie
movieRouter.post('delete-movie', async (req: Request, res: Response) => {

  const { fileName, id } = req.body;

  let s3Return

  try{

    s3Return = await deleteObject(fileName);
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

})


export default movieRouter