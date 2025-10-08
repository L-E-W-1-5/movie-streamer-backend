import pool from './db.js'
import { v4 as uuidv4, type UUIDTypes } from 'uuid'
import bcrypt from 'bcrypt'

const saltRounds = 10;


type User = {
    id: number,
    username: string,
    email: string,
    guid: string,
    is_admin: boolean,
    is_verified: boolean,
    pin_number: string,
    is_loggedin: boolean,
    login_attempts: number,
    time_created: Date,
    last_login: Date
}



export const addUser = async (name:string, email:string) => {

    const createUserEntry = await pool.query(`
        INSERT INTO users (username, email, is_admin, is_verified)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `, [name, email, false, false]);

    console.log(createUserEntry.rows);
            
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


export const findUserToLogin = async (suppliedGuid:string, email: string = "") => {

    let isUser



    if(suppliedGuid.includes('-')){

        isUser = await pool.query(`
            SELECT * FROM users
            WHERE email = $1
        `, [email]);

        if(!isUser) return

        const guid = isUser.rows[0].guid

        bcrypt.compare(suppliedGuid, guid, function(err, result) {

            if(err) throw err

            if(result !== true){

                //TODO: add 1 to login_attempts here

                throw new Error(`password incorrect`);
            }
        })
    }

    if(!isUser || !isUser.rows[0]){

        throw new Error("no user found");
    }

    const dateNow = new Date()

    console.log(dateNow)

    const update = await pool.query(`
        UPDATE users
        SET last_login = $1,
        is_loggedIn = $2
        WHERE email = $3
        RETURNING *
    `, [dateNow, true, email])

    console.log(update.rows[0])

    return isUser.rows[0];
};


export const updateUserVerifiction = async (input:string, newVerification = true) => {


    let updatedUser

    try{

        updatedUser = await pool.query(`
            UPDATE users 
            SET is_verified = $2 
            WHERE id = $1
            RETURNING *
        `, [input, newVerification]);
    
    }catch(err){

        console.log(err)

        throw new Error(`user could not be verified`)
    }


    if(!updatedUser.rows[0]){

        throw new Error("user verification not changed");
    };

    return updatedUser.rows[0];
};


export const createGuid = (userId: string) => {

    const guid: UUIDTypes = uuidv4();

    console.log(guid)

    bcrypt.genSalt(saltRounds, function(err, salt) {

        bcrypt.hash(guid, salt, async function(err, hash) {

            if(err){

                throw err;
            }

            console.log(hash)

            try{

                await pool.query(`
                    UPDATE users 
                    SET guid = $1
                    WHERE id = $2
                    RETURNING *;
                `, [hash, userId]);

            }catch(err){

                console.log(err);

                throw new Error(`error adding to database ${err}`)
            } 
        });
    });

    return guid;
}


export const updateUserAdmin = async (input:string, isAdmin = true) => {

    //const isAdmin = true;
    console.log(`${isAdmin}`)

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