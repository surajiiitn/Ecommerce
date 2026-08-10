// express validator

const { body } = require("express-validator");

const registerValidator = [
  body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required"),
  body("email")
        .isEmail()
        .withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const loginValidator = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Please provide a valid email address"),
    body("password")
        .notEmpty()
        .withMessage("Password is required"),
]

module.exports = {
    registerValidator,
    loginValidator
};
