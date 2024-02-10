// app.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require("dotenv");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const app = express();
const port = 3000;
dotenv.config();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/videos');
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  

// Configure Multer for video upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define Video model
const Video = mongoose.model('Video', {
  title: String,
  videoUrl: String,
});

// Handle video upload
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    // Check if req.file is defined
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No file provided in the request' });
    }

    // Upload video to Cloudinary
    const result = await cloudinary.uploader.upload_stream({ resource_type: 'video' }, async (error, result) => {
      if (error) {
        console.error('Error uploading to Cloudinary:', error);
        return res.status(500).json({ error: 'Error uploading to Cloudinary' });
      }

      // Save video details to MongoDB with Cloudinary URL
      const video = new Video({
        title: req.body.title || 'Untitled Video',
        videoUrl: result.secure_url,
      });

      await video.save();

      res.status(201).json({ message: 'Video uploaded successfully'});
    }).end(req.file.buffer);
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Error uploading video' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
