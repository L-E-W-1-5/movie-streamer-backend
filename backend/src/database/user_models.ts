import pool from './db.js'
import { v4 as uuidv4, type UUIDTypes } from 'uuid'
import bcrypt from 'bcrypt'
import type { QueryResult } from 'pg';

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


// add a user to the database after registration
export const addUser = async (name:string, email:string) => {

    const createUserEntry: QueryResult<User> | void = await pool.query(`
        INSERT INTO users (username, email, is_admin, is_verified)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `, [name, email, false, false])

    .catch((e) => {

        console.log(e);

        throw new Error(`user couldn't be added to the database, ${e}`);
    });
    
            
    if(createUserEntry === null || !createUserEntry?.rows[0]){

        throw new Error("new user not created");
    };

    return createUserEntry.rows[0]; 
};

// delete a user from the database
export const deleteUser = async (id: number) => {

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

// check whether login details are correct
export const findUserToLogin = async (suppliedGuid: string, email: string) => {

    let isUser;

    if(!suppliedGuid){
        return {
            data: "no password supplied",
            status: "error"
        };
    };

    isUser = await pool.query(`
        SELECT * FROM users
        WHERE email = $1
    `, [email]);

    if(isUser.rows.length === 0){

        return {
            data: "no user found with matching email",
            status: "email"
        };
    } ;

    const user = isUser.rows[0];

    const isMatch = await bcrypt.compare(suppliedGuid, user.guid);

    if(!isMatch){

        const loginAttempts = await pool.query(`
            UPDATE users
            SET login_attempts = login_attempts + 1
            WHERE email = $1
            RETURNING *
        `, [email])
        .catch(e => console.log(e));

        return {
            data: "password incorrect",
            status: "password"
        };
    };
            

    const dateNow = new Date();
    
    await pool.query(`
        UPDATE users
        SET last_login = $1,
        is_loggedIn = $2,
        login_attempts = $3
        WHERE email = $4
        RETURNING *
    `, [dateNow, true, 0, email]);
    
    
    return {
        data: user,
        status: "success"
    };
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

    const allUsers: QueryResult<User> = await pool.query(`
            SELECT * FROM users
        `)
    
    .catch((e) => {

        console.log(e);

        throw new Error('failed to get all users')
    })

    if(!allUsers.rows[0]){

        throw new Error("failed to get all users from database")
    }

    
    return allUsers.rows;
};

export const logoutUser = async (id: number) => {

    const logout: QueryResult<User> = await pool.query(`
            UPDATE users
            SET is_loggedIn = $1
            WHERE id = $2
            RETURNING *
        `, [false, id])

    .catch((e) => {

        console.log(e);

        throw new Error("could not logout user")
    });

    return logout.rows[0];
};


export const changePassword = async (password: string, userId: number) => {

    let pword

    bcrypt.genSalt(saltRounds, function(err, salt) {

        pword = bcrypt.hash(password, salt, async function(err, hash) {

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

    console.log(pword)

    if(pword) return true
   
}