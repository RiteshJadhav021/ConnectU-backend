# ConnectU Backend

A comprehensive backend API for ConnectU - a platform that connects students with alumni for mentorship, networking, and professional guidance. The platform facilitates meaningful connections between current students and graduated alumni, with additional support for Training and Placement Officers (TPO).

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Authentication & Authorization](#authentication--authorization)
- [File Upload & Media Management](#file-upload--media-management)
- [Real-time Communication](#real-time-communication)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🚀 Features

### Core Functionality
- **User Management**: Multi-role system supporting Students, Alumni, and TPO
- **Authentication**: JWT-based authentication with OTP email verification
- **Profile Management**: Complete profile management with photo uploads
- **Connection System**: Students can send connection requests to alumni
- **Messaging**: Real-time chat between connected users
- **Post Management**: Alumni and TPO can create, update, and delete posts
- **File Upload**: Cloudinary integration for image uploads
- **Email Notifications**: OTP verification and notification system

### User Roles
1. **Students**: Current college students seeking mentorship
2. **Alumni**: Graduated students offering guidance and mentorship
3. **TPO (Training & Placement Officer)**: College staff managing placements

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer + Cloudinary
- **Email Service**: Nodemailer
- **Real-time Communication**: Socket.IO
- **Environment Management**: dotenv
- **CORS**: Express CORS middleware

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- Cloudinary account for image storage
- Gmail account with app password for email service

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/RiteshJadhav021/ConnectU-backend.git
cd ConnectU-backend/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env file with your configuration
```

4. **Start the development server**
```bash
npm run dev
```

5. **Start the production server**
```bash
npm start
```

The server will start on port 5000 (or the port specified in your environment variables).

## 🔑 Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/connectu

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Cloudinary Configuration (Optional - already configured)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📊 Database Schema

### User Models

#### Student Schema
```javascript
{
  name: String,
  prn: String,           // Personal Registration Number
  email: String (unique),
  password: String (hashed),
  role: String (default: 'student'),
  img: String,           // Profile photo URL
  passout: String        // Graduation year
}
```

#### Alumni Schema
```javascript
{
  name: String,
  passout: String,       // Graduation year
  email: String (unique),
  password: String (hashed),
  role: String (default: 'alumni'),
  skills: [String],
  company: String,
  description: String,
  img: String            // Profile photo URL
}
```

#### TPO Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (default: 'tpo'),
  company: String,
  description: String,
  skills: [String],
  img: String            // Profile photo URL
}
```

### Relationship Models

#### ConnectionRequest Schema
```javascript
{
  fromStudent: ObjectId (ref: Student),
  toAlumni: ObjectId (ref: Alumni),
  status: String (enum: ['pending', 'accepted', 'rejected']),
  notified: Boolean,
  notifiedStudent: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Message Schema
```javascript
{
  fromUser: ObjectId (ref: User),
  toUser: ObjectId (ref: User),
  content: String,
  timestamp: Date
}
```

#### Post Schema
```javascript
{
  author: ObjectId,
  authorModel: String (enum: ['Alumni', 'TPO']),
  content: String,
  image: String,         // Optional image URL
  likes: Number,
  likedBy: [String],     // Array of user IDs
  comments: [{
    user: String,
    text: String,
    createdAt: Date
  }],
  createdAt: Date
}
```

## 🔌 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### POST /auth/signup
Register a new user (sends OTP for verification)

**Request Body:**
```json
{
  "name": "John Doe",
  "prn": "123456789",
  "passout": "2023",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "student"
}
```

#### POST /auth/verify-otp
Verify OTP and complete registration

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### POST /auth/login
User login

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### Student Endpoints

#### GET /student/me
Get current student profile (Protected)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

#### POST /student/me/photo
Upload profile photo (Protected)

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

### Alumni Endpoints

#### GET /alumni
Get all alumni profiles

#### GET /alumni/me
Get current alumni profile (Protected)

#### PUT /alumni/me
Update alumni profile (Protected)

#### POST /alumni/me/photo
Upload alumni profile photo (Protected)

#### GET /alumni/:id
Get specific alumni profile

### Connection Endpoints

#### POST /connections/request
Send connection request

**Request Body:**
```json
{
  "fromStudent": "student_id",
  "toAlumni": "alumni_id"
}
```

#### GET /connections/received/:alumniId
Get pending connection requests for alumni

#### POST /connections/respond
Respond to connection request

**Request Body:**
```json
{
  "requestId": "request_id",
  "action": "accepted" // or "rejected"
}
```

#### GET /connections/my/:studentId
Get student's accepted connections

### Post Endpoints

#### GET /alumni/posts
Get all posts

#### POST /alumni/posts
Create new post (Protected - Alumni/TPO only)

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

#### PUT /alumni/posts/:id
Update post (Protected - Author only)

#### DELETE /alumni/posts/:id
Delete post (Protected - Author only)

#### POST /alumni/posts/:id/like
Like/unlike a post

### Message Endpoints

#### POST /messages/send
Send a message

#### GET /messages/conversation/:studentId/:alumniId
Get conversation between student and alumni (Protected)

#### GET /messages/conversations/alumni/:alumniId
Get all conversations for an alumni (Protected)

### TPO Endpoints

#### GET /tpo/me
Get current TPO profile (Protected)

#### PUT /tpo/me
Update TPO profile (Protected)

#### POST /tpo/me/photo
Upload TPO profile photo (Protected)

## 📁 Project Structure

```
backend/
├── config/
│   ├── cloudinary.js      # Cloudinary configuration
│   └── db.js             # MongoDB connection
├── controllers/
│   └── authController.js  # Authentication logic
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── models/
│   ├── Alumni.js         # Alumni data model
│   ├── CollegeList.js    # College verification data
│   ├── ConnectionRequest.js # Connection request model
│   ├── Message.js        # Message model
│   ├── OTP.js           # OTP verification model
│   ├── Post.js          # Post model
│   ├── Student.js       # Student data model
│   ├── Teacher.js       # Teacher model (legacy)
│   ├── TPO.js           # TPO data model
│   └── User.js          # Base user model
├── routes/
│   ├── alumni.js        # Alumni-related routes
│   ├── auth.js          # Authentication routes
│   ├── connection.js    # Connection management routes
│   ├── message.js       # Messaging routes
│   ├── post.js          # Post management routes
│   ├── student.js       # Student-related routes
│   └── tpo.js           # TPO-related routes
├── services/
│   └── emailService.js  # Email/OTP service
├── uploads/             # Temporary upload directory
├── server.js           # Main application entry point
└── package.json        # Dependencies and scripts
```

## 🔐 Authentication & Authorization

### JWT Implementation
- Users receive JWT tokens upon successful login
- Tokens contain user ID and role information
- Protected routes require `Authorization: Bearer <token>` header
- Token validation handled by `auth.js` middleware

### Role-Based Access Control
- **Students**: Can view alumni, send connection requests, message connected alumni
- **Alumni**: Can manage profile, accept/reject connections, create posts, message students
- **TPO**: Can manage profile, create posts, access placement-related features

### OTP Verification
- New user registration requires email verification
- 6-digit OTP sent via email (expires in 5 minutes)
- Registration completed only after OTP verification

## 📸 File Upload & Media Management

### Cloudinary Integration
- Profile photos and post images stored on Cloudinary
- Automatic image optimization and transformation
- Secure upload with organized folder structure:
  - `profile_photos/` - User profile images
  - `alumni_posts/` - Post images

### Upload Process
1. Client uploads file via multipart/form-data
2. Multer handles file processing
3. File streamed to Cloudinary
4. Secure URL returned and stored in database

## 💬 Real-time Communication

### Socket.IO Implementation
- Real-time messaging between users
- Room-based chat system
- Event handling for:
  - `joinRoom` - Join specific chat room
  - `sendMessage` - Send message to room
  - `receiveMessage` - Receive message from room
  - Connection/disconnection logging

## 🚀 Deployment

### Environment Setup
1. Set up MongoDB Atlas cluster
2. Configure Cloudinary account
3. Set up Gmail app password
4. Deploy to your preferred platform (Heroku, Railway, etc.)

### Production Considerations
- Use strong JWT secrets
- Enable MongoDB security features
- Configure CORS for production domains
- Set up proper logging and monitoring
- Use environment-specific configurations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Use consistent naming conventions
- Add comments for complex logic
- Follow RESTful API design principles
- Implement proper error handling
- Write meaningful commit messages

## 📄 License

This project is licensed under the ISC License.

## 📞 Contact

**Developer**: Ritesh Jadhav And Adinath Jabade  
**Repository**: [ConnectU-backend](https://github.com/RiteshJadhav021/ConnectU-backend)

For support or questions, please open an issue in the GitHub repository.

---

**Note**: This backend is part of the ConnectU platform. Make sure to also set up the frontend application for complete functionality.