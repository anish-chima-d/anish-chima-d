const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { getCart, addItem, updateItem, removeItem, clear } = require("../controllers/cart.controller");

router.use(requireAuth);
router.get("/", getCart);
router.post("/items", addItem);
router.patch("/items/:productId", updateItem);
router.delete("/items/:productId", removeItem);
router.delete("/", clear);

module.exports = router;
