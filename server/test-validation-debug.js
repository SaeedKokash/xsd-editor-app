const xsdParser = require('./src/services/xsdParser');
const fs = require('fs');
const path = require('path');

// Read the TEST.xsd file
const testXsdPath = path.join(__dirname, '..', '..', 'TEST.xsd');
const xsdContent = fs.readFileSync(testXsdPath, 'utf8');

// Parse the schema
const schema = xsdParser.parseXSD(xsdContent);

// Import validation logic from controller
const xsdController = require('./src/controllers/xsdController');

// Create a simple test XML without BtchBookg and UETR
const testXML = `
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
    <FIToFICstmrCdtTrf>
        <GrpHdr>
            <MsgId>TEST123</MsgId>
            <CreDtTm>2025-06-17T12:12:12</CreDtTm>
            <NbOfTxs>1</NbOfTxs>
            <SttlmInf>
                <SttlmMtd>CLRG</SttlmMtd>
            </SttlmInf>
        </GrpHdr>
        <CdtTrfTxInf>
            <PmtId>
                <EndToEndId>TEST</EndToEndId>
            </PmtId>
            <PmtTpInf>
                <ClrChanl>RTNS</ClrChanl>
                <SvcLvl>
                    <Prtry>0100</Prtry>
                </SvcLvl>
                <LclInstrm>
                    <Prtry>CBPT</Prtry>
                </LclInstrm>
            </PmtTpInf>
            <IntrBkSttlmAmt Ccy="JOD">1000</IntrBkSttlmAmt>
            <IntrBkSttlmDt>2025-06-17</IntrBkSttlmDt>
            <ChrgBr>SLEV</ChrgBr>
            <InstgAgt>
                <FinInstnId>
                    <BICFI>TESTJOA0</BICFI>
                </FinInstnId>
            </InstgAgt>
            <InstdAgt>
                <FinInstnId>
                    <BICFI>TESTJOA0</BICFI>
                </FinInstnId>
            </InstdAgt>
            <Dbtr>
                <Nm>Test</Nm>
            </Dbtr>
            <DbtrAgt>
                <FinInstnId>
                    <BICFI>TESTJOA0</BICFI>
                </FinInstnId>
            </DbtrAgt>
            <CdtrAgt>
                <FinInstnId>
                    <BICFI>TESTJOA0</BICFI>
                </FinInstnId>
            </CdtrAgt>
            <Cdtr>
                <Nm>Test</Nm>
            </Cdtr>
        </CdtTrfTxInf>
    </FIToFICstmrCdtTrf>
</Document>
`;

// Test the validation logic manually
console.log('Testing validation logic...');

try {
    // Simulate the request body
    const mockReq = {
        body: {
            xmlContent: testXML,
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
