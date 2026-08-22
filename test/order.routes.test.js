const assert = require("node:assert/strict");
const test = require("node:test");

const router = require("../src/routes/order.routes");

test("all order routes are registered", () => {
  const routes = router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).sort(),
    }));

  assert.deepEqual(routes, [
    { path: "/", methods: ["post"] },
    { path: "/", methods: ["get"] },
    { path: "/admin/all", methods: ["get"] },
    { path: "/:id", methods: ["get"] },
    { path: "/:id/cancel", methods: ["put"] },
    { path: "/:id/status", methods: ["put"] },
  ]);
});

test("admin orders route is registered before order id route", () => {
  const getRoutes = router.stack
    .filter((layer) => layer.route && layer.route.methods.get)
    .map((layer) => layer.route.path);

  assert.ok(getRoutes.includes("/admin/all"));
  assert.ok(getRoutes.includes("/:id"));
  assert.ok(getRoutes.indexOf("/admin/all") < getRoutes.indexOf("/:id"));
});
