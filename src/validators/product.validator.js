const {
    body
} = require("express-validator");

const productValidator = [
    body("name").notEmpty().withMessage("Product name is required"),
    body("description").notEmpty().withMessage("Product description is required"),
    body("price")
    .isFloat({
        gt: 0
    })
    .withMessage("Product is required and must be greater than 0"),
    body("category").notEmpty().withMessage("Product category is required"),
    body("image").notEmpty().withMessage("Product image is required"),
    body("stock").notEmpty().isInt({ gte: 0 }).withMessage("Product stock is required and must be a non-negative number")
];

module.exports = {
    productValidator
}