import express, { type Express, type Request, type Response , type Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from "morgan";
import multer from 'multer';


dotenv.config();

const app: Application = express();

const port = process.env.PORT || 3001;

const storage = multer.diskStorage({
  destination: function (req, file, cb){
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb){
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 } // e.g., 10 GB limit
});

app.use(cors());

app.use(morgan('dev'));

//app.use(express.json());

//app.use(express.json({ limit: '20gb' }));
//app.use(express.urlencoded({ limit: '20gb', extended: true }));



app.get('/', (req: Request, res: Response) => {

  res.send('Welcome to Express & TypeScript Server');

});

app.post('/upload', upload.single('movie'), (req: Request,  res: Response) => {

  console.log(Date.now())

  console.log(req.file);

  res.status(200).send({payload: "movie uploaded"});
});


app.listen(port, () => {

  console.log(`Server is Fire at https://localhost:${port}`);

});