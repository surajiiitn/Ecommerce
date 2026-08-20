const { body, param } = require('express-validator');

const addressValidator = [

    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Full name is required'),

    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Invalid phone number'),

    body('addressLine')
        .trim()
        .notEmpty()
        .withMessage('Address line is required'),

    body('city')
        .trim()
        .notEmpty()
        .withMessage('City is required'),

    body('state')
        .trim()
        .notEmpty()
        .withMessage('State is required'),

    body('pincode')
        .trim()
        .notEmpty()
        .withMessage('Pincode is required')
        .matches(/^\d{6}$/)
        .withMessage('Pincode must be 6 digits'),

    body('country')
        .trim()
        .notEmpty()
        .withMessage('Country is required')
];


const updateAddressValidator = [

    param('id')
        .isMongoId()
        .withMessage('Invalid address ID'),

    body('fullName')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Full name cannot be empty'),

    body('phone')
        .optional()
        .trim()
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Invalid phone number'),

    body('addressLine')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Address line cannot be empty'),

    body('city')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('City cannot be empty'),

    body('state')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('State cannot be empty'),

    body('pincode')
        .optional()
        .trim()
        .matches(/^\d{6}$/)
        .withMessage('Pincode must be 6 digits'),

    body('country')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Country cannot be empty')
];


const addressIdValidator = [

    param('id')
        .isMongoId()
        .withMessage('Invalid address ID')

];


module.exports = {
    addressValidator,
    updateAddressValidator,
    addressIdValidator
};