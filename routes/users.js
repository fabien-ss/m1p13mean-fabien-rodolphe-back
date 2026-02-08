var express = require('express');
var router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User endpoints
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: respond with a resource
 */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;