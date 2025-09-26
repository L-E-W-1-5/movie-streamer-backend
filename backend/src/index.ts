import './config.js'
import express, { type Express, type Request, type Response , type Application, type NextFunction } from 'express';
import cors from 'cors';
import morgan from "morgan";
import userRouter from './routes/user_routes.js'
import movieRouter from './routes/movie_routes.js'
import { createUsersTable, dropTable, checkTableExists, createMovieTable, createMessagesTable } from './database/createTables.js'
import messageRouter from './routes/message_routes.js';
import { verifyToken } from './middleware/auth.js';
//import { randomBytes } from 'crypto';

declare module 'express' {
  interface Request {
    user?: any; 
  }
}

const app: Application = express();



app.use(express.json());

//TODO: change this for localhost requests
app.use(cors({
   origin: 'https://luluflix.netlify.app'
}));

//app.use(cors());

app.use(morgan('dev'));

const port = process.env.PORT || 3001;


app.get('/', (req: Request, res: Response) => {

  res.send('Welcome to Express & TypeScript Server');

});


app.use('/movies', verifyToken, movieRouter);

app.use('/users', userRouter);

app.use('/messages', verifyToken, messageRouter)



app.listen(port, () => {

  console.log(`Server is Fire at https://localhost:${port}`);

});