const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dlbyu8g36', // replace with your Cloudinary cloud name
  api_key: '165357584851976',      // replace with your Cloudinary API key
  api_secret: 'JJZqJ0hvGht-pfubjfftIRVy9KE' // replace with your Cloudinary API secret
});

module.exports = cloudinary;
