import pool from './db.js'



export const addUser = async (name:string, email:string, guid:string) => {
    
    const is_admin = false;

    const is_verified = false;

    const createUserEntry = await pool.query(`
            INSERT INTO users (name, email, guid, is_admin, is_verified)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `, [name, email, guid, is_admin, is_verified]);

    if(!createUserEntry.rows[0]){

        throw new Error("new user not created");
    };
    
    return createUserEntry.rows[0];
};


export const deleteUser = async (id: string) => {

    const deleteUser = await pool.query(`
            DELETE FROM users
            WHERE id = $1
            RETURNING *  
        `, [id])

    if(!deleteUser.rows[0]){

        throw new Error("could not find user to delete")
    }

    return deleteUser.rows[0]
} 


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


    if(!isUser.rows[0]){

        throw new Error("no user found");
    }

    return isUser.rows[0];
};


export const updateUserVerifiction = async (input:string) => {

    const newVerification = true;

    const updatedUser = await pool.query(`
            UPDATE users 
            SET is_verified = $2 
            WHERE id = $1
            RETURNING *
        `, [input, newVerification]);

    if(!updatedUser.rows[0]){

        throw new Error("user not verified");
    }

    return updatedUser.rows[0];
}


export const updateUserAdmin = async (input:string) => {

    const isAdmin = true;

    const updatedUser = await pool.query(`
            UPDATE users
            SET is_admin = $2
            WHERE id = $1
            RETURNING * 
        `, [input, isAdmin]);

    if(!updatedUser.rows[0]){

        throw new Error("user not updated to admin");
    }

    return updatedUser.rows[0];
}


export const getUsers = async () => {

    const allUsers = await pool.query(`
            SELECT * FROM users
        `)

    if(!allUsers.rows[0]){

        throw new Error("failed to get all users from database")
    }

    console.log(allUsers.rows)
    
    return allUsers.rows;
};