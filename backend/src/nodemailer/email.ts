import nodemailer from 'nodemailer';

const url = 'https://movie-streamer-backend.onrender.com/users/verify_user';

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
            text: `You have been accepted to join LuluFlix, all you need to do is login with this code each time.. \n <b>${guid}</b> \nWe understand you have a choice of streaming services and are happy you chose us. Many thanks from the LuluFlix team :)`
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
            text: `a new user: \n${name}\n has registered on luluflix with an email of:\n ${email}\n Click this link to accept them \n<b>${url}?token=${id}</b>`
        })
    }catch(err){
        console.log(err)
    }
}