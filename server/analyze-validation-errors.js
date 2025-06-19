const xsdParser = require('./src/services/xsdParser');
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');

// Read the TEST.xsd file
const testXsdPath = path.join(__dirname, '..', '..', 'TEST.xsd');
const xsdContent = fs.readFileSync(testXsdPath, 'utf8');

// Read the XML file
const xmlPath = path.join(__dirname, '..', '..', 'pacs.008.001.08 cross-border(4).xml');
const xmlContent = fs.readFileSync(xmlPath, 'utf8');

// Parse the schema
const schema = xsdParser.parseXSD(xsdContent);

// Parse the XML to inspect its structure
const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
    trimValues: true,
    parseTrueNumberOnly: false
});
const parsedXML = parser.parse(xmlContent);

console.log('=== ANALYZING VALIDATION ERRORS ===\n');

// Error 1: Required element 'Document.FIToFICstmrCdtTrf.CdtTrfTxInf.UltmtDbtr.Id.PrvtId.Othr.Id' is missing
console.log('1. CHECKING: UltmtDbtr.Id.PrvtId.Othr.Id structure');

// Navigate to the UltmtDbtr element in the XML
const document = parsedXML.DataPDU?.Body?.Document;
if (document) {
    const ultmtDbtr = document.FIToFICstmrCdtTrf?.CdtTrfTxInf?.UltmtDbtr;
    if (ultmtDbtr) {
        console.log('UltmtDbtr structure in XML:');
        console.log(JSON.stringify(ultmtDbtr, null, 2));
        
        // Check if there are multiple Othr elements
        const prvtId = ultmtDbtr.Id?.PrvtId;
        if (prvtId && prvtId.Othr) {
            console.log('\nOthr elements:');
            if (Array.isArray(prvtId.Othr)) {
                console.log(`Found ${prvtId.Othr.length} Othr elements (array)`);
                prvtId.Othr.forEach((othr, index) => {
                    console.log(`  Othr[${index}]:`, othr);
                });
            } else {
                console.log('Found single Othr element:', prvtId.Othr);
            }
        }
    }
}

console.log('\n2. CHECKING: IntrBkSttlmAmt structure');

// Check IntrBkSttlmAmt structure
const cdtTrfTxInf = document?.FIToFICstmrCdtTrf?.CdtTrfTxInf;
if (cdtTrfTxInf) {
    console.log('IntrBkSttlmAmt in XML:');
    console.log(JSON.stringify(cdtTrfTxInf.IntrBkSttlmAmt, null, 2));
}

console.log('\n3. CHECKING: Schema definitions for these elements');

// Find relevant schema definitions
function findComplexType(schema, typeName) {
    return schema.complexTypes?.find(ct => ct.name === typeName);
}

// Check PartyIdentification135__1 (UltmtDbtr type)
const partyId135Type = findComplexType(schema, 'PartyIdentification135__1');
if (partyId135Type) {
    console.log('\nPartyIdentification135__1 schema:');
    console.log('Children:', partyId135Type.children?.map(c => `${c.name} (minOccurs: ${c.minOccurs}, maxOccurs: ${c.maxOccurs})`));
}

// Check PersonIdentification13__1 type (for PrvtId)
const personId13Type = findComplexType(schema, 'PersonIdentification13__1');
if (personId13Type) {
    console.log('\nPersonIdentification13__1 schema:');
    console.log('Children:', personId13Type.children?.map(c => `${c.name} (minOccurs: ${c.minOccurs}, maxOccurs: ${c.maxOccurs})`));
}

// Check GenericPersonIdentification1__1 type (for Othr)
const genericPersonIdType = findComplexType(schema, 'GenericPersonIdentification1__1');
if (genericPersonIdType) {
    console.log('\nGenericPersonIdentification1__1 schema:');
    console.log('Children:', genericPersonIdType.children?.map(c => `${c.name} (minOccurs: ${c.minOccurs}, maxOccurs: ${c.maxOccurs})`));
}

// Check ActiveCurrencyAndAmount type (for IntrBkSttlmAmt)
const activeCurrencyAmountType = findComplexType(schema, 'ActiveCurrencyAndAmount');
if (activeCurrencyAmountType) {
    console.log('\nActiveCurrencyAndAmount schema:');
    console.log('Children:', activeCurrencyAmountType.children?.map(c => `${c.name} (minOccurs: ${c.minOccurs}, maxOccurs: ${c.maxOccurs})`));
    console.log('Base type:', activeCurrencyAmountType.baseType);
    console.log('Content type:', activeCurrencyAmountType.contentType);
}

console.log('\n=== SUMMARY OF ISSUES ===');
console.log('The validation errors suggest:');
console.log('1. Multiple Othr elements are being parsed as array indices (0, 1, 2) instead of proper array handling');
console.log('2. IntrBkSttlmAmt content (#text) is not being recognized as valid simple content');
console.log('3. DtAndPlcOfBirth element is not being found in schema (possible nested type issue)');
console.log('4. Array handling for maxOccurs="unbounded" elements needs fixing');
