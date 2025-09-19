import nodemailer from 'nodemailer';

const url = 'https://movie-streamer-backend.onrender.com/users/verify_user';


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
            service: 'gmail',
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
        })
    }catch(err){
        console.log(err)
    }
}