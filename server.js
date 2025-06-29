require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const bodyParser = require('body-parser')

const app = express()
app.use(cors())
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))

// ✅ Step 4: Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')))

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err))

// ✅ All Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/trade', require('./routes/trade'))
app.use('/api/kyc', require('./routes/kyc'))
app.use('/api/admin', require('./routes/admin'))

// ✅ Mongoose User Model
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date }
})
const User = mongoose.model('User', UserSchema)

// ✅ Nodemailer setup
const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// ✅ Signup Route
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

    const userExist = await User.findOne({ email })
    if (userExist) return res.status(400).json({ message: 'User already exists' })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const newUser = new User({
      email,
      passwordHash,
      otp,
      otpExpiry,
      isVerified: false
    })
    await newUser.save()

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Verification Code',
      html: `<p>Your OTP code is <b>${otp}</b>. It expires in 10 minutes.</p>`
    })

    return res.status(200).json({ message: 'OTP sent to email' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})

// ✅ Verify OTP Route
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'User not found' })
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' })
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' })
    if (user.otpExpiry < new Date()) return res.status(400).json({ message: 'OTP expired' })

    user.isVerified = true
    user.otp = null
    user.otpExpiry = null
    await user.save()

    return res.status(200).json({ message: 'Email verified successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})

// ✅ Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'Invalid credentials' })
    if (!user.isVerified) return res.status(400).json({ message: 'Email not verified' })

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' })

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' })

    return res.status(200).json({ token, email: user.email })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})

// ✅ Step 7: Fallback route to serve frontend SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'))
})

// ✅ Step 8: Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
