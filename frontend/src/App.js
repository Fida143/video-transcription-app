import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  IconButton,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import { useDropzone } from 'react-dropzone';
import ReactPlayer from 'react-player';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
  },
});

// Styled components
const DropzoneBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  backgroundColor: '#f8f9fa',
  border: '2px dashed #2196f3',
  borderRadius: '16px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
}));

const SearchBox = styled(Paper)(({ theme }) => ({
  padding: '2px 4px',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  marginBottom: theme.spacing(4),
  borderRadius: '28px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
}));

const VideoCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
  },
}));

function App() {
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'video/*': ['.mp4', '.mov', '.avi']
    },
    maxFiles: 1,
    onDrop: handleDrop
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    try {
      const response = await axios.get(`${API_URL}/videos`);
      setVideos(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  }

  async function handleDrop(acceptedFiles) {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    try {
      setLoading(true);
      setUploadStatus('Uploading video...');
      setUploadProgress(0);
      
      const response = await axios.post(`${API_URL}/videos/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      setUploadStatus('Starting transcription...');
      
      // Start transcription
      await axios.post(`${API_URL}/videos/${response.data._id}/transcribe`);
      
      setUploadStatus('Upload complete!');
      await fetchVideos();
    } catch (error) {
      console.error('Error uploading video:', error);
      setUploadStatus('Error uploading video. Please try again.');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setUploadProgress(0);
        setUploadStatus('');
      }, 2000);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchVideos();
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/videos/search?query=${searchQuery}`);
      setVideos(response.data);
    } catch (error) {
      console.error('Error searching videos:', error);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom 
          align="center"
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 4
          }}
        >
          Video Transcription App
        </Typography>

        <DropzoneBox {...getRootProps()}>
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 48, color: '#2196f3', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drag and drop a video file here
          </Typography>
          <Typography variant="body2" color="textSecondary">
            or click to select one
          </Typography>
          {loading && (
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress variant="determinate" value={uploadProgress} size={60} />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" component="div" color="text.secondary">
                    {`${Math.round(uploadProgress)}%`}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                {uploadStatus}
              </Typography>
            </Box>
          )}
        </DropzoneBox>

        <Box sx={{ mt: 4, mb: 4 }}>
          <SearchBox>
            <TextField
              sx={{ ml: 1, flex: 1 }}
              placeholder="Search transcriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="standard"
              InputProps={{ disableUnderline: true }}
            />
            <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
              <SearchIcon />
            </IconButton>
          </SearchBox>
        </Box>

        <Grid container spacing={3}>
          {videos.map((video) => (
            <Grid item xs={12} sm={6} md={4} key={video._id}>
              <VideoCard>
                <ReactPlayer
                  url={`http://localhost:5000/uploads/${video.filename}`}
                  width="100%"
                  height="200px"
                  controls
                  playsinline
                  config={{
                    file: {
                      attributes: {
                        crossOrigin: "anonymous",
                        controlsList: "nodownload",
                        onError: (e) => console.error('Video error:', e)
                      },
                      forceVideo: true,
                      hlsOptions: {},
                      tracks: []
                    }
                  }}
                  onError={(e) => {
                    console.error('ReactPlayer error:', e);
                  }}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {video.originalName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Status: {video.transcriptionStatus}
                  </Typography>
                  {video.transcription && (
                    <Typography variant="body1">
                      Transcription: {video.transcription}
                    </Typography>
                  )}
                  {video.keywords && video.keywords.length > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Keywords: {video.keywords.join(', ')}
                    </Typography>
                  )}
                </CardContent>
              </VideoCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

export default App;
