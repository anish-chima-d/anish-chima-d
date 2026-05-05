const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { create, list, getOne, cancel, requestReturn } = require("../controllers/order.controller");

router.use(requireAuth);
router.post("/", create);
router.get("/", list);
router.get("/:id", getOne);
router.patch("/:id/cancel", cancel);
router.patch("/:id/return", requestReturn);

module.exports = router;
