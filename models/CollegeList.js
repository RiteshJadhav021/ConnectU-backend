const mongoose = require('mongoose');

const collegeListSchema = new mongoose.Schema({
  'Student Name': String,  // Original field name with space and capitals
  'PRN': String,           // Original field name in capitals
  name: String,            // Alternative lowercase field name
  prn: String,             // Alternative lowercase field name
  // Add other fields if needed
}, { strict: false });     // Allow flexible schema to accept any fields from database

module.exports = mongoose.model('CollegeList', collegeListSchema, 'collegelist');
