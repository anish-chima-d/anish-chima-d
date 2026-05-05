const { asyncHandler } = require("../lib/asyncHandler");
const { createEnquiry, listEnquiries } = require("../services/enquiry.service");

const create = asyncHandler(async (req, res) => {
  const enquiry = await createEnquiry(req.body);
  res.status(201).json({ enquiry });
});

const list = asyncHandler(async (req, res) => {
  const enquiries = await listEnquiries();
  res.json({ enquiries });
});

module.exports = { create, list };
