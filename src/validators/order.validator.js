const { body } = require('express-validator');


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


module.exports = {

    orderStatusValidator

};
