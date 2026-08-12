const { body, param } = require("express-validator");

const cartValidator = [
  body("productId")
    .custom((value, { req }) => {
      const productId = value || req.body.product;

      if (!productId) {
        throw new Error("Product ID is required");
      }

      if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
        throw new Error("Product ID must be a valid Mongo ID");
      }

      return true;
    }),
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ gt: 0 })
    .withMessage("Quantity must be a positive integer")
    .toInt(),
];

const cartProductParamValidator = [
  param("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Product ID must be a valid Mongo ID"),
];

module.exports = {
  cartValidator,
  cartProductParamValidator,
};
