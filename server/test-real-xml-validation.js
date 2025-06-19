const xsdParser = require('./src/services/xsdParser');
const fs = require('fs');
const path = require('path');

// Read the TEST.xsd file
const testXsdPath = path.join(__dirname, '..', '..', 'TEST.xsd');
const xsdContent = fs.readFileSync(testXsdPath, 'utf8');

// Read the real XML file
const xmlPath = path.join(__dirname, '..', '..', 'pacs.008.001.08 cross-border(4).xml');
const xmlContent = fs.readFileSync(xmlPath, 'utf8');

// Parse the schema
const schema = xsdParser.parseXSD(xsdContent);

// Import validation logic from controller
const xsdController = require('./src/controllers/xsdController');

// Test the validation logic manually with the real XML
console.log('Testing validation logic with real XML...');

try {
    // Simulate the request body
    const mockReq = {
        body: {
            xmlContent: xmlContent,
            schema: schema
        }
    };
    
    const mockRes = {
        json: (data) => {
            console.log('Validation Result:', JSON.stringify(data, null, 2));
        },
        status: (code) => ({
            json: (data) => {
                console.log(`Status ${code}:`, JSON.stringify(data, null, 2));
            }
        })
    };
    
    // Call the validation function
    xsdController.validateXMLAgainstXSD(mockReq, mockRes);
    
} catch (error) {
    console.error('Test error:', error);
}
