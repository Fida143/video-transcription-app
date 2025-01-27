const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Video = require('../models/Video');

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /mp4|mov|avi/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Error: Videos Only!'));
  }
});

// Upload video
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const video = new Video({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      transcriptionStatus: 'pending'
    });

    await video.save();
    res.json(video);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all videos
router.get('/', async (req, res) => {
  try {
    const videos = await Video.find().sort({ uploadDate: -1 });
    res.json(videos);
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search videos
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const videos = await Video.find({
      $or: [
        { transcription: { $regex: query, $options: 'i' } },
        { originalName: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(videos);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Transcribe video
router.post('/:id/transcribe', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Update status to processing
    video.transcriptionStatus = 'processing';
    await video.save();

    // Read the video file
    const videoFile = fs.readFileSync(video.path);
    
    // Upload to AssemblyAI
    console.log('Uploading to AssemblyAI...');
    const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload',
      videoFile,
      {
        headers: {
          'authorization': process.env.ASSEMBLYAI_API_KEY,
          'content-type': 'application/octet-stream',
          'transfer-encoding': 'chunked'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('Starting transcription...');
    // Start transcription
    const transcriptResponse = await axios.post('https://api.assemblyai.com/v2/transcript',
      {
        audio_url: uploadResponse.data.upload_url,
        language_code: 'en'
      },
      {
        headers: {
          'authorization': process.env.ASSEMBLYAI_API_KEY
        }
      }
    );

    // Send success response
    res.json({ 
      message: 'Transcription started', 
      transcriptId: transcriptResponse.data.id 
    });

    // Start polling for transcription result
    const pollTranscription = async () => {
      try {
        const response = await axios.get(
          `https://api.assemblyai.com/v2/transcript/${transcriptResponse.data.id}`,
          {
            headers: {
              'authorization': process.env.ASSEMBLYAI_API_KEY
            }
          }
        );

        console.log('Polling status:', response.data.status);

        if (response.data.status === 'completed') {
          video.transcription = response.data.text;
          video.transcriptionStatus = 'completed';
          await video.save();
          console.log('Transcription completed');
        } else if (response.data.status === 'error') {
          video.transcriptionStatus = 'failed';
          await video.save();
          console.error('Transcription failed:', response.data.error);
        } else {
          // Keep polling if still processing
          setTimeout(pollTranscription, 5000);
        }
      } catch (error) {
        console.error('Polling error:', error);
        video.transcriptionStatus = 'failed';
        await video.save();
      }
    };

    // Start polling
    pollTranscription();

  } catch (error) {
    console.error('Transcription error:', error);

    // Update video status
    try {
      const video = await Video.findById(req.params.id);
      if (video) {
        video.transcriptionStatus = 'failed';
        await video.save();
      }
    } catch (dbError) {
      console.error('Error updating video status:', dbError);
    }

    // Send error response
    res.status(500).json({ 
      error: 'Error processing video',
      details: error.message 
    });
  }
});

// Check transcription status
router.get('/:id/transcription-status', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.transcriptionStatus === 'completed') {
      return res.json({ 
        status: 'completed', 
        transcription: video.transcription 
      });
    }

    res.json({ status: video.transcriptionStatus });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
