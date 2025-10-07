import express, { type Express, type Request, type Response , type Application } from 'express';
import { addUser, getUsers, findUser, updateUserVerifiction, updateUserAdmin, deleteUser, createGuid } from '../database/user_models.js'
import { sendMailToUser, sendMailToAdmin, sendMailSendGrid, sendGridToUser } from '../nodemailer/email.js';
import jwt from 'jsonwebtoken'
import { verifyToken } from '../middleware/auth.js';

const userRouter = express.Router();
    
const secret_key: string = process.env.JWT_SECRET!;

// get all users
userRouter.get('/', verifyToken, async (req: Request, res: Response) => {

 
    console.log(req.user)
    if(!req.user.admin){

        return res.status(400).json({
            payload: "admin account required",
            status: "error"
        });
    };

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

// endpoint for new user registration
userRouter.post('/newuser', async (req: Request, res: Response) => {

    console.log(req.body);

    const { name, email } = req.body;

    

    let details

    try{

        details = await addUser(name, email);

    }catch(err){

        console.log(err);

        return res.status(500).json({
            payload: `error adding user to database, please try again later. ${err}`,
            status: "error"
        })
    }

    try{

        await sendMailSendGrid(name, email, details.id)
        //await sendMailToAdmin(name, email, details.id)

    }catch(err){

        console.log(err);

        const deletedUser = await deleteUser(details.id);

        if(!deletedUser){

            return res.status(500).json({
                payload: `user ${details.id} could not be deleted from the database and email could not be sent to admin for verification`,
                status: "error"
            })
        }

        return res.status(500).json({
            payload: "error sending email to admin, user not created",
            status: "error"
        })
    }
    

    return res.status(201).json({
        payload: "user added, awaiting verification from admin",
        status: "success"
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

        confirmed.guid = createGuid(token);

    }else{

        return res.status(400).json({
            payload: "user not found",
            status: "error"
        })
    };


    try{

        //emailSent = await sendMailToUser(confirmed.guid, confirmed.email);
        emailSent = sendGridToUser(confirmed.guid, confirmed.email);

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

// this is the endpoint to upgrade a user to admin (mainly for my own use, remove 'verifyToken' to use)
userRouter.get('/create_admin', verifyToken, async (req:Request, res:Response) => {

    const idParam = req.query.token;

    if(!req.user.admin){
     
        return res.status(400).json({
            payload: "admin account needed to complete this action",
            status: "error"
        })
    }

    const userId = typeof idParam === 'string' ? idParam : undefined

    if(!userId){

        return res.status(400).json({
            payload: "no token in the request",
            status: "error"
        });
    };

    let isAdmin;

    try{

        isAdmin = await updateUserAdmin(userId);

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


    if(isValid.is_verified){

        const token = jwt.sign({
            username: isValid.name,
            email: isValid.email,
            admin: isValid.is_admin
        }, 
            secret_key
        );

        return res.status(200).json({
            payload: {
                id: isValid.id,
                username: isValid.name,
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


userRouter.post('/delete_user', verifyToken, async (req: Request, res: Response) => {

    const { id } = req.body;

    let deletedUser;

    

    try{

        deletedUser = await deleteUser(id);

    }catch(err){

        console.log(err);

        return res.status(400).json({
            payload: "user could not be found",
            status: "error"
        })
    }


    if(deletedUser){

        return res.status(201).json({
            payload: "user deleted successfully",
            operation: "delete",
            status: "success"
        })
    }
});


// change whether a user is an admin or not
userRouter.post('/change_admin', verifyToken, async (req:Request, res:Response) => {

    let { id, is_admin } = req.body;

    if(!req.user.admin){
     
        return res.status(400).json({
            payload: "admin account needed to complete this action",
            status: "error"
        })
    }

    if(!id){

        return res.status(400).json({
            payload: "no id provided",
            status: "error"
        })
    };


    let updatedInfo

    try{

        updatedInfo = await updateUserAdmin(id, !is_admin)
    
    }catch(err){

        console.log(err)

        return res.status(400).json({
            payload: "user status not changed",
            status: "error"
        })
    }   

    if(updatedInfo){

        return res.status(200).json({
            payload: "user status updated",
            operation: "admin",
            status: "success"
        })
    }
});


userRouter.post('/change_verify', verifyToken, async (req:Request, res:Response) => {

    let { id, is_verified } = req.body;


    if(!id){

        return res.status(400).json({
            payload: "no user found",
            status: "error"
        })
    }

    if(!req.user.admin){
     
        return res.status(400).json({
            payload: "admin account needed to complete this action",
            status: "error"
        })
    }


    try{

        await updateUserVerifiction(id, !is_verified)
    
    }catch(err){

        console.log(err)

        return res.status(400).json({
            payload: "could not update user verification",
            status: "error"
        });
    }

    return res.status(201).json({
        payload: "user verification updated",
        operation: "verification",
        status: "success"
    })
})


export default userRouter;

//0e3ff365-5993-45fa-8206-fbf886651932