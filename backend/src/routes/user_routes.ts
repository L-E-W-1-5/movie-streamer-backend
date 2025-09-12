import express, { type Express, type Request, type Response , type Application } from 'express';
const userRouter = express.Router();



userRouter.post('/newuser', (req: Request, res: Response) => {

    console.log(req.body);

    res.send({
        payload: req.body,
        success: true
    })
})


export default userRouter;