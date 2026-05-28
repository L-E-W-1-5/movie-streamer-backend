import express, { type Request, type Response } from 'express';
import { deleteImage, getMovies, deleteMovie, updateMovieDetails, increaseTimesPlayed, addImage, addToDatabase, updateImage } from '../database/movie_models.js'
import { putImage, putObject } from '../util/putObject.js';
import { deleteObject, deleteImageFromS3 } from '../util/deleteObjects.js';
import multer from 'multer';
import multers3 from 'multer-s3';
import mime from 'mime-types'
import { getObjects, getObjectUnsigned, generateSignedPlaylist} from '../util/getObjects.js';
import { type Images, type S3File } from '../Types/Types.js';
import { S3Client } from "@aws-sdk/client-s3"
import slugify from 'slugify';
import { createMovieStream } from '../services/movie_service.js';
import https from "https";
import { NodeHttpHandler } from "@smithy/node-http-handler";

const movieRouter = express.Router();

const storage = multer.memoryStorage();


const client = new S3Client({

  region: process.env.REGION as string,

  credentials: {
        accessKeyId: process.env.ACCESS_KEY as string,
        secretAccessKey: process.env.SECRET_KEY as string
  },

  requestHandler: new NodeHttpHandler({
    httpsAgent: new https.Agent({
      maxSockets: 200 // or 300 for HLS
    }),
    
  })
});


declare global {

  namespace Express {

    interface Request {

      movieFolder?: string;

      playlistKey?: string;
    }
  }
}

export {};



const uploadViaStream = multer({

  storage: multers3({

    s3: client,

    bucket: process.env.S3_BUCKET_NAME!,

    contentType: multers3.AUTO_CONTENT_TYPE,

    key: function (
      req: Request,
      file,
      cb
    ) {

      const rawTitle = typeof req.query.title === "string" ? req.query.title : "untitled";

      const title = slugify(rawTitle || 'untitled', { lower: true, strict: true });
      
      if(!req.movieFolder){

        req.movieFolder = `movies/${title}`;
      }

      let key: string;

      if(file.fieldname === 'images[]'){

        key = `images/${title}/${file.originalname}`;
      
      }else{

        key = `${req.movieFolder}/${file.originalname}`;

        if(file.originalname.endsWith('.m3u8') && !req.playlistKey){

          req.playlistKey = key
        }
      } 

      cb(null, key);
    }
  }),

  limits: { 
    fileSize: 10 * 1024 * 1024 * 1024,  // 10 GB limit
    files: 1000
   }, 
  
});


const uploadStreamFields = uploadViaStream.fields([
  { name: 'hls_files[]', maxCount: 1000 },
  { name: 'images[]', maxCount: 5 }
]);


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
  { name: 'image[]', maxCount: 50 }
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



movieRouter.post('/stream', uploadStreamFields, async (req, res) => {

  try{

    console.log(`Received batch ${parseInt(req.body.batchNumber) + 1}`);

    const isFirstBatch = req.body.isFirstBatch === "true";

    if(!isFirstBatch) return res.status(200).json({

      status: "success"
    });

    const { playlistKey } = req;

    if(isFirstBatch && !playlistKey) return res.status(400).json({

      payload: "playlist file not found in the first batch",
      status: "error"
    });


    const { title, genre, description, year, length } = req.body;

    const files = req.files as { [ fieldName: string ] : S3File[] };

    const movie = await createMovieStream({
      title,
      genre,
      description,
      year: year ? parseInt(year) : 1,
      length,
      dbPath: playlistKey!,
      images: files['images[]'] || []
    });

    console.log("movie created", movie);

    res.status(201).json({
      payload: movie,
      status: "success"
    })

  }catch(err){

    console.error(err);

    res.status(500).json({
      payload: "failed to upload movie stream",
      status: "error"
    })
  }

});



//upload hls
movieRouter.post('/hls', uploadFieldsHLS, async (req, res) => {

  console.log("hls route")

  let { title } = req.body;

  const files = req.files as { [ fieldName: string ] : Express.Multer.File[] };

  const hlsFiles = files['hls_files[]']

  const images = files['images[]']

  const uploadResults = [];

  let imageLocations = [];

  console.log("246 - hls files", hlsFiles);

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

      try{

        const result = await putObject(file.buffer, fileName, mimeType, title);



        if(fileName.endsWith('.m3u8')){

          uploadResults.unshift({fileName, url: result?.url, key: result?.key})
    
        }else{

          uploadResults.push({fileName, url: result?.url, key: result?.key});
        }
    
      }catch(err){

        console.log(err)

        return res.status(500).json({
          payload: `failed to add to s3: ${err}`,
          status: "error"
        })
      }


      
    };
  }

  const filePath = `${title}_hls/${uploadResults[0]?.fileName}`

  const isAdded = await addToDatabase(req, filePath, imageLocations);

  console.log(isAdded);

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
movieRouter.post('/', uploadFieldsSingle, async (req: Request,  res: Response) => {

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

    let databaseReturn

    if(s3Return === "deleted"){

      databaseReturn = await deleteMovie(id);

      await Promise.all(

        databaseReturn.image.map(file =>

          deleteImageFromS3(file.key)
        )
      );

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
      };
    }

  }catch(err){

      console.log(err);

      return res.status(400).json({
        payload: err,
        status: "error"
      });
  };
});




// fetch movie from s3
movieRouter.post('/get_s3', async (req, res) => {

  
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
movieRouter.post('/update_movie', uploadImage, async (req, res) => {

  let { title, description, genre, year, id, length } = req.body;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const images = files['image[]'];

  let imageDBResponses: Images[] = []

  let updatedMovie

  console.log(images)

//TODO: put this in try/catch

  if(images && images.length > 0){

    for(const image of images){

      const usage = req.body[image.originalname] ? req.body[image.originalname] : null;

      const reply = await putImage(image.originalname, title, image.buffer, image.mimetype)

      if(reply){

        const dbRecord = await addImage(id, reply, usage)

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

  console.log(updatedMovie)

  if(imageDBResponses.length > 0) updatedMovie.images = imageDBResponses;  //Changed this to a push from '='

  

  console.log(updatedMovie)
  
  res.status(200).json({
    payload: updatedMovie,
    status: "success"
  })

  
})



// delete an image from a movie
movieRouter.post('/image_delete', async (req, res) => {

  const image = req.body.image

  //console.log(image)

  if(!image.key || !image.id) return

  try{

    const dbReply = await deleteImage(image.id)
    
    if(dbReply?.status === "success"){
      
      const reply = await deleteImageFromS3(image.key);

      console.log(dbReply)
      
      if(reply.status === "success"){

        return res.status(201).json({

          payload: dbReply.payload,
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

});


movieRouter.post('/update_image', uploadImage, async (req, res) => {

  const { imagesUp } = req.body

  if(imagesUp){

    for(const image of imagesUp){

      try{

        const usage = req.body[image] ? req.body[image] : "other";

        await updateImage(Number(image), usage);

      
      }catch(err){

        console.log(err);

        return res.status(500).json({

          payload: err,
          status: "error"
        });

      };

    };

    return res.status(200).json({
  
      payload: "usages changed successfully",
      status: "success"
    });

  };

  res.status(500).json({

    payload: "no images to update",
    status: "error"
  });

});



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