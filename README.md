# Video Transcription App

A web application that allows users to upload videos, perform AI-driven transcription of video content, search through video transcriptions, and organize personal footage. Built with the MERN stack (MongoDB, Express.js, React.js, Node.js) and AssemblyAI for transcription.

## Features

- Video upload with drag-and-drop support
- Real-time upload progress tracking
- Automatic video transcription using AssemblyAI
- Search functionality for transcriptions and video names
- Video streaming with support for partial content
- Modern, responsive UI built with Material-UI
- Cross-browser and mobile device support

## Tech Stack

### Frontend
- React.js
- Material-UI for styling
- React-Player for video playback
- React-Dropzone for file uploads
- Axios for API communication

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- AssemblyAI API for transcription
- CORS for cross-origin support
- Streaming support for video playback

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- AssemblyAI API key

## Setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd video-transcription-app
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file with the following variables:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   ASSEMBLYAI_API_KEY=your_assemblyai_api_key
   UPLOAD_PATH=uploads
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm start
   ```

4. Open your browser and visit `http://localhost:3000`

## Usage

1. Upload a Video:
   - Drag and drop a video file onto the upload area
   - Or click to select a video file
   - Watch the upload progress in real-time

2. View and Search Videos:
   - All uploaded videos appear in the grid layout
   - Use the search bar to find videos by name or transcription content
   - Click on a video to play it

3. Transcription:
   - Transcription starts automatically after upload
   - View transcription status in real-time
   - Once complete, transcription appears below the video

## API Endpoints

### Videos
- `POST /api/videos/upload` - Upload a new video
- `POST /api/videos/:id/transcribe` - Start transcription for a video
- `GET /api/videos` - Get all videos
- `GET /api/videos/search` - Search videos by transcription or name
- `GET /api/videos/:id/transcription-status` - Check transcription status

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
