const router = require("express").Router();
const { getHomeStorefront } = require("../controllers/storefront.controller");

router.get("/home", getHomeStorefront);

module.exports = router;
