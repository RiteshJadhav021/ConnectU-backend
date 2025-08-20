const Student = require('../models/Student');
const Alumni = require('../models/Alumni');
const Teacher = require('../models/Teacher');
const TPO = require('../models/TPO');
const CollegeList = require('../models/CollegeList'); // This uses the 'collegelist' collection
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

exports.signup = async (req, res) => {
  try {
    const { name, prn, passout, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    let user;
    if (role === 'student') {
      // Debug: log incoming data
      console.log('Signup attempt:', { name, prn });
      // Check if student exists in collegelist (case-insensitive, trimmed, field names match DB, PRN as string)
      const exists = await CollegeList.findOne({
        $and: [
          { $expr: { $eq: [ { $toLower: { $trim: { input: "$Student Name" } } }, name.trim().toLowerCase() ] } },
          { $expr: { $eq: [ { $toString: "$PRN" }, prn.trim().toString() ] } }
        ]
      });
      if (!exists) {
        console.log('Not found in collegelist:', { name, prn });
        return res.status(400).json({ error: 'Name and PRN not found in college list' });
      }
      user = new Student({ name, prn, email, password: hashedPassword });
    } else if (role === 'alumni') {
      user = new Alumni({ name, passout, email, password: hashedPassword });
    } else if (role === 'teacher') {
      user = new Teacher({ name, email, password: hashedPassword });
    } else if (role === 'tpo') {
      user = new TPO({ name, email, password: hashedPassword });
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }
    await user.save();

    // Generate JWT and return user info
    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id, // Always include _id for frontend
        name: user.name,
        prn: user.prn,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists or invalid data' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  let user =
    (await Student.findOne({ email })) ||
    (await Alumni.findOne({ email })) ||
    (await TPO.findOne({ email })); // Now includes TPO
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

  // Create JWT payload
  const payload = { id: user._id, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: 'Login successful',
    token,
    user: {
      _id: user._id, // Always include _id
      name: user.name,
      prn: user.prn,
      email: user.email,
      role: user.role
    }
  });
};
