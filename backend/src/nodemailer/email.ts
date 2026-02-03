import nodemailer from 'nodemailer';
//import sgMail from '@sendgrid/mail'
import type { UUID } from 'crypto';
import type { UUIDTypes } from 'uuid';
import { Resend } from 'resend';

//sgMail.setApiKey(process.env.SENDGRID_APIKEY!);

// const resendAPI = process.env.RESEND_APIKEY

// const resend = new Resend(resendAPI)

const fromEmail = process.env.EMAIL
 
const url = 'https://movie-streamer-backend.onrender.com/users/verify_user';


/*

export const resendEmail = async (name:string, email:string, id:number) => {

    console.log(name, email, id)

    console.log(resendAPI)
    
    const { data, error } = await resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        to: ['delivered@resend.dev'],
        subject: 'Hello World',
        html: '<strong>It works!</strong>',
    });
    
    if(error){
        
        console.error(error);
    }
    
    console.log(data);

    const response = await fetch('https://api.resend.com/emails', {

        method: 'POST', 

        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendAPI}`
        },

        body: JSON.stringify({
            from: fromEmail,
            to: ['lewiswootton88@gmail.com'],
            subject: 'Resend Test',
            text: 'has it sent? i hope so!'
        })
    })

    console.log("57", response)

    throw new Error('test')
    
}

*/




/*
export const sendMailSendGrid = async (name:string, email:string, id:number) => {

    //console.log(process.env.SENDGRID_APIKEY)

    const msg = {
        from: process.env.EMAIL!,
        to: "lewiswootton88@gmail.com",
        subject: 'new user request for luluflix',
        html: `<p>A new user: ${name}, has registered on luluflix with an email of: ${email}</p>
                <p>Click this link to accept them..</p>
                <a href=${url}?token=${id}><b>${url}?token=${id}</b></a>`
    };


    await sgMail.send(msg)

    .then(() => {

        console.log('email sent successfully');
    })
    .catch((err) => {

        console.error('error sending mail', err);

        throw new Error('error sending mail', err);
    });

    return 'email sent successfully';
};

//email sent to newly verified user
export const sendGridToUser = async (guid: UUIDTypes, email: string) => {

    console.log(guid, email)

    const msg = {
        from: process.env.EMAIL!,
        to: email,
        subject: 'Login Details For Luluflix',
        html: `<p>You have been accepted to join LuluFlix, all you need to do is login with this code each time..</p>
                <p><b>${guid}</b></p>
                <p>We understand you have a choice of streaming services and are happy you chose us.</p>
                <p>Many thanks from the LuluFlix team :)</p>`
    };

    sgMail.send(msg)

    .then(() => {

        console.log('message sent successfully');
    })
    .catch((err) => {

        console.error('error sending mail', err);

        throw new Error('error sending mail', err);
    });

    return 'email sent successfully';
}

 */

//email sent to a newly verified user
export const sendMailToUser = async (guid: UUID, email:string) => {

    const subject = "Login Details For LuluFlix";

    try{
         const transporter = nodemailer.createTransport({

            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS
            }
        });

        transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: subject,
            html: `<p>You have been accepted to join LuluFlix, all you need to do is login with this code each time..</p>
                   <p><b>${guid}</b></p>
                   <p>We understand you have a choice of streaming services and are happy you chose us.</p>
                   <p>Many thanks from the LuluFlix team :)</p>`
        }, function(error, info){

            if(error){

                console.log(error);

                throw new Error(`error sending mail. ${error}`);

            }else {

                return {

                    payload: info,
                    status: "success"
                }
            }
        });

    }catch(err){

        console.log(err);
    }
  
    return;
}

// email sent to admin to verify a new user registration
export const sendMailToAdmin = async (name: string, email: string, id: number) => {


    const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS
            },
    });
    
    try{

        transporter.sendMail({
            from: process.env.EMAIL,
            to: "lewiswootton88@gmail.com",
            subject: "new user request",
            html: `<p>A new user: ${name}, has registered on luluflix with an email of: ${email}</p>
                    <p>Click this link to accept them..</p>
                    <a href=${url}?token=${id}><b>${url}?token=${id}</b></a>`

        }, (error, info) => {

            if(error){

                console.log(error);

                throw new Error(`mail not sent`)
            
            }else{

                return {

                    payload: info,
                    status: "success"
                }
            }
        });

    }catch(err){

        console.log(err);

        throw new Error(`mail not sent`)
    };

    return;

}

