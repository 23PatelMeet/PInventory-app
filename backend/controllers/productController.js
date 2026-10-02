const asyncHendler = require("express-async-handler");
const Prodect = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;
// cloudinary.config({ 
//   cloud_name: 'dtmjp4r8m', 
//   api_key: '488658922821487', 
//   api_secret: '<your_api_secret>' // Click 'View API Keys' above to copy your API secret
// });
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createProduct = asyncHendler(async (req, res) => {
  //res.send("Product Created");
  const { name, sku, category, quantity, price, description } = req.body;

  // Validation
  if (!name || !category || !quantity || !price || !description) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  // Handle Image Upload
  let fileData = {};

  if (req.file) {
    //Save image to clodinary
    let uploadedFile;
    uploadedFile = await cloudinary.uploader.upload(req.file.path, { folder: "Pinvent App", resource_type: "image",});
    /*const uploadResult = await cloudinary.uploader
       .upload(req.file.path, { 
        folder: "Pinvent App", 
        resource_type: "image",
      })
    try {
      
      uploadedFile = await cloudinary.uploader.upload(req.file.path, { 
        folder: "Pinvent App", 
        resource_type: "image",
      })
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }*/

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Create Product
  const product = await Prodect.create({
    user: req.user.id,
    name,
    sku,
    category,
    quantity,
    price,
    description,
    image: fileData,
  });

  res.status(201).json(product);
});

// Get all products
const getProducts = asyncHendler (async (req, res) => {
  //res.send("Get Products");
  const products = await Prodect.find({user: req.user.id}).sort("-createdAt");
  res.status(200).json(products);
});

// Get singel product
const getProduct = asyncHendler (async (req, res) => {
  //res.send("Singel Product");
  const product = await Prodect.findById(req.params.id);
  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error("Product Not Found");
  }
  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(404);
    throw new Error("User not authorized");
  }
  res.status(200).json(product);
});

// Delete Product
const deletrProduct = asyncHendler (async (req, res) => {
  //res.send("Delete Product");
  const product = await Prodect.findById(req.params.id);
  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error("Product Not Found");
  }
  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(404);
    throw new Error("User not authorized");
  }
  //await product.remove();
  await product.deleteOne({ _id: product });
  res.status(200).json(product);
});


// Update Product
const updateProduct = asyncHendler (async (req, res) => {
  //res.send("Update Product");
  const { name, category, quantity, price, description } = req.body;
  const {id} = req.params
  const product = await Prodect.findById(id);

  if (!product) {
    res.status(404);
    throw new Error("Product Not Found");
  }
  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(404);
    throw new Error("User not authorized");
  }
  // Handle Image Upload
  let fileData = {};
  if (req.file) {
    //Save image to clodinary
    let uploadedFile;
    /*const uploadResult = await cloudinary.uploader
       .upload(req.file.path, { 
        folder: "Pinvent App", 
        resource_type: "image",
      })*/
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, { folder: "Pinvent App", resource_type: "image",});
    } catch (error) {
      console.error("Cloudinary image upload failed:", {
        message: error.message,
        http_code: error.http_code,
      });
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Update Product

  const updatedProduct = await Prodect.findByIdAndUpdate(
    {_id: id},
    {
      name,
      category,
      quantity,
      price,
      description,
      image: Object.keys(fileData).length === 0 ? product.image : fileData,
    },
    {
      new: true,
      tunValidators: true
    }
  )

  res.status(200).json(updatedProduct);
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deletrProduct,
  updateProduct,
};
