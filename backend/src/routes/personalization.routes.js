const router = require("express").Router();
const { getPersonalization } = require("../controllers/personalization.controller");

router.post("/", getPersonalization);

module.exports = router;
