const mongoose = require('mongoose');

const collegeListSchema = new mongoose.Schema({
  name: String,
  prn: String,
  // Add other fields if needed
});

module.exports = mongoose.model('CollegeList', collegeListSchema, 'collegelist');
