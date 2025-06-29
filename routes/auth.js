const express = require('express')
const router = express.Router()
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body
    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ message: 'User exists' })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = new User({
      email,
      passwordHash,
      otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000)
    })

    await newUser.save()

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'OTP Verification',
      html: `<p>Your OTP is <strong>${otp}</strong>.</p>`
    })

    res.status(200).json({ message: 'OTP sent' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// OTP Verify
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body
  const user = await User.findOne({ email })
  if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' })
  }

  user.isVerified = true
  user.otp = null
  user.otpExpiry = null
  await user.save()

  res.status(200).json({ message: 'Verified' })
})

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email })
  if (!user || !user.isVerified) return res.status(400).json({ message: 'Not verified' })

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(400).json({ message: 'Wrong password' })

  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' })

  res.status(200).json({ token, email: user.email })
})

module.exports = router
