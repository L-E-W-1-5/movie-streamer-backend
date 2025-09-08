import dotenv from 'dotenv';
dotenv.config();//{path: '../../.env'}
import express, { type Express, type Request, type Response , type Application } from 'express';
import cors from 'cors';
import morgan from "morgan";
import multer from 'multer';
import mime from 'mime-types'
import { putObject } from './util/putObject.js';

console.log('cwd', process.cwd())


const app: Application = express();

const port = process.env.PORT || 3001;

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 } // e.g., 10 GB limit
});

app.use(cors());

app.use(morgan('dev'));


app.get('/', (req: Request, res: Response) => {

  res.send('Welcome to Express & TypeScript Server');

});

app.post('/upload', upload.single('movie'), async (req: Request,  res: Response) => {

  console.log(process.env.REGION)

  const title = req.body.title;

  const file = req.file;

  if(!title || !file){

    console.log("52", file, title);

    return res.status(400).send({
      payload: "all fields required",
      url: "",
      key: "",
      status: "error"
    });

  };

  const mimeType = mime.lookup(file.originalname) || 'video/mp4';

  console.log("63", mimeType, title, file);

  const result = await putObject(file.buffer, title, mimeType);

  console.log("67", result);

  if(!result){

    return res.status(400).send({
      payload: "upload failed",
      url: "",
      key: "",
      status: "error"
    })
  }

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