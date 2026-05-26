import productModel from "../models/productModel.js";

// Debug API: fetch sample products from DB
export const getDebugProducts = async (req, res) => {
  try {
    const products = await productModel.find().limit(5);

    res.json({
      success: true,
      message: "Debug products fetched successfully",
      count: products.length,
      products: products,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};
