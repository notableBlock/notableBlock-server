const express = require("express");

const router = express.Router();

router.get("/", function (req, res, next) {
  res.json({ title: "Notable Block" });
});

module.exports = router;
