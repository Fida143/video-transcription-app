import React, { useState, useEffect, useCallback } from 'react';
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
  Autocomplete,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import DescriptionIcon from '@mui/icons-material/Description';
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
  padding: '8px 16px',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  marginBottom: theme.spacing(4),
  borderRadius: '28px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  '& .MuiAutocomplete-root': {
    flex: 1,
  },
  '& .MuiInputBase-root': {
    padding: '4px 0',
  },
  '& .MuiAutocomplete-input': {
    padding: '8px 0 !important',
    fontSize: '1rem',
    lineHeight: '1.5',
    height: '24px',
  },
  '& .MuiAutocomplete-endAdornment': {
    right: '0',
  },
  '& .MuiAutocomplete-popupIndicator': {
    display: 'none',
  },
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
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'video/*': ['.mp4', '.mov', '.avi']
    },
    maxFiles: 1,
    onDrop: handleDrop
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      try {
        setSearchLoading(true);
        if (!query.trim()) {
          const response = await axios.get(`${API_URL}/videos`);
          setVideos(response.data);
        } else {
          const response = await axios.get(`${API_URL}/videos/search?query=${query}`);
          setVideos(response.data);
        }
      } catch (error) {
        console.error('Error searching videos:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 500),
    []
  );

  // Debounced suggestions function
  const debouncedSuggestions = useCallback(
    debounce(async (query) => {
      try {
        if (!query.trim()) {
          setSuggestions([]);
          return;
        }
        const response = await axios.get(`${API_URL}/videos/suggestions?query=${query}`);
        setSuggestions(response.data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    debouncedSuggestions(searchQuery);
  }, [searchQuery, debouncedSuggestions]);

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

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Keep the manual search for form submission
  async function handleSearch(e) {
    e.preventDefault();
    debouncedSearch(searchQuery);
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
          <SearchBox component="form" onSubmit={handleSearch}>
            <Autocomplete
              freeSolo
              open={open}
              onOpen={() => setOpen(true)}
              onClose={() => setOpen(false)}
              options={suggestions}
              getOptionLabel={(option) => 
                typeof option === 'string' ? option : option.text
              }
              filterOptions={(x) => x}
              value={searchQuery}
              onChange={(event, newValue) => {
                if (newValue && typeof newValue === 'object') {
                  setSearchQuery(newValue.text);
                  debouncedSearch(newValue.text);
                }
              }}
              onInputChange={(event, newInputValue) => {
                setSearchQuery(newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search transcriptions..."
                  variant="standard"
                  InputProps={{
                    ...params.InputProps,
                    disableUnderline: true,
                    endAdornment: (
                      <>
                        {searchLoading && <CircularProgress size={20} sx={{ mr: 1 }} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch(e);
                    }
                  }}
                />
              )}
              ListboxProps={{
                sx: {
                  '& .MuiAutocomplete-option': {
                    padding: '12px 16px',
                  },
                },
              }}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    width: '100%',
                    py: 0.5
                  }}>
                    {option.type === 'filename' ? (
                      <VideoFileIcon sx={{ mr: 2, color: 'primary.main' }} />
                    ) : (
                      <DescriptionIcon sx={{ mr: 2, color: 'secondary.main' }} />
                    )}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" sx={{ mb: 0.5 }}>
                        {option.text}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ display: 'block' }}
                      >
                        {option.type === 'filename' ? 'Video Name' : 'From Transcription'}
                      </Typography>
                    </Box>
                  </Box>
                </li>
              )}
              PaperComponent={({ children }) => (
                <Paper 
                  elevation={3}
                  sx={{ 
                    mt: 1,
                    borderRadius: 2,
                    '& .MuiAutocomplete-listbox': {
                      padding: '8px',
                    },
                  }}
                >
                  {children}
                </Paper>
              )}
            />
            <IconButton 
              type="submit" 
              sx={{ p: '12px', ml: 1 }} 
              aria-label="search"
              disabled={searchLoading}
            >
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
