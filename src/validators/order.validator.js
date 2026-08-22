const { body, param } = require('express-validator');

const createOrderValidator = [

    body('addressId')

        .notEmpty()

        .withMessage('Address ID is required')

        .isMongoId()

        .withMessage('Invalid address ID')

];

const orderStatusValidator = [

    body('status')

        .notEmpty()

        .withMessage('Status is required')

        .isIn([

            'pending',
            'processing',
            'shipped',
            'delivered',
            'cancelled'

        ])

        .withMessage('Invalid order status')

];

const orderIdValidator = [

    param('id')

        .isMongoId()

        .withMessage('Invalid order ID')

];


module.exports = {

    createOrderValidator,
    orderIdValidator,
    orderStatusValidator

};
