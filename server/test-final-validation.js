const fs = require('fs');
const path = require('path');
const xsdParser = require('./src/services/xsdParser');

// Read the XML file
const xmlPath = path.join(__dirname, '..', '..', 'pacs.008.001.08 cross-border(4).xml');
const xmlContent = fs.readFileSync(xmlPath, 'utf8');

// Read and parse the XSD file
const xsdPath = path.join(__dirname, '..', '..', 'TEST.xsd');
const xsdContent = fs.readFileSync(xsdPath, 'utf8');
const schema = xsdParser.parseXSD(xsdContent);

// Test API call
const testData = {
    xmlContent: xmlContent,
    schema: schema
};

fetch('http://localhost:5000/api/xsd/validate-xml', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
})
.then(response => response.json())
.then(data => {
    console.log('=== FINAL VALIDATION TEST ===');
    console.log('Success:', data.success);
    if (data.success) {
        console.log('Valid:', data.data.isValid);
        console.log('Errors:', data.data.errors);
        console.log('Warnings:', data.data.warnings);
        console.log('\n=== ANALYSIS ===');
        if (data.data.errors.length === 0) {
            console.log('✅ ALL VALIDATION ERRORS FIXED!');
        } else {
            console.log('❌ Still have validation errors:');
            data.data.errors.forEach((error, i) => {
                console.log(`${i+1}. ${error}`);
            });
        }
        
        if (data.data.warnings.length === 0) {
            console.log('✅ NO WARNINGS!');
        } else {
            console.log('⚠️  Warnings:');
            data.data.warnings.forEach((warning, i) => {
                console.log(`${i+1}. ${warning}`);
            });
        }
    } else {
        console.log('Error:', data.message);
    }
})
.catch(error => {
    console.error('Test failed:', error);
});
