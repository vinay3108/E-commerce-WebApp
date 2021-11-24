const mongoose=require('mongoose');
const connectDatabase=()=>{

    mongoose.connect(process.env.DB_URI,{useNewUrlParser:true})
    .then((data)=>{
        console.log(`Mongodb Connected with server: ${data.connection.host}`);
        
    });
    // we dont use catch because we want unhamdled error for more see server.js
    // .catch((err)=>{
    //     console.log(err);
    // })
}

module.exports=connectDatabase;