import pool from './db.js'



export const addUser = async (name:string, email:string, guid:string) => {
    

    const is_admin = false;

    const is_verified = false;

    const createUserEntry = await pool.query(`
            INSERT INTO users (name, email, guid, is_admin, is_verified)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `, [name, email, guid, is_admin, is_verified]);
    
    return createUserEntry.rows[0];
};


export const findUser = async (input:string) => {

    let isUser

    if(input.includes('-')){

        isUser = await pool.query(`
            SELECT * FROM users
            WHERE guid = $1
        `, [input]);

    }else{

        isUser = await pool.query(`
            SELECT * FROM users
            WHERE id = $1 
            `, [input])
    };

    console.log(isUser.rows)

    if(!isUser.rows[0]) return 

    return isUser.rows[0];
};


export const updateUser = async (input:string) => {

    const newVerification = true;

    const updatedUser = await pool.query(`
            UPDATE users 
            SET is_verified = $2 
            WHERE id = $1
            RETURNING *
        `, [input, newVerification])

    return updatedUser.rows[0];
}


export const getUsers = async () => {

    const allUsers = await pool.query(`
            SELECT * FROM users
        `)
    
    return allUsers.rows;
};