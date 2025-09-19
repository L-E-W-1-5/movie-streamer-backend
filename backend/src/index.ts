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
import { createUsersTable, dropTable, checkTableExists, createMovieTable } from './database/createTables.js'
//import { randomBytes } from 'crypto';

const app: Application = express();

app.use(express.json());

app.use(cors());

app.use(morgan('dev'));

const port = process.env.PORT || 3001;



app.get('/', (req: Request, res: Response) => {

  res.send('Welcome to Express & TypeScript Server');

});



app.use('/movies', movieRouter);

app.use('/users', userRouter);



app.listen(port, () => {

  console.log(`Server is Fire at https://localhost:${port}`);

});