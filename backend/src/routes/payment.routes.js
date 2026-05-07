const router = require("express").Router();
const { listPaymentMethods } = require("../controllers/payment.controller");

router.get("/methods", listPaymentMethods);

module.exports = router;
