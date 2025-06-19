const xsdParser = require('../services/xsdParser');
const xsdGenerator = require('../services/xsdGenerator');
const { XMLParser } = require('fast-xml-parser');
const { DOMParser } = require('@xmldom/xmldom');

exports.uploadXsd = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No XSD file uploaded' 
            });
        }

        const xsdContent = req.file.buffer.toString();
        const parsedSchema = xsdParser.parseXSD(xsdContent);
        
        res.json({
            success: true,
            data: {
                schema: parsedSchema,
                metadata: {
                    fileName: req.file.originalname,
                    fileSize: req.file.size,
                    uploadTime: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error('XSD parsing error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error parsing XSD file', 
            error: error.message 
        });
    }
};

exports.generateXsd = async (req, res) => {
    try {
        if (!req.body || !req.body.schema) {
            return res.status(400).json({ 
                success: false, 
                message: 'No schema data provided' 
            });
        }

        const jsonSchema = req.body.schema;
        const xsdContent = xsdGenerator.generateXSD(jsonSchema);
        
        const fileName = req.body.fileName || 'generated_schema.xsd';
        
        res.set({
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="${fileName}"`
        });
        
        res.send(xsdContent);
    } catch (error) {
        console.error('XSD generation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating XSD file', 
            error: error.message 
        });
    }
};

exports.validateSchema = async (req, res) => {
    try {
        const { schema } = req.body;
        
        if (!schema) {
            return res.status(400).json({
                success: false,
                message: 'No schema provided for validation'
            });
        }

        // Basic validation logic
        const errors = [];
        const warnings = [];

        // Check if required fields exist
        if (!schema.complexTypes && !schema.simpleTypes && !schema.elements) {
            errors.push('Schema must contain at least one type or element definition');
        }

        // Validate complex types
        if (schema.complexTypes) {
            schema.complexTypes.forEach((type, index) => {
                if (!type.name) {
                    errors.push(`Complex type at index ${index} is missing a name`);
                }
            });
        }

        // Validate simple types
        if (schema.simpleTypes) {
            schema.simpleTypes.forEach((type, index) => {
                if (!type.name) {
                    errors.push(`Simple type at index ${index} is missing a name`);
                }
                if (!type.base && type.enumerations.length === 0) {
                    warnings.push(`Simple type '${type.name}' has no base type or enumerations`);
                }
            });
        }

        res.json({
            success: true,
            data: {
                valid: errors.length === 0,
                errors,
                warnings
            }
        });
    } catch (error) {
        console.error('Schema validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating schema',
            error: error.message
        });
    }
};

exports.updateElement = async (req, res) => {
    try {
        const { schema, elementPath, elementData } = req.body;
        
        if (!schema || !elementPath || !elementData) {
            return res.status(400).json({
                success: false,
                message: 'Schema, elementPath, and elementData are required'
            });
        }

        // Create a deep copy of the schema to avoid modifying the original
        const updatedSchema = JSON.parse(JSON.stringify(schema));

        // Update the specific element based on the path
        const updateElementAtPath = (schema, path, newData) => {
            const pathParts = path.split('.');
            
            if (pathParts[0] === 'root') {
                // Update root element
                const elementIndex = parseInt(pathParts[1]);
                if (schema.elements && schema.elements[elementIndex]) {
                    schema.elements[elementIndex] = {
                        ...schema.elements[elementIndex],
                        ...newData
                    };
                }
            } else {
                // Update nested element within complex type
                const complexTypeName = pathParts[0];
                const complexType = schema.complexTypes?.find(ct => ct.name === complexTypeName);
                
                if (complexType && complexType.children) {
                    const elementIndex = parseInt(pathParts[1]);
                    if (complexType.children[elementIndex]) {
                        complexType.children[elementIndex] = {
                            ...complexType.children[elementIndex],
                            ...newData
                        };
                    }
                }
            }
        };

        updateElementAtPath(updatedSchema, elementPath, elementData);

        res.json({
            success: true,
            data: {
                schema: updatedSchema,
                message: 'Element updated successfully'
            }
        });
    } catch (error) {
        console.error('Element update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating element',
            error: error.message
        });
    }
};

exports.validateXMLAgainstXSD = async (req, res) => {
    try {
        const { schema, xmlContent } = req.body;
        
        if (!schema) {
            return res.status(400).json({
                success: false,
                message: 'No schema provided for validation'
            });
        }

        if (!xmlContent) {
            return res.status(400).json({
                success: false,
                message: 'No XML content provided for validation'
            });
        }

        // Parse XML content
        let parsedXML;
        try {
            const parser = new XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: '@_',
                allowBooleanAttributes: true,
                parseTagValue: false,
                parseAttributeValue: false,
                trimValues: true,
                ignoreDeclaration: true,
                processEntities: true,
                parseNodeValue: false
            });
            parsedXML = parser.parse(xmlContent);
        } catch (xmlError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid XML format',
                errors: [xmlError.message]
            });
        }

        // Extract Document element if XML has header structure
        const extractionResult = extractDocumentElement(parsedXML);
        const documentXML = extractionResult.extractedXML;
        const hasHeaderStructure = extractionResult.hasHeader;
        
        // Perform validation on the extracted Document element
        const validationResult = validateXMLStructure(documentXML, schema, hasHeaderStructure);
        
        res.json({
            success: true,
            data: {
                isValid: validationResult.isValid,
                errors: validationResult.errors,
                warnings: validationResult.warnings,
                summary: {
                    totalErrors: validationResult.errors.length,
                    totalWarnings: validationResult.warnings.length,
                    validatedAt: new Date().toISOString(),
                    hasHeaderStructure: validationResult.hasHeaderStructure,
                    validatedElement: validationResult.validatedElement
                }
            }
        });
    } catch (error) {
        console.error('XML validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating XML against XSD',
            error: error.message
        });
    }
};

// Helper function to validate XML structure against schema
function validateXMLStructure(parsedXML, schema, hasHeaderStructure = false) {
    const errors = [];
    const warnings = [];
    let validatedElement = null;

    try {
        // Get root element from XML
        const rootElementName = Object.keys(parsedXML)[0];
        const rootElementData = parsedXML[rootElementName];

        // Determine what element is being validated
        if (hasHeaderStructure) {
            validatedElement = `${rootElementName} (extracted from header structure)`;
        } else {
            validatedElement = `Root element: ${rootElementName}`;
        }

        // Find corresponding element in schema
        const schemaRootElement = schema.elements?.find(el => el.name === rootElementName);
        
        if (!schemaRootElement) {
            errors.push(`Root element '${rootElementName}' not found in schema`);
            return { 
                isValid: false, 
                errors, 
                warnings, 
                hasHeaderStructure, 
                validatedElement 
            };
        }

        // Validate root element
        validateElement(rootElementData, schemaRootElement, schema, errors, warnings, rootElementName);

        // Additional schema-wide validations
        validateSchemaConstraints(parsedXML, schema, errors, warnings);

    } catch (validationError) {
        errors.push(`Validation error: ${validationError.message}`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        hasHeaderStructure,
        validatedElement
    };
}

// Helper function to validate individual elements
function validateElement(elementData, schemaElement, schema, errors, warnings, elementPath = '') {
    // Convert minOccurs to number if it's a string
    const minOccurs = typeof schemaElement.minOccurs === 'string' ? parseInt(schemaElement.minOccurs) : 
                     (schemaElement.minOccurs !== undefined ? schemaElement.minOccurs : 1);
    
    // Check if element is required but missing
    if (minOccurs > 0 && (elementData === undefined || elementData === null)) {
        errors.push(`Required element '${elementPath}' is missing`);
        return;
    }

    // Skip validation if element is not present and not required
    if (elementData === undefined || elementData === null) {
        return;
    }

    // Validate element type
    if (schemaElement.type) {
        validateElementType(elementData, schemaElement.type, schema, errors, warnings, elementPath);
    }

    // Validate child elements if it's a complex type
    if (schemaElement.complexType || (schemaElement.type && schema.complexTypes?.find(ct => ct.name === schemaElement.type))) {
        const complexType = schemaElement.complexType || schema.complexTypes.find(ct => ct.name === schemaElement.type);
        if (complexType && complexType.children) {
            validateComplexTypeChildren(elementData, complexType, schema, errors, warnings, elementPath);
        }
    }

    // Validate attributes
    if (schemaElement.attributes && typeof elementData === 'object') {
        validateAttributes(elementData, schemaElement.attributes, errors, warnings, elementPath);
    }
}

// Helper function to validate element types
function validateElementType(elementData, typeName, schema, errors, warnings, elementPath) {
    // Check if it's a complex type with simple content (like ActiveCurrencyAndAmount)
    const complexType = schema.complexTypes?.find(ct => ct.name === typeName);
    if (complexType) {
        // For complex types with simple content, the actual value is in #text
        if (typeof elementData === 'object' && elementData.hasOwnProperty('#text')) {
            // This is simple content with attributes - validate the text content
            const textValue = elementData['#text'];
            if (complexType.baseType) {
                // Validate against the base type
                validateElementType(textValue, complexType.baseType, schema, errors, warnings, elementPath);
            }
            return;
        }
        // For regular complex types, this will be handled elsewhere
        return;
    }

    // Check if it's a simple type
    const simpleType = schema.simpleTypes?.find(st => st.name === typeName);
    if (simpleType) {
        validateSimpleType(elementData, simpleType, errors, warnings, elementPath);
        return;
    }

    // Basic built-in type validation
    const value = typeof elementData === 'object' && elementData['#text'] !== undefined ? elementData['#text'] : 
                  typeof elementData === 'object' && elementData['@_'] ? elementData['@_'] : elementData;
    
    switch (typeName) {
        case 'string':
        case 'xs:string':
            if (typeof value !== 'string') {
                errors.push(`Element '${elementPath}' should be a string, got ${typeof value}`);
            }
            break;
        case 'int':
        case 'integer':
        case 'xs:int':
        case 'xs:integer':
            if (!Number.isInteger(Number(value))) {
                errors.push(`Element '${elementPath}' should be an integer, got '${value}'`);
            }
            break;
        case 'decimal':
        case 'xs:decimal':
            if (isNaN(Number(value))) {
                errors.push(`Element '${elementPath}' should be a decimal number, got '${value}'`);
            }
            break;
        case 'boolean':
        case 'xs:boolean':
            if (value !== 'true' && value !== 'false' && value !== true && value !== false) {
                errors.push(`Element '${elementPath}' should be a boolean (true/false), got '${value}'`);
            }
            break;
        case 'date':
        case 'xs:date':
            if (isNaN(Date.parse(value))) {
                errors.push(`Element '${elementPath}' should be a valid date, got '${value}'`);
            }
            break;
    }
}

// Helper function to validate simple types
function validateSimpleType(elementData, simpleType, errors, warnings, elementPath) {
    const value = typeof elementData === 'object' && elementData['@_'] ? elementData['@_'] : elementData;
    
    // Check enumerations
    if (simpleType.enumerations && Array.isArray(simpleType.enumerations) && simpleType.enumerations.length > 0) {
        if (!simpleType.enumerations.includes(value)) {
            errors.push(`Element '${elementPath}' must be one of: ${simpleType.enumerations.join(', ')}. Got '${value}'`);
        }
    }

    // Check restrictions
    if (simpleType.restrictions && Array.isArray(simpleType.restrictions)) {
        simpleType.restrictions.forEach(restriction => {
            switch (restriction.type) {
                case 'minLength':
                    if (typeof value === 'string' && value.length < restriction.value) {
                        errors.push(`Element '${elementPath}' must have at least ${restriction.value} characters`);
                    }
                    break;
                case 'maxLength':
                    if (typeof value === 'string' && value.length > restriction.value) {
                        errors.push(`Element '${elementPath}' must have at most ${restriction.value} characters`);
                    }
                    break;
                case 'pattern':
                    if (typeof value === 'string') {
                        const regex = new RegExp(restriction.value);
                        if (!regex.test(value)) {
                            errors.push(`Element '${elementPath}' does not match required pattern: ${restriction.value}`);
                        }
                    }
                    break;
            }
        });
    } else if (simpleType.restrictions && typeof simpleType.restrictions === 'object') {
        // Handle case where restrictions is an object instead of array
        const restriction = simpleType.restrictions;
        switch (restriction.type) {
            case 'minLength':
                if (typeof value === 'string' && value.length < restriction.value) {
                    errors.push(`Element '${elementPath}' must have at least ${restriction.value} characters`);
                }
                break;
            case 'maxLength':
                if (typeof value === 'string' && value.length > restriction.value) {
                    errors.push(`Element '${elementPath}' must have at most ${restriction.value} characters`);
                }
                break;
            case 'pattern':
                if (typeof value === 'string') {
                    const regex = new RegExp(restriction.value);
                    if (!regex.test(value)) {
                        errors.push(`Element '${elementPath}' does not match required pattern: ${restriction.value}`);
                    }
                }
                break;
        }
    }
}

// Helper function to validate complex type children
function validateComplexTypeChildren(elementData, complexType, schema, errors, warnings, parentPath) {
    if (!complexType || !complexType.children || !Array.isArray(complexType.children)) return;

    // Group children by their container type (sequence vs choice)
    const sequenceElements = complexType.children.filter(child => child.containerType === 'sequence' || !child.containerType);
    const choiceGroups = {};
    
    complexType.children.forEach(child => {
        if (child.containerType === 'choice') {
            const groupKey = `${child.containerMinOccurs || 1}_${child.containerMaxOccurs || 1}`;
            if (!choiceGroups[groupKey]) {
                choiceGroups[groupKey] = [];
            }
            choiceGroups[groupKey].push(child);
        }
    });

    // Validate sequence elements (all required according to their individual minOccurs)
    sequenceElements.forEach(childSchema => {
        try {
            const childPath = parentPath ? `${parentPath}.${childSchema.name}` : childSchema.name;
            let childData = elementData[childSchema.name];

            // Handle arrays for maxOccurs > 1 or unbounded
            if (childSchema.maxOccurs > 1 || childSchema.maxOccurs === 'unbounded') {
                if (Array.isArray(childData)) {
                    // Validate each array element
                    childData.forEach((item, index) => {
                        const arrayItemPath = `${childPath}[${index}]`;
                        validateElement(item, childSchema, schema, errors, warnings, arrayItemPath);
                    });
                } else if (childData !== undefined && childData !== null) {
                    // Single element where array is expected
                    validateElement(childData, childSchema, schema, errors, warnings, childPath);
                } else {
                    // Array is missing - check if it's required
                    validateElement(undefined, childSchema, schema, errors, warnings, childPath);
                }
            } else {
                validateElement(childData, childSchema, schema, errors, warnings, childPath);
            }
        } catch (childValidationError) {
            errors.push(`Error validating sequence element: ${childValidationError.message}`);
        }
    });

    // Validate choice groups (at least one element from each choice group should be present, if the choice group is required)
    Object.keys(choiceGroups).forEach(groupKey => {
        try {
            const choiceElements = choiceGroups[groupKey];
            const [containerMinOccurs, containerMaxOccurs] = groupKey.split('_').map(val => val === 'unbounded' ? val : parseInt(val));
            
            // Find which elements from this choice group are present in the XML
            const presentElements = choiceElements.filter(choiceElement => {
                const childData = elementData[choiceElement.name];
                return childData !== undefined && childData !== null;
            });

            // If choice group is required (containerMinOccurs > 0) but no elements are present
            if (containerMinOccurs > 0 && presentElements.length === 0) {
                const choiceNames = choiceElements.map(el => el.name).join(', ');
                errors.push(`Choice group requires at least one of: ${choiceNames} (in ${parentPath || 'root'})`);
                return;
            }

            // If choice group allows only one element but multiple are present
            if (containerMaxOccurs === 1 && presentElements.length > 1) {
                const presentNames = presentElements.map(el => el.name).join(', ');
                warnings.push(`Choice group allows only one element, but found multiple: ${presentNames} (in ${parentPath || 'root'})`);
            }

            // Validate each present element from the choice group
            presentElements.forEach(choiceElement => {
                const childPath = parentPath ? `${parentPath}.${choiceElement.name}` : choiceElement.name;
                const childData = elementData[choiceElement.name];
                validateElement(childData, choiceElement, schema, errors, warnings, childPath);
            });

        } catch (choiceValidationError) {
            errors.push(`Error validating choice group: ${choiceValidationError.message}`);
        }
    });

    // Check for unexpected elements in XML that are not in schema
    if (typeof elementData === 'object') {
        const xmlKeys = Object.keys(elementData).filter(key => !key.startsWith('@_') && key !== '#text');
        const schemaKeys = complexType.children.map(child => child.name);
        
        xmlKeys.forEach(xmlKey => {
            // Skip array indices (numbers) - these are handled by the array logic above
            if (!isNaN(xmlKey)) return;
            
            if (!schemaKeys.includes(xmlKey)) {
                warnings.push(`Unexpected element '${parentPath ? parentPath + '.' + xmlKey : xmlKey}' found in XML but not defined in schema`);
            }
        });
    }
}

// Helper function to validate attributes
function validateAttributes(elementData, schemaAttributes, errors, warnings, elementPath) {
    if (!schemaAttributes || !Array.isArray(schemaAttributes)) return;

    schemaAttributes.forEach(attrSchema => {
        try {
            if (!attrSchema || !attrSchema.name) return;
            
            const attrName = `@_${attrSchema.name}`;
            const attrValue = elementData[attrName];

            if (attrSchema.use === 'required' && (attrValue === undefined || attrValue === null)) {
                errors.push(`Required attribute '${attrSchema.name}' is missing from element '${elementPath}'`);
            }

            if (attrValue !== undefined && attrSchema.type) {
                // Basic attribute type validation
                switch (attrSchema.type) {
                    case 'string':
                    case 'xs:string':
                        if (typeof attrValue !== 'string') {
                            errors.push(`Attribute '${attrSchema.name}' in element '${elementPath}' should be a string`);
                        }
                        break;
                    case 'int':
                    case 'xs:int':
                        if (!Number.isInteger(Number(attrValue))) {
                            errors.push(`Attribute '${attrSchema.name}' in element '${elementPath}' should be an integer`);
                        }
                        break;
                }
            }
        } catch (attrValidationError) {
            errors.push(`Error validating attribute: ${attrValidationError.message}`);
        }
    });
}

// Helper function for additional schema constraint validation
function validateSchemaConstraints(parsedXML, schema, errors, warnings) {
    // Add any additional schema-wide validation rules here
    // For example, checking unique constraints, key references, etc.
    
    // Check for multiple root elements (not allowed in well-formed XML)
    const rootElements = Object.keys(parsedXML);
    if (rootElements.length > 1) {
        errors.push('XML document must have exactly one root element');
    }
}

// Helper function to extract Document element from header structure
function extractDocumentElement(parsedXML) {
    // Check if XML has DataPDU/Body header structure
    if (parsedXML.DataPDU && parsedXML.DataPDU.Body) {
        console.log('Header structure detected (DataPDU/Body), extracting Document element...');
        
        const body = parsedXML.DataPDU.Body;
        
        // Look for Document element in the Body
        if (body.Document) {
            console.log('Document element found in Body, using it for validation');
            return { 
                extractedXML: { Document: body.Document }, 
                hasHeader: true 
            };
        }
        
        // If no Document element found, check if there are other elements that might be the document
        const bodyKeys = Object.keys(body).filter(key => !key.startsWith('@_') && key !== 'AppHdr');
        if (bodyKeys.length === 1) {
            const documentKey = bodyKeys[0];
            console.log(`Found single element '${documentKey}' in Body, treating as document element`);
            return { 
                extractedXML: { [documentKey]: body[documentKey] }, 
                hasHeader: true 
            };
        }
        
        console.log('Warning: Header structure detected but no clear Document element found');
        // Return the body content excluding the AppHdr
        const { AppHdr, ...documentContent } = body;
        return { 
            extractedXML: documentContent, 
            hasHeader: true 
        };
    }
    
    // Check for other common header patterns
    if (parsedXML.Envelope || parsedXML.Message || parsedXML.Root) {
        console.log('Alternative header structure detected, attempting to extract document content...');
        
        // For Envelope structure (SOAP-like)
        if (parsedXML.Envelope && parsedXML.Envelope.Body) {
            const envelopeBody = parsedXML.Envelope.Body;
            const bodyKeys = Object.keys(envelopeBody).filter(key => !key.startsWith('@_'));
            if (bodyKeys.length === 1) {
                const documentKey = bodyKeys[0];
                return { 
                    extractedXML: { [documentKey]: envelopeBody[documentKey] }, 
                    hasHeader: true 
                };
            }
        }
        
        // For Message structure
        if (parsedXML.Message) {
            const messageKeys = Object.keys(parsedXML.Message).filter(key => !key.startsWith('@_') && !key.includes('Header'));
            if (messageKeys.length === 1) {
                const documentKey = messageKeys[0];
                return { 
                    extractedXML: { [documentKey]: parsedXML.Message[documentKey] }, 
                    hasHeader: true 
                };
            }
        }
    }
    
    console.log('No header structure detected, validating entire XML as-is');
    return { 
        extractedXML: parsedXML, 
        hasHeader: false 
    };
}

exports.debugSchema = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No XSD file uploaded' 
            });
        }

        const xsdContent = req.file.buffer.toString();
        const parsedSchema = xsdParser.parseXSD(xsdContent);
        
        // Log the first few complex types to see their structure
        console.log('=== DEBUG SCHEMA PARSING ===');
        if (parsedSchema.complexTypes && parsedSchema.complexTypes.length > 0) {
            console.log('First 3 complex types:');
            parsedSchema.complexTypes.slice(0, 3).forEach((type, index) => {
                console.log(`Type ${index}: ${type.name}`);
                console.log('Children:', type.children.map(child => ({
                    name: child.name,
                    type: child.type,
                    minOccurs: child.minOccurs,
                    maxOccurs: child.maxOccurs,
                    containerType: child.containerType
                })));
                console.log('---');
            });
        }
        
        res.json({
            success: true,
            data: {
                schema: parsedSchema,
                metadata: {
                    fileName: req.file.originalname,
                    fileSize: req.file.size,
                    uploadTime: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error('XSD parsing error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error parsing XSD file', 
            error: error.message 
        });
    }
};