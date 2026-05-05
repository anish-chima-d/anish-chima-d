const router = require("express").Router();
const { list, create } = require("../controllers/review.controller");

router.get("/", list);
router.post("/", create);

module.exports = router;
