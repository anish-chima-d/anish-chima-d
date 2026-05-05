const router = require("express").Router();
const { requestOtpController, verifyOtpController } = require("../controllers/auth.controller");

router.post("/request-otp", requestOtpController);
router.post("/verify-otp", verifyOtpController);

module.exports = router;
