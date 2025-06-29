// 📁 routes/trade.js
const express = require('express')
const router = express.Router()

// Example trade route
router.get('/', (req, res) => {
  res.json({ message: 'Trade route working' })
})

module.exports = router


// 📁 routes/kyc.js
const express = require('express')
const router = express.Router()

// Example KYC route
router.get('/', (req, res) => {
  res.json({ message: 'KYC route working' })
})

module.exports = router


// 📁 routes/admin.js
const express = require('express')
const router = express.Router()

// Example admin route
router.get('/', (req, res) => {
  res.json({ message: 'Admin route working' })
})

module.exports = router
