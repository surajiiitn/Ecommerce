const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");

const controllerPath = path.resolve(__dirname, "../src/controllers/order.controller.js");
const modelPaths = {
  user: path.resolve(__dirname, "../src/models/user.model.js"),
  cart: path.resolve(__dirname, "../src/models/cart.model.js"),
  order: path.resolve(__dirname, "../src/models/order.model.js"),
  product: path.resolve(__dirname, "../src/models/product.model.js"),
  address: path.resolve(__dirname, "../src/models/address.model.js"),
};

const defaultAddress = {
  _id: "64f000000000000000000001",
  user: "64f000000000000000000101",
  fullName: "Asha Rao",
  phone: "9876543210",
  addressLine: "12 MG Road",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411001",
  country: "India",
};

const createCart = () => ({
  items: [
    {
      product: {
        _id: "64f000000000000000000201",
        name: "Arabica Coffee",
        price: 250,
        stock: 10,
      },
      quantity: 2,
    },
  ],
  saveCount: 0,
  async save() {
    this.saveCount += 1;
  },
});

const mockModule = (filename, exports) => {
  const mockedModule = new Module(filename);
  mockedModule.filename = filename;
  mockedModule.exports = exports;
  mockedModule.loaded = true;
  require.cache[filename] = mockedModule;
};

const cleanupRequireCache = () => {
  delete require.cache[controllerPath];
  Object.values(modelPaths).forEach((filename) => {
    delete require.cache[filename];
  });
};

const loadCreateOrder = ({ cart = createCart(), findAddress } = {}) => {
  cleanupRequireCache();

  const calls = {
    cartFindOneQuery: null,
    cartPopulatePath: null,
    addressFindOneQuery: null,
    orderCreatePayload: null,
    productUpdates: [],
  };

  const Cart = {
    findOne(query) {
      calls.cartFindOneQuery = query;

      return {
        populate(pathName) {
          calls.cartPopulatePath = pathName;
          return Promise.resolve(cart);
        },
      };
    },
  };

  const Address = {
    findOne(query) {
      calls.addressFindOneQuery = query;
      return Promise.resolve(findAddress(query));
    },
  };

  const Order = {
    create(payload) {
      calls.orderCreatePayload = payload;
      return Promise.resolve({
        _id: "order-1",
        status: "pending",
        ...payload,
      });
    },
  };

  const Product = {
    findByIdAndUpdate(productId, update) {
      calls.productUpdates.push({ productId, update });
      return Promise.resolve();
    },
  };

  mockModule(modelPaths.user, {});
  mockModule(modelPaths.cart, Cart);
  mockModule(modelPaths.order, Order);
  mockModule(modelPaths.product, Product);
  mockModule(modelPaths.address, Address);

  const { createOrder } = require(controllerPath);

  return {
    createOrder,
    calls,
    cart,
  };
};

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

test.afterEach(() => {
  cleanupRequireCache();
});

test("creates order with valid addressId belonging to logged-in user", async () => {
  const cart = createCart();
  const { createOrder, calls } = loadCreateOrder({
    cart,
    findAddress: (query) => (
      query._id === defaultAddress._id && query.user === defaultAddress.user
        ? defaultAddress
        : null
    ),
  });
  const res = createResponse();

  await createOrder(
    {
      user: { id: defaultAddress.user },
      body: {
        addressId: defaultAddress._id,
        fullName: "Client Supplied Name",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.deepEqual(calls.addressFindOneQuery, {
    _id: defaultAddress._id,
    user: defaultAddress.user,
  });
  assert.equal(calls.orderCreatePayload.address, defaultAddress._id);
  assert.equal(calls.orderCreatePayload.shippingAddress, undefined);
  assert.equal(calls.orderCreatePayload.totalAmount, 500);
  assert.equal(cart.items.length, 0);
  assert.equal(cart.saveCount, 1);
});

test("fails when addressId does not exist", async () => {
  const { createOrder, calls } = loadCreateOrder({
    findAddress: () => null,
  });
  const res = createResponse();

  await createOrder(
    {
      user: { id: defaultAddress.user },
      body: { addressId: "64f000000000000000000099" },
    },
    res,
  );

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, {
    success: false,
    message: "Address not found",
  });
  assert.equal(calls.orderCreatePayload, null);
  assert.deepEqual(calls.productUpdates, []);
});

test("fails when addressId belongs to another user", async () => {
  const { createOrder, calls } = loadCreateOrder({
    findAddress: (query) => (
      query._id === defaultAddress._id && query.user === defaultAddress.user
        ? defaultAddress
        : null
    ),
  });
  const res = createResponse();

  await createOrder(
    {
      user: { id: "64f000000000000000000102" },
      body: { addressId: defaultAddress._id },
    },
    res,
  );

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "Address not found");
  assert.deepEqual(calls.addressFindOneQuery, {
    _id: defaultAddress._id,
    user: "64f000000000000000000102",
  });
  assert.equal(calls.orderCreatePayload, null);
});
