const xsdParser = require('./src/services/xsdParser');
const fs = require('fs');
const path = require('path');

// Read the TEST.xsd file
const testXsdPath = path.join(__dirname, '..', '..', 'TEST.xsd');
const xsdContent = fs.readFileSync(testXsdPath, 'utf8');

// Parse the schema
const schema = xsdParser.parseXSD(xsdContent);

// Find BtchBookg and UETR elements in the schema
function findElementInSchema(elements, name) {
    for (let element of elements) {
        if (element.name === name) {
            return element;
        }
        if (element.complexType && element.complexType.children) {
            const found = findElementInSchema(element.complexType.children, name);
            if (found) return found;
        }
    }
    return null;
}

function findElementRecursively(elements, name, visited = new Set()) {
    if (!elements) return null;
    
    for (let element of elements) {
        if (element.name === name) {
            return element;
        }
        
        // Check in complex types
        if (element.complexType && element.complexType.children) {
            const found = findElementRecursively(element.complexType.children, name, visited);
            if (found) return found;
        }
    }
    
    return null;
}

console.log('=== Schema Analysis ===');
console.log('Total elements:', schema.elements?.length || 0);
console.log('Total complex types:', schema.complexTypes?.length || 0);

// Look for BtchBookg
let btchBookgElement = findElementRecursively(schema.elements, 'BtchBookg');
if (!btchBookgElement && schema.complexTypes) {
    for (let complexType of schema.complexTypes) {
        if (complexType.children) {
            btchBookgElement = findElementRecursively(complexType.children, 'BtchBookg');
            if (btchBookgElement) break;
        }
    }
}

console.log('\n=== BtchBookg Element ===');
if (btchBookgElement) {
    console.log('Found BtchBookg:', JSON.stringify(btchBookgElement, null, 2));
} else {
    console.log('BtchBookg not found in schema');
}

// Look for UETR
let uetrElement = findElementRecursively(schema.elements, 'UETR');
if (!uetrElement && schema.complexTypes) {
    for (let complexType of schema.complexTypes) {
        if (complexType.children) {
            uetrElement = findElementRecursively(complexType.children, 'UETR');
            if (uetrElement) break;
        }
    }
}

console.log('\n=== UETR Element ===');
if (uetrElement) {
    console.log('Found UETR:', JSON.stringify(uetrElement, null, 2));
} else {
    console.log('UETR not found in schema');
}
