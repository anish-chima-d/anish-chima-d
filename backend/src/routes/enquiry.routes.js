const router = require("express").Router();
const { create, list } = require("../controllers/enquiry.controller");

router.post("/", create);
router.get("/", list);

module.exports = router;
