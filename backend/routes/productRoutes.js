const express=require('express');
const { getAllProducts,createProduct, updateProduct, deleteProduct, getProductDetails, getProductReviews, deleteReview } = require('../controllers/productController');
const { createProductReview } = require( '../controllers/userController' );
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const router=express.Router();

router.route("/products").get(getAllProducts);
router.route("/admin/product/new").post(isAuthenticatedUser, createProduct);
router
  .route("/admin/product/:id")
  .put(isAuthenticatedUser,authorizeRoles("admin"), updateProduct)
  .delete(isAuthenticatedUser,authorizeRoles("admin"), deleteProduct)
  
router.route( '/product/:id' ).get( getProductDetails );
router.route( '/review' ).put( isAuthenticatedUser, createProductReview );

router.route( '/reviews' )
  .get( getProductReviews )
  .delete(isAuthenticatedUser,deleteReview)


module.exports=router;