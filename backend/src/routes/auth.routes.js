const router = require("express").Router();
const { registerController, requestOtpController, verifyOtpController } = require("../controllers/auth.controller");

router.post("/register", registerController);
router.post("/request-otp", requestOtpController);
router.post("/verify-otp", verifyOtpController);

module.exports = router;
