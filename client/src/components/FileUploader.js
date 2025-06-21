import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Alert, 
  CircularProgress,
  Chip,
  LinearProgress 
} from '@mui/material';
import { CloudUpload, Description } from '@mui/icons-material';
import { uploadXSD } from '../services/api';

const FileUploader = ({ onUpload }) => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
        setError('');
        setSuccess('');
    };

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((event) => {
        event.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((event) => {
        event.preventDefault();
        setIsDragging(false);
        const droppedFile = event.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith('.xsd') || droppedFile.name.endsWith('.xml'))) {
            setFile(droppedFile);
            setError('');
            setSuccess('');
        } else {
            setError('Please drop a valid XSD or XML file.');
        }
    }, []);

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await uploadXSD(file);

            if (response.success) {
                console.log('Upload successful, full response:', response);
                console.log('Schema data:', response.data.schema);
                
                setSuccess(`Successfully parsed ${response.data.metadata.fileName}`);
                
                // Call the onUpload callback with the parsed schema
                if (onUpload) {
                    console.log('Calling onUpload with schema:', response.data.schema);
                    onUpload(response.data.schema);
                }
            } else {
                setError('Failed to parse XSD file. Please check the file format.');
            }
        } catch (err) {
            console.error('Error uploading file:', err);
            setError(
                err.response?.data?.message || 
                'Failed to upload file. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const resetFile = () => {
        setFile(null);
        setError('');
        setSuccess('');
    };

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
                Upload XSD Schema File
            </Typography>
            
            <Paper
                elevation={2}
                sx={{
                    p: 4,
                    border: isDragging ? '2px dashed #1976d2' : '2px dashed #ccc',
                    backgroundColor: isDragging ? '#f3f4f6' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        borderColor: '#1976d2',
                        backgroundColor: '#f8f9fa'
                    }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <Box sx={{ textAlign: 'center' }}>
                    <CloudUpload sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Drop your XSD file here or click to browse
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Supported formats: .xsd, .xml (Max size: 50MB)
                    </Typography>
                    
                    <input
                        type="file"
                        accept=".xsd,.xml"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        id="file-upload"
                    />
                    <label htmlFor="file-upload">
                        <Button
                            variant="outlined"
                            component="span"
                            startIcon={<Description />}
                            sx={{ mb: 2 }}
                        >
                            Browse Files
                        </Button>
                    </label>
                    
                    {file && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Selected file:
                            </Typography>
                            <Chip
                                label={`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`}
                                onDelete={resetFile}
                                color="primary"
                                variant="outlined"
                            />
                        </Box>
                    )}
                </Box>
            </Paper>

            {loading && (
                <Box sx={{ mt: 2 }}>
                    <LinearProgress />
                    <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                        Parsing XSD file...
                    </Typography>
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    {success}
                </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleUpload}
                    disabled={!file || loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
                >
                    {loading ? 'Uploading...' : 'Upload & Parse'}
                </Button>
                
                {file && (
                    <Button
                        variant="outlined"
                        size="large"
                        onClick={resetFile}
                        disabled={loading}
                    >
                        Clear
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default FileUploader;