const express = require('express')
const router = express.Router()

// Example KYC route
router.get('/', (req, res) => {
  res.json({ message: 'KYC route working' })
})

module.exports = router
