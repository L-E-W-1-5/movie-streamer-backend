import pool from "./db.js";


export const getMessages = async () => {

    let allMessages

    
    allMessages = await pool.query(`
        SELECT * 
        FROM messages
    ;`);

    if(!allMessages.rows[0]){

        throw new Error("no messages found in database");
    }

    return allMessages.rows;
};


export const saveMessage = async (username:string, userid:number, timestamp:string, message:string) => {

    let sentMessage;

    
    sentMessage = await pool.query(`
        INSERT INTO messages (username, userid, timestamp, message)
        VALUES ($1, $2, $3, $4)
        RETURNING *     
    `, [username, userid, timestamp, message]);

    if(!sentMessage.rows[0]){

        throw new Error("message could not be saved to the database")
    };
    

    return sentMessage.rows[0];
};


export const deleteMessage = async (id: number) => {

    const deletedMessage = await pool.query(`
            DELETE FROM messages
            WHERE id = $1
            RETURNING *
        `, [id])

    if(!deletedMessage.rows[0]){

        throw new Error("message could not be deleted from database")
    }


    return deletedMessage.rows[0];
}