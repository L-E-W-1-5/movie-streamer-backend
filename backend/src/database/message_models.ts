import pool from "./db.js";


export const getMessages = async () => {

    let allMessages

    try{
         allMessages = await pool.query(`
            SELECT * 
            FROM messages
        ;`);

    }catch(err){

        console.log(err);

        return "error";
    };

    return allMessages.rows;
};


export const saveMessage = async (username:string, userid:string, timestamp:string, message:string) => {

    let sentMessage;

    try{
        sentMessage = await pool.query(`
            INSERT INTO messages (username, userid, timestamp, message)
            VALUES ($1, $2, $3, $4)
            RETURNING *     
        `, [username, userid, timestamp, message]);
        
    }catch(err){

        console.log(err);

        return "error";
    }

    return sentMessage.rows[0];
}