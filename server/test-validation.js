const xsdParser = require('./src/services/xsdParser');
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');

// Parse the XSD
const xsdContent = fs.readFileSync('../../TEST.xsd', 'utf8');
const parsedSchema = xsdParser.parseXSD(xsdContent);

console.log('=== SCHEMA VERIFICATION ===');
const grpHdrType = parsedSchema.complexTypes.find(t => t.name === 'GroupHeader93__1');
const btchBookgElement = grpHdrType.children.find(c => c.name === 'BtchBookg');
console.log('BtchBookg element:', btchBookgElement);

const pmtIdType = parsedSchema.complexTypes.find(t => t.name === 'PaymentIdentification7__1');
const uetrElement = pmtIdType.children.find(c => c.name === 'UETR');
console.log('UETR element:', uetrElement);

// Simple XML without BtchBookg and UETR
const xmlContent = `<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>TEST</MsgId>
      <CreDtTm>2023-01-01T10:00:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf></SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>E2E-001</EndToEndId>
      </PmtId>
      <PmtTpInf>
        <ClrChanl>RTNS</ClrChanl>
        <SvcLvl><Prtry>0100</Prtry></SvcLvl>
        <LclInstrm><Prtry>CBPT</Prtry></LclInstrm>
      </PmtTpInf>
      <IntrBkSttlmAmt Ccy="JOD">10000</IntrBkSttlmAmt>
      <IntrBkSttlmDt>2023-01-01</IntrBkSttlmDt>
      <ChrgBr>SLEV</ChrgBr>
      <InstgAgt><FinInstnId><BICFI>TESTJOA0</BICFI></FinInstnId></InstgAgt>
      <InstdAgt><FinInstnId><ClrSysMmbId><MmbId>ALWPJOP0</MmbId></ClrSysMmbId></FinInstnId></InstdAgt>
      <Dbtr><Nm>Test</Nm></Dbtr>
      <CdtrAgt><FinInstnId><BICFI>ALWPJOP0</BICFI></FinInstnId></CdtrAgt>
      <Cdtr><Nm>Test</Nm></Cdtr>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;

// Parse XML
const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: false,
    trimValues: true
});

const parsedXML = xmlParser.parse(xmlContent);

console.log('\n=== XML STRUCTURE ===');
console.log('GrpHdr keys:', Object.keys(parsedXML.Document.FIToFICstmrCdtTrf.GrpHdr));
console.log('PmtId keys:', Object.keys(parsedXML.Document.FIToFICstmrCdtTrf.CdtTrfTxInf.PmtId));

// Import the validation function
const { validateXMLAgainstXSD } = require('./src/controllers/xsdController');

// Create a mock request and response to test validation
const mockReq = {
    body: {
        schema: parsedSchema,
        xmlContent: xmlContent
    }
};

const mockRes = {
    json: function(data) {
        console.log('\n=== VALIDATION RESULT ===');
        console.log('Is Valid:', data.data.isValid);
        console.log('Errors:', data.data.errors);
        console.log('Warnings:', data.data.warnings);
        
        // Check specifically for BtchBookg and UETR errors
        const btchBookgErrors = data.data.errors.filter(e => e.includes('BtchBookg'));
        const uetrErrors = data.data.errors.filter(e => e.includes('UETR'));
        
        console.log('\n=== SPECIFIC CHECKS ===');
        console.log('BtchBookg errors:', btchBookgErrors);
        console.log('UETR errors:', uetrErrors);
        
        if (btchBookgErrors.length > 0 || uetrErrors.length > 0) {
            console.log('\n❌ ISSUE FOUND: Optional elements being reported as required!');
        } else {
            console.log('\n✅ No issues with optional elements');
        }
    }
};

// Run the validation
console.log('\n=== RUNNING VALIDATION ===');
validateXMLAgainstXSD(mockReq, mockRes);
