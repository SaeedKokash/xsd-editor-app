import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const uploadXSD = async (file) => {
    const formData = new FormData();
    formData.append('xsdFile', file); // Changed from 'file' to 'xsdFile' to match backend

    try {
        const response = await axios.post(`${API_BASE_URL}/xsd/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data; // Assuming the response contains the parsed schema
    } catch (error) {
        console.error('Error uploading XSD file:', error);
        throw error;
    }
};

export const getParsedSchema = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/schema`);
        return response.data; // Assuming the response contains the parsed schema
    } catch (error) {
        console.error('Error fetching parsed schema:', error);
        throw error;
    }
};

export const saveModifiedSchema = async (modifiedSchema) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/save`, modifiedSchema);
        return response.data; // Assuming the response contains the success message or modified XSD
    } catch (error) {
        console.error('Error saving modified schema:', error);
        throw error;
    }
};

export const updateElement = async (schema, elementPath, elementData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/xsd/update-element`, {
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
        const response = await axios.post(`${API_BASE_URL}/xsd/validate-xml`, {
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
        const response = await axios.post(`${API_BASE_URL}/xsd/generate`, {
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