import './config.js'
import express, { type Express, type Request, type Response , type Application, type NextFunction } from 'express';
import cors from 'cors';
import morgan from "morgan";
import userRouter from './routes/user_routes.js'
import movieRouter from './routes/movie_routes.js'
import { createUsersTable, dropTable, checkTableExists, createMovieTable, createMessagesTable } from './database/createTables.js'
import messageRouter from './routes/message_routes.js';
import jwt from 'jsonwebtoken'
//import { randomBytes } from 'crypto';

declare module 'express' {
  interface Request {
    user?: any; 
  }
}

const app: Application = express();

app.use(express.json());

app.use(cors());

app.use(morgan('dev'));

const port = process.env.PORT || 3001;

const secret_key:string = process.env.JWT_SECRET!;


export const verifyToken = (req: Request, res: Response, next: NextFunction) => {

  const header = req.headers['authorization'];

  if(!header){

    return res.status(400).json({
      payload: "no authorization header provided in the request",
      status: "error"
    });
  };

  const token = header.split(' ')[1];

  if(!token){

    return res.status(400).json({
      payload: "no token provided in the request",
      status: "error"
    });
  };

  jwt.verify(token, secret_key, (err, decoded) => {

    if(err){

      return res.status(400).json({
        payload: "invalid token",
        status: "error"
      })
    };

    req.user = decoded;

    next();
  });
};


app.get('/', (req: Request, res: Response) => {

  res.send('Welcome to Express & TypeScript Server');

});



app.use('/movies', verifyToken, movieRouter);

app.use('/users', userRouter);

app.use('/messages', verifyToken, messageRouter)



app.listen(port, () => {

  console.log(`Server is Fire at https://localhost:${port}`);

});