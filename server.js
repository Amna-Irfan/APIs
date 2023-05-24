require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const connectDB = require('./config/dbConn');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3500;

connectDB();

app.use(express.json());

app.use('/', require('./routes/root'));
app.use('/auth', require('./routes/authRoutes'));
app.use('/users', require('./routes/userRoutes'));

app.all('*', (req, res) => {
    res.status(404);
    res.sendFile(path.join(__dirname, 'views', '404.html'));
});

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});