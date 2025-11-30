const Student = require('../models/Student');
const Alumni = require('../models/Alumni');
const Teacher = require('../models/Teacher');
const TPO = require('../models/TPO');
const CollegeList = require('../models/CollegeList');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTPEmail } = require('../services/emailService');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Step 1: Initial signup - validate data and send OTP
exports.signup = async (req, res) => {
  try {
    const { name, prn, passout, email, password, role } = req.body;

    // Check if email already exists in any collection
    const existingUser = 
      (await Student.findOne({ email })) ||
      (await Alumni.findOne({ email })) ||
      (await Teacher.findOne({ email })) ||
      (await TPO.findOne({ email }));
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Validate student against college list if role is student
    if (role === 'student') {
      console.log('Signup attempt:', { name, prn });
      
      // Try both field name formats (flexible for database schema variations)
      const exists = await CollegeList.findOne({
        $or: [
          {
            $and: [
              { $expr: { $eq: [ { $toLower: { $trim: { input: "$Student Name" } } }, name.trim().toLowerCase() ] } },
              { $expr: { $eq: [ { $toString: "$PRN" }, prn.trim().toString() ] } }
            ]
          },
          {
            $and: [
              { $expr: { $eq: [ { $toLower: { $trim: { input: "$name" } } }, name.trim().toLowerCase() ] } },
              { $expr: { $eq: [ { $toString: "$prn" }, prn.trim().toString() ] } }
            ]
          }
        ]
      });
      
      if (!exists) {
        console.log('Not found in collegelist:', { name, prn });
        return res.status(400).json({ error: 'Name and PRN not found in college list. Please contact admin.' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();

    // Remove any existing OTP for this email
    await OTP.deleteMany({ email });

    // Store user data and OTP temporarily
    const otpRecord = new OTP({
      email,
      otp,
      userData: {
        name,
        prn,
        passout,
        email,
        password: hashedPassword,
        role
      }
    });
    await otpRecord.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, name);
    
    if (!emailResult.success) {
      // Remove OTP record if email failed
      await OTP.deleteOne({ email });
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    res.status(200).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      requiresOTP: true,
      email: email
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// Step 2: Verify OTP and complete registration
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, otp });
    
    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Extract user data from OTP record
    const { name, prn, passout, password, role } = otpRecord.userData;

    // Create user in appropriate collection based on role
    let user;
    if (role === 'student') {
      user = new Student({ name, prn, email, password, role });
    } else if (role === 'alumni') {
      user = new Alumni({ name, passout, email, password, role });
    } else if (role === 'teacher') {
      user = new Teacher({ name, email, password, role });
    } else if (role === 'tpo') {
      user = new TPO({ name, email, password, role });
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await user.save();

    // Clean up OTP record
    await OTP.deleteOne({ email, otp });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration completed successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user in all collections
    let user = await Student.findOne({ email }) ||
               await Alumni.findOne({ email }) ||
               await Teacher.findOne({ email }) ||
               await TPO.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};