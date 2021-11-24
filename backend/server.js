const app=require('./app');
const dotenv = require( 'dotenv' );
const cloudinary = require( 'cloudinary' );
const connectDatabase=require('./config/databse');
//Handling Uncaught Exception

process.on('uncaughtException',(err)=>{
    console.log(`Error :${err.message}`);
    console.log(`Shutting Down the server due to uncaught Exception`);
    server.close(()=>{
        process.exit(1);
    });

});


//Config

dotenv.config({path:'backend/config/config.env'});

//Connecting to the Database

connectDatabase();


cloudinary.config( {
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
} );


const server=app.listen(process.env.PORT,()=>{
    console.log(`Server is working on  https://localhost:${process.env.PORT}`)
})


//Unhandled Promise Rejection

process.on('unhandledRejection',err=>{
    console.log(`Error : ${err.message}`);
    console.log(`Shutting Down the server due to unhandled Promise Rejection`);
    server.close(()=>{
        process.exit(1);
    });
});

