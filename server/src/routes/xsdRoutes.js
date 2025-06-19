const express = require('express');
const router = express.Router();
const xsdController = require('../controllers/xsdController');
const upload = require('../middleware/upload');

// Route to upload and parse an XSD file
router.post('/upload', upload.single('xsdFile'), xsdController.uploadXsd);

// Route to debug schema parsing
router.post('/debug', upload.single('xsdFile'), xsdController.debugSchema);

// Route to generate XSD from modified JSON schema
router.post('/generate', xsdController.generateXsd);

// Route to validate schema
router.post('/validate', xsdController.validateSchema);

// Route to update a specific element in the schema
router.post('/update-element', xsdController.updateElement);

// Route to validate XML against XSD schema
router.post('/validate-xml', xsdController.validateXMLAgainstXSD);

module.exports = router;