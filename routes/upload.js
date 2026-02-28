const upload = require("../middleware/upload");
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Single image upload — field name must match what the frontend sends
router.post("/", authMiddleware(["admin", "boutique"]), upload.array("image"), async (req, res) => {
    try {
        console.log("Files:", req.files);

        const imageUrls = req.files.map(file => `/uploads/categories/${file.filename}`);

        res.status(201).json({ message: "Images uploaded successfully", imageUrls });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;