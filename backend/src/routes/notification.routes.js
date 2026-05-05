const router = require("express").Router();
const { list, create } = require("../controllers/notification.controller");

router.get("/", list);
router.post("/", create);

module.exports = router;
