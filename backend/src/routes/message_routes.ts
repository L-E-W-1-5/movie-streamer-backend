import express, {type Request, type Response } from 'express';
import { deleteMessage, getMessages, saveMessage } from '../database/message_models.js';
import { verifyToken } from '../middleware/auth.js';



const messageRouter = express.Router();

//get all messages
messageRouter.get('/', async (req:Request, res:Response) => {

    let allMessages;
    
    try{

        allMessages = await getMessages();

    }catch(err){

        console.log(err);

        return res.status(400).json({
            payload: err,
            status: "error"
        })
    }


    if(allMessages){

        return res.status(200).json({
            payload: allMessages,
            status: "success"
        });

    }else{

        return res.status(400).json({
            payload: "could not get messages from database",
            status: "error"
        })
    }
});

// post a new message
messageRouter.post('/send_message', verifyToken, async (req:Request, res:Response) => {
    
    const { username, userid, timestamp, message } = req.body; 

    if(!username || !userid || !timestamp || !message){

        return res.status(400).json({
            payload: "all necessary fields not included in the request",
            status: "error"
        });
    };

    let sentMessage;

    try{

        sentMessage = await saveMessage(username, userid, timestamp, message);

    }catch(err){

        console.log(err);

        return res.status(400).json({
            payload: err,
            status: "error"
        })
    }

    if(sentMessage){

        return res.status(201).json({
            payload: sentMessage,
            status: "success"
        });

    }else{

        return res.status(500).json({
            payload: "message not saved to the database",
            status: "error"
        })
    };
});


messageRouter.post('/delete_message', verifyToken, async (req: Request, res: Response) => {

    const { id } = req.body.msg;

    try{

        const msgDelete = await deleteMessage(id);

        if(msgDelete){

            return res.status(200).json({
                payload: msgDelete,
                status: "success"
            })
        
        }else{

            return res.status(400).json({
                payload: "message could not be deleted",
                status: "error"
            })
        }
    
    }catch(err){

        console.log(err);

        return res.status(400).json({
            payload: err,
            status: "error"
        });
    }
})

export default messageRouter;