import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Debug logging for deployment troubleshooting
console.log('API Configuration:', {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    API_BASE_URL: API_BASE_URL,
    NODE_ENV: process.env.NODE_ENV
});

// Create an axios instance with the base URL configured
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds timeout
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
    (config) => {
        console.log('API Request:', {
            method: config.method.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`
        });
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

export const uploadXSD = async (file) => {
    const formData = new FormData();
    formData.append('xsdFile', file); // Changed from 'file' to 'xsdFile' to match backend

    console.log(`Making API request to: ${API_BASE_URL}/xsd/upload`);
    
    try {
        const response = await apiClient.post('/xsd/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data; // Assuming the response contains the parsed schema
    } catch (error) {
        console.error('Error uploading XSD file:', error);
        console.error('Failed URL:', `${API_BASE_URL}/xsd/upload`);
        throw error;
    }
};

export const getParsedSchema = async () => {
    try {
        const response = await apiClient.get('/schema');
        return response.data; // Assuming the response contains the parsed schema
    } catch (error) {
        console.error('Error fetching parsed schema:', error);
        throw error;
    }
};

export const saveModifiedSchema = async (modifiedSchema) => {
    try {
        const response = await apiClient.post('/save', modifiedSchema);
        return response.data; // Assuming the response contains the success message or modified XSD
    } catch (error) {
        console.error('Error saving modified schema:', error);
        throw error;
    }
};

export const updateElement = async (schema, elementPath, elementData) => {
    try {
        const response = await apiClient.post('/xsd/update-element', {
            schema,
            elementPath,
            elementData
        });
        return response.data;
    } catch (error) {
        console.error('Error updating element:', error);
        throw error;
    }
};

export const validateXMLAgainstXSD = async (schema, xmlContent) => {
    try {
        const response = await apiClient.post('/xsd/validate-xml', {
            schema,
            xmlContent
        });
        return response.data;
    } catch (error) {
        console.error('Error validating XML:', error);
        throw error;
    }
};

export const generateXSD = async (schema, fileName) => {
    try {
        const response = await apiClient.post('/xsd/generate', {
            schema,
            fileName
        }, {
            responseType: 'blob' // Important for file download
        });
        return response.data;
    } catch (error) {
        console.error('Error generating XSD:', error);
        throw error;
    }
};