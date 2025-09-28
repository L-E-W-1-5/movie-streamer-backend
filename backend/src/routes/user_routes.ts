import express, { type Express, type Request, type Response , type Application } from 'express';
import { addUser, getUsers, findUser, updateUserVerifiction, updateUserAdmin } from '../database/user_models.js'
import { sendMailToUser, sendMailToAdmin } from '../nodemailer/email.js';
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'
import { verifyToken } from '../middleware/auth.js';

const userRouter = express.Router();
    
const secret_key:string = process.env.JWT_SECRET!;

// get all users
userRouter.get('/', verifyToken, async (req: Request, res: Response) => {

 
    if(!req.user.is_admin){

        return res.status(400).json({
            payload: "admin accounts only",
            status: "error"
        })
    }

    let allUsers;

    try{

        allUsers = await getUsers();

    }catch(err){

        console.log(err);

        return res.status(500).json({
            payload: err,
            status: "error"
        })
    }


    res.status(200).json({
        status: "success",
        payload: allUsers
    })
});

// this is the endpoint for the link in the email sent to admin for user verification 
userRouter.get('/verify_user', async (req:Request, res:Response) => {

    const tokenParam = req.query.token;

    const token = typeof tokenParam === 'string' ? tokenParam : undefined

    let confirmed

    let emailSent

    if(!token){

        return res.status(400).json({
            payload: "token missing from query",
            status: "error"
        })
    };

    const userRecord = await findUser(token)


    if(userRecord){

        confirmed = await updateUserVerifiction(token);

    }else{

        return res.status(400).json({
            payload: "user not found",
            status: "error"
        })
    };


    try{

        emailSent = await sendMailToUser(confirmed.guid, confirmed.email)

    }catch(err){

        console.log(err);

        return res.status(500).json({
            payload: `email not sent to user. ${err}`,
            status: "error"
        })
    }

    const returnData = {
        userDetails: confirmed,
        emailDetails: emailSent
    }

    return res.status(201).json({
        payload: returnData,
        status: "success"
    })

});

// this is the endpoint to upgrade a user to admin
userRouter.get('/create_admin', verifyToken, async (req:Request, res:Response) => {

    const tokenParam = req.query.token;

    //TODO: perform a check here to req.user to check for admin account - after resetting database of users

    const token = typeof tokenParam === 'string' ? tokenParam : undefined

    if(!token){

        return res.status(400).json({
            payload: "no token in the request",
            status: "error"
        });
    };

    let isAdmin;

    try{

        isAdmin = await updateUserAdmin(token);
    }catch(err){

        console.log(err);

        return res.status(500).json({
            payload: err,
            status: "error"
        })
    }


    return res.status(201).json({
        payload: isAdmin,
        status: "success"
    })
})

// endpoint for new user registration
userRouter.post('/newuser', async (req: Request, res: Response) => {

    const { name, email } = req.body.data;

    const guid = uuidv4();

    let details

    try{

        details = await addUser(name, email, guid);

    }catch(err){

        console.log(err);

        return res.status(500).json({
            payload: err,
            status: "error"
        })
    }
    
    await sendMailToAdmin(name, email, details.id)

    return res.status(201).json({
        payload: "user added, awaiting verification from admin",
        status: "success"
    })

});

// check if user has an account and is verified after login attempt
userRouter.post('/', async (req: Request, res: Response) => {

    const { guid } = req.body;

    let isValid;

    try{

        isValid = await findUser(guid);

    }catch(err){

        console.log(err);

        return res.status(400).json({
            payload: err,
            status: "error"
        })
    }


    if(isValid){

        const token = jwt.sign({
            username: isValid.name,
            email: isValid.email,
            admin: isValid.is_admin
        }, 
            secret_key
        );

        return res.status(200).json({
            payload: {
                username: isValid.name,
                id: isValid.id,
                verified: isValid.is_verified,
                admin: isValid.is_admin,
                token: token,
                status: "success"
            }
        })
    }else{

        return res.status(400).json({
            payload: "login id does not match with records",
            status: "error"
        })
    }
})


export default userRouter;

//0e3ff365-5993-45fa-8206-fbf886651932