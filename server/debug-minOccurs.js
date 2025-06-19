const xsdParser = require('./src/services/xsdParser');
const fs = require('fs');
const path = require('path');

// Read the TEST.xsd file
const testXsdPath = path.join(__dirname, '..', '..', 'TEST.xsd');
const xsdContent = fs.readFileSync(testXsdPath, 'utf8');

// Parse the schema
const schema = xsdParser.parseXSD(xsdContent);

console.log('=== Debugging minOccurs parsing ===');

// Find GroupHeader93__1 complex type 
const groupHeaderType = schema.complexTypes.find(ct => ct.name === 'GroupHeader93__1');
if (groupHeaderType) {
    console.log('\nGroupHeader93__1 children:');
    groupHeaderType.children.forEach(child => {
        console.log(`- ${child.name}: minOccurs=${child.minOccurs} (type: ${typeof child.minOccurs}), maxOccurs=${child.maxOccurs}`);
    });
} else {
    console.log('GroupHeader93__1 not found');
}

// Find PaymentIdentification7__1 complex type
const paymentIdType = schema.complexTypes.find(ct => ct.name === 'PaymentIdentification7__1');
if (paymentIdType) {
    console.log('\nPaymentIdentification7__1 children:');
    paymentIdType.children.forEach(child => {  
        console.log(`- ${child.name}: minOccurs=${child.minOccurs} (type: ${typeof child.minOccurs}), maxOccurs=${child.maxOccurs}`);
    });
} else {
    console.log('PaymentIdentification7__1 not found');
}

// Test with the validation function
console.log('\n=== Testing validation logic directly ===');

// Mock validation function to test minOccurs logic
function testMinOccursLogic(schemaElement, elementName) {
    const minOccurs = typeof schemaElement.minOccurs === 'string' ? parseInt(schemaElement.minOccurs) : 
                     (schemaElement.minOccurs !== undefined ? schemaElement.minOccurs : 1);
    
    const elementData = undefined; // Missing element
    
    console.log(`\nTesting ${elementName}:`);
    console.log(`- minOccurs: ${schemaElement.minOccurs} (${typeof schemaElement.minOccurs})`);
    console.log(`- parsed minOccurs: ${minOccurs} (${typeof minOccurs})`);
    console.log(`- elementData: ${elementData}`);
    console.log(`- condition (minOccurs > 0 && elementData is undefined): ${minOccurs > 0 && (elementData === undefined || elementData === null)}`);
    
    if (minOccurs > 0 && (elementData === undefined || elementData === null)) {
        console.log(`- RESULT: Would report as missing (ERROR)`);
    } else {
        console.log(`- RESULT: Would NOT report as missing (OK)`);
    }
}

// Test BtchBookg
if (groupHeaderType) {
    const btchBookgElement = groupHeaderType.children.find(c => c.name === 'BtchBookg');
    if (btchBookgElement) {
        testMinOccursLogic(btchBookgElement, 'BtchBookg');
    }
}

// Test UETR
if (paymentIdType) {
    const uetrElement = paymentIdType.children.find(c => c.name === 'UETR');
    if (uetrElement) {
        testMinOccursLogic(uetrElement, 'UETR');
    }
}
