import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_APIKEY!);
 
const url = 'https://movie-streamer-backend.onrender.com/users/verify_user';



export const sendMailSendGrid = async (name:string, email:string, id:string) => {

    console.log(process.env.EMAIL)
    const msg = {
        from: process.env.EMAIL!,
        to: "lewiswootton88@gmail.com",
        subject: 'working?',
        html: `<p>A new user: ${name}, has registered on luluflix with an email of: ${email}</p>
                <p>Click this link to accept them..</p>
                <p><b>${url}?token=${id}</b></p>`
    };

    try{

        const response = await sgMail.send(msg);

        console.log("email sent", response[0].statusCode);

    }catch(err){

        console.log(err);
        
        throw new Error("email failed to send via sendgrid")
    }
}

 

//email sent to a newly verified user
export const sendMailToUser = async (guid:string, email:string) => {

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
  
}

// email sent to admin to verify a new user registration
export const sendMailToAdmin = async (name:string, email:string, id:string) => {

    console.log("54", email, name, id)

    try{

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS
            }
        });

        transporter.sendMail({
            from: process.env.EMAIL,
            to: "lewiswootton88@gmail.com",
            subject: "new user request",
            html: `<p>A new user: ${name}, has registered on luluflix with an email of: ${email}</p>
                    <p>Click this link to accept them..</p>
                    <p><b>${url}?token=${id}</b></p>`

        }, (error, info) => {

            if(error){

                console.log(error);
            
            }else{

                console.log(info);
            }
        });

    }catch(err){

        console.log(err);
    };
}