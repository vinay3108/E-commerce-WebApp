const Product=require('../models/productModel');
const ErrorHandler = require('../utils/errorhandler');
const catchAsyncErrors=require('../middleware/catchAsyncErrors');
const ApiFeatures=require('../utils/apifeatures');



//Create product --Admin

exports.createProduct = catchAsyncErrors( async ( req, res, next ) =>
{
    req.body.user = req.user.id;
    const product=await Product.create(req.body);
    res.status(201).json({
        success:true,
        product
    })
});


//Get All the Products
exports.getAllProducts=catchAsyncErrors( async(req,res)=>{

    const resultPerPage = 4;
    const productsCount = await Product.countDocuments();
    let apiFeature = new ApiFeatures( Product.find( ), req.query )
        .search()
        .filter()
        .pagination( resultPerPage );
        let products = await apiFeature.query;

        let filteredProductsCount = products.length;

        apiFeature.pagination(resultPerPage);

    // let products = await apiFeature.query;
    
    res.status(200).json({
      success: true,
      products,
      productsCount,
      resultPerPage,
      filteredProductsCount,
    });
} );

//Get Product Details

exports.getProductDetails=catchAsyncErrors( async(req,res,next)=>{
   const product=await Product.findById(req.params.id);
  
   if(!product)
   {
       return next(new ErrorHandler("Product Not Found",404));

    }

    res.status(200).json({
      success: true,
      product,
    
    });

});


//Update Product --Admin

exports.updateProduct=catchAsyncErrors( async(req,res,next)=>{
    let product =await Product.findById(req.params.id);
    if(!product)
   {
       return next(new ErrorHandler("Product Not Found",404));

    }
    product =await Product.findByIdAndUpdate(req.params.id,req.body,{new:true,
    runValidators:true,
    useFindAndModify:false,
    });

    res.status(200).json({
        success:true,
        product
    })

});


//Delete product

exports.deleteProduct=catchAsyncErrors( async(req,res,next)=>{
   const product=await Product.findById(req.params.id);
   if(!product)
   {
       return next(new ErrorHandler("Product Not Found",404));

    }
    
    await product.remove();
    res.status(200).json({
        success:true,
        Message: "Product Deleted Successfully"
    })
    
} );

//Get All Reviews of a product

exports.getProductReviews = catchAsyncErrors( async ( req, res, next ) =>
{
    const product = await Product.findById( req.query.id );
    if ( !product )
    {
        return next( new ErrorHandler( "Product Not Found", 404 ) );
    }
    res.status( 200 ).json( {
        success: true,
        reviews: product.reviews,
    } );
} );

//Delete Review

exports.deleteReview = catchAsyncErrors( async ( req, res, next ) =>{
    const product = await Product.findById(req.query.productId);
    
    if ( !product )
    {
        return next(new ErrorHandler("Product Not Found", 404));
    }
    const reviews = product.reviews.filter( rev => rev._id.toString() !== req.query.id.toString() );

    let avg = 0;

    product.reviews.forEach( ( rev ) =>{
        avg += rev.rating;
    } )
    let ratings = 0;
    if ( reviews.length === 0 )
    {
        rating = 0;
    }
    else{
        
        ratings = avg / reviews.length;
    }
    const numOfReviews = reviews.length;
    await Product.findByIdAndUpdate( req.query.productId, {
        reviews,
        ratings,
        numOfReviews,

    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    } );
    res.status(200).json({
      success: true,
      reviews: product.reviews,
    });
} );
