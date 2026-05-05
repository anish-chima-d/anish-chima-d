const router = require("express").Router();
const { registerController, requestOtpController, verifyOtpController, demoLoginController } = require("../controllers/auth.controller");

router.post("/register", registerController);
router.post("/request-otp", requestOtpController);
router.post("/verify-otp", verifyOtpController);
router.post("/demo-login", demoLoginController);

module.exports = router;
