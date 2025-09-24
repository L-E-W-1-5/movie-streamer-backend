import express, { type Express, type Request, type Response , type Application, type NextFunction } from 'express';
import jwt from 'jsonwebtoken'

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