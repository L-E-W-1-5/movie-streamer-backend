import './config.js'
import express, { type Express, type Request, type Response , type Application } from 'express';
import cors from 'cors';
import morgan from "morgan";
// import multer from 'multer';
// import mime from 'mime-types'
// import { putObject } from './util/putObject.js';
// import { addMovie, getMovies } from './database/models.js'
import userRouter from './routes/user_routes.js'
import movieRouter from './routes/movie_routes.js'
//import { movieUpload } from './controllers/movieUpload.js'
//import { createUsersTable, dropTable, checkTableExists } from './database/createTables.js'
//import { randomBytes } from 'crypto';

const app: Application = express();

app.use(express.json());

app.use(cors());

app.use(morgan('dev'));

const port = process.env.PORT || 3001;

// const storage = multer.memoryStorage();

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 10 * 1024 * 1024 * 1024 } // e.g., 10 GB limit
// });

// const randomCode = () => {
//   const code = randomBytes(64).toString('hex');
//   console.log(code);
// }
// randomCode();


app.get('/', (req: Request, res: Response) => {

  res.send('Welcome to Express & TypeScript Server');

});


app.use('/movies', movieRouter);

app.use('/users', userRouter);

// app.get('/movies', async (req:Request, res: Response) => {

//   let movies

//   try{

//     movies = await getMovies()

//   }catch(err){

//     console.log(err);
//   }

//   console.log(movies)

//   if(!movies) res.send({
//     payload: "failed to load movies",
//     success: false
//   })

//   res.send({
//     payload: movies,
//     success: true
//   })
// })




// app.post('/movies', upload.single('movie'), async (req: Request,  res: Response) => {

//   const title = req.body.title;

//   const file: Express.Multer.File | undefined = req.file;

//   if(!title || typeof title !== 'string' || !file){


//     return res.status(400).json({
//       payload: "all fields required",
//       status: "error"
//     });

//   };

//   const mimeType = mime.lookup(file.originalname) || 'video/mp4';

//   console.log(`uploading file with MIME type ${mimeType}`);

//   let result;

//   try{

//     result = await putObject(file.buffer, title, mimeType);

//   }catch(err){
    
//     console.log(err);

//     return res.status(500).json({
//       payload: "Upload failed due to server error",
//       status: "error"
//     })
//   }

//   if(!result){

//     return res.status(500).send({
//       payload: "upload failed",
//       status: "error"
//     })
//   }

//   try{

//     addMovie(title, result.url, "test");
  
//   }catch(err){

//     console.log(err);

//     return res.status(500).json({
//       payload: "movie uploaded to s3 but failed to save to database",
//       url: result.url,
//       key: result.key,
//       status: "error"
//     })
//   }


//   res.status(201).send({
//     payload: "movie uploaded",
//     url: result.url,
//     key: result.key,
//     status: "success"
//   });

// });


app.listen(port, () => {

  console.log(`Server is Fire at https://localhost:${port}`);

});