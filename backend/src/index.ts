import './config.js'
import express, { type Express, type Request, type Response , type Application } from 'express';
import cors from 'cors';
import morgan from "morgan";
import multer from 'multer';
import mime from 'mime-types'
//import pool from './database/db.js';
import { putObject } from './util/putObject.js';
//import { createMovieTable, checkTableExists } from './database/createTables.js'

const app: Application = express();

app.use(cors());

app.use(morgan('dev'));

const port = process.env.PORT || 3001;

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 } // e.g., 10 GB limit
});




app.get('/', (req: Request, res: Response) => {

  res.send('Welcome to Express & TypeScript Server');

});

app.post('/upload', upload.single('movie'), async (req: Request,  res: Response) => {

  const title = req.body.title;

  const file = req.file;

  if(!title || !file){

    return res.status(400).send({
      payload: "all fields required",
      url: "",
      key: "",
      status: "error"
    });
  };

  const mimeType = mime.lookup(file.originalname) || 'video/mp4';

  let result

  try{

    result = await putObject(file.buffer, title, mimeType);

  }catch(err){
    
    console.log(err)
  }

//TODO: call to database here, url and metadata
//id, title, url, key, type or genre, something to divide them for display
  if(!result){

    return res.status(400).send({
      payload: "upload failed",
      url: "",
      key: "",
      status: "error"
    })
  }

//TODO: wont need to return the movie once uploaded
  res.status(200).send({
    payload: "movie uploaded",
    url: result.url,
    key: result.key,
    status: "success"
  });

});


app.listen(port, () => {

  console.log(`Server is Fire at https://localhost:${port}`);

});