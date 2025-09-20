import express, {type Request, type Response } from 'express';
import { getMessages, saveMessage } from '../database/message_models.js';



const messageRouter = express.Router();

//get all messages
messageRouter.get('/', async (req:Request, res:Response) => {
    
    const allMessages = await getMessages();

    if(allMessages !== "error"){

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
messageRouter.post('/send_message', async (req:Request, res:Response) => {
    
    const { username, userid, timestamp, message } = req.body; 

    if(!username || !userid || !timestamp || !message){

        return res.status(400).json({
            payload: "all necessary fields not included in the request",
            status: "error"
        });
    };

    const sentMessage = await saveMessage(username, userid, timestamp, message);

    if(sentMessage !== "error"){

        return res.status(201).json({
            payload: sentMessage,
            status: "success"
        });

    }else{

        return res.status(500).json({
            payload: "message not saved to the database",
            status: "error"
        })
    }

})

export default messageRouter;