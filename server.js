const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectDB();

// Routes
app.use('/', require('./routes/auth'));

app.listen(5000, () => console.log('Server running on port 5000'));
