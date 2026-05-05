const router = require("express").Router();
const { list, create } = require("../controllers/searchHistory.controller");

router.get("/", list);
router.post("/", create);

module.exports = router;
