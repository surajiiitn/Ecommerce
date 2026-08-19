const { body } = require('express-validator');


const orderStatusValidator = [

    body('status')

        .notEmpty()

        .withMessage('Status is required')

        .isIn([

            'pending',
            'confirmed',
            'shipped',
            'delivered',
            'cancelled'

        ])

        .withMessage('Invalid order status')

];


module.exports = {

    orderStatusValidator

};