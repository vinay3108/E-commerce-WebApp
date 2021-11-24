const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require( '../models/userModel' );
const sendToken = require( "../utils/jwtToken" );
const sendEmail = require( '../utils/sendEmail' );
const crypto = require( 'crypto' );
const Product = require( "../models/productModel" );
const cloudinary = require( 'cloudinary' );
//Register a User

exports.registerUser = catchAsyncErrors( async ( req, res, next ) =>
{
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });
    const { name, email, password } = req.body;
    const user = await User.create( {
        name, email, password,
        avatar: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        },
    } );

    sendToken(user, 201, res);
    
} );

exports.loginUser = catchAsyncErrors( async ( req, res, next ) =>
{
    const { email, password } = req.body;
    
    //Checking If User has Given password and email Both

    if ( !email || !password )
    {
        return next( new ErrorHandler( "Please Enter Email & Password", 400 ) )
    }

    const user = await User.findOne( { email } ).select( "+password" );

    if ( !user )
    {
        return next( new ErrorHandler( "invalid Email or Password", 401 ) );

    }
    
    const isPasswordMatched = await user.comparePassword( password );
    if ( !isPasswordMatched )
    {
        return next( new ErrorHandler( "invalid Email or Password", 401 ) );

    }

    sendToken( user, 200, res );
        

    
} );

//Logout User 

exports.logout = catchAsyncErrors( async ( req, res, next ) =>
{
    res.cookie( "token", null, {
        expires: new Date( Date.now() ),
        httpOnly:true,
    })
    res.status( 200 ).json( {
        success: true,
        message:"Logged Out",
    })
})


//Forgot Password

exports.forgotPassword = catchAsyncErrors( async ( req, res, next ) =>{
    const user = await User.findOne( { email: req.body.email } );
    if ( !user ){
        return next( new ErrorHandler( 'User Not Found', 404 ) );
    }

    //get reset Password Token
    const resetToken = user.getResetPasswordToken();
    await user.save( { validateBeforeSave: false } );

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${ resetToken }`;

    const message = `Your Password reset Token is:\n \n ${ resetPasswordUrl } \n\n If You have Not requested Then please Ignore it.`;
    try{
        await sendEmail( {
            email: user.email,
            subject: `Ecommerce Password recovery`,
            message,
        } )
        res.status( 200 ).json( {
            success: true,
            message: `Email Sent to ${ user.email } Successfully`,
        })
    } catch ( error ){
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save( { validateBeforeSave: false } );
        
        return next( new ErrorHandler( error.message, 500 ) );

    }
    
} )

exports.resetPassword = catchAsyncErrors( async ( req, res, next ) =>{
    
    //Creating Token hash
    const resetPasswordToken = crypto
        .createHash( 'sha256' )
        .update( req.params.token )
        .digest( 'hex' );
    
    const user = await User.findOne( {
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    } );

    if ( !user )
    {
        return next( new ErrorHandler( 'Reset Password Token is Invalid or has been Expired', 404 ) );
    }
    
    if ( req.body.password !== req.body.confirmPassword ){
        
        return next( new ErrorHandler( 'Password does not match', 404 ) );
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    sendToken( user, 200, res );
} )


//Get User Detail

exports.getUserDetails = catchAsyncErrors( async ( req, res, next ) =>{
    const user = await User.findById( req.user.id );
    res.status( 200 ).json({
        success: true,
        user,
    })
} )


//Update User Password

exports.updatePassword = catchAsyncErrors( async ( req, res, next ) =>{
    const user = await User.findById( req.user.id ).select( "+password" );

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Old Password is incorrect", 400));
    }
    
    if ( req.body.newPassword !== req.body.confirmPassword ){
        return next(new ErrorHandler("Password does not match", 400));
        
    }

    user.password = req.body.newPassword;
    await user.save();
    
    sendToken( user, 200, res );

} )


//Update User Profile

exports.updateProfile = catchAsyncErrors( async ( req, res, next ) =>{   
    const newUserData = {
        name: req.body.name,
        email:req.body.email,
    }
    if ( req.body.avatar !== "" )
    {
        const user = await User.findById( req.user.id );
        const imageId = user.avatar.public_id;
        await cloudinary.v2.uploader.destroy( imageId );
        
        const myCloud = await cloudinary.v2.uploader.upload( req.body.avatar, {
            folder: "avatars",
            width: 150,
            crop: "scale",
            
        } );

        newUserData.avatar = {
            public_id: myCloud.public_id,
            url:myCloud.secure_url,
        }
    }
    
    const user =await User.findByIdAndUpdate( req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify:false,
    } )
    res.status( 200 ).json( {
        success: true,
       
    })
    sendToken( user, 200, res );

} )


//Get All Users (admin)

exports.getAllUsers = catchAsyncErrors( async ( req, res, next ) =>
{
    const users = await User.find( {} );
    res.status( 200 ).json( {
        success: true,
        users,
    } );
} );

//Get Single Users (admin)

exports.getSingleUser = catchAsyncErrors( async ( req, res, next ) =>
{
    const user = await User.findById( req.params.id );

    if ( !user )
    {
        return next(
            new ErrorHandler( `User Does not Exist With Id: ${ req.params.id }` )
        );
    }

    res.status( 200 ).json( {
        success: true,
        user,
    } );
} );

//Update User Role --Admin

exports.updateUserRole = catchAsyncErrors( async ( req, res, next ) =>
{
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    }

    //We will add cloudinary later
    const user = await User.findByIdAndUpdate( req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    } )
    res.status( 200 ).json( {
        success: true,
       
    } )
   

} );

//Delete User Role --Admin

exports.deleteUser = catchAsyncErrors( async ( req, res, next ) =>
{
 
    const user = await User.findById( req.params.id );
    if ( !user )
    {
        return next(
            new ErrorHandler( `User Does Not exist with id : ${ req.params.id }`, 400 )
        );
    }
    //We will remove  cloudinary later
    await user.remove();
    res.status( 200 ).json( {
        success: true,
        message: "User Deleted Successfully",
    } );
   

} );


//Create New Review or Update The Review
exports.createProductReview = catchAsyncErrors( async ( req, res, next ) =>{
    const { rating, comment, productId } = req.body;

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number( rating ),
        comment,

    };

    const product = await Product.findById( productId );
    const isReviewed = product.reviews.find( rev => rev.user.toString() === req.user._id.toString() );

    if ( isReviewed ){
        product.reviews.forEach( rev =>{
            if ( rev.user.toString() === req.user._id.toString() ){
                rev.rating = rating;
                rev.comment = comment;
            }
        })
    }
    else{
        product.reviews.push( review );
        product.numOfReviews = product.reviews.length; 
    }
    // 4,5,5,2 =16 /4 = 4
    
    let avg = 0;
    product.ratings = product.reviews.forEach( rev =>
    {
        avg += rev.rating;
    } )
    product.ratings = avg / product.reviews.length;
    await product.save( { validateBeforeSave: false } );

    res.status( 200 ).json( {
        success: true
    } );
})