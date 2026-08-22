const assert = require("node:assert/strict");
const test = require("node:test");
const mongoose = require("mongoose");

const Order = require("../src/models/order.model");

const createValidOrderData = () => ({
  user: new mongoose.Types.ObjectId(),
  address: new mongoose.Types.ObjectId(),
  products: [
    {
      product: new mongoose.Types.ObjectId(),
      quantity: 2,
      price: 250,
    },
  ],
  totalAmount: 500,
});

test("order model accepts a complete order with address reference", async () => {
  const order = new Order(createValidOrderData());

  await assert.doesNotReject(order.validate());
});

test("order model requires at least one product", async () => {
  const order = new Order({
    ...createValidOrderData(),
    products: [],
  });

  await assert.rejects(order.validate(), (err) => {
    assert.equal(err.name, "ValidationError");
    assert.equal(err.errors.products.message, "Order must contain at least one product");
    return true;
  });
});

test("order model requires the selected address reference", async () => {
  const order = new Order({
    ...createValidOrderData(),
    address: undefined,
  });

  await assert.rejects(order.validate(), (err) => {
    assert.equal(err.name, "ValidationError");
    assert.equal(err.errors.address.kind, "required");
    return true;
  });
});
