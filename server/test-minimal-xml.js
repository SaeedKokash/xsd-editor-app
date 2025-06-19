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

// Test with minimal XML - missing optional BtchBookg and UETR
const minimalXML = `
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
    <FIToFICstmrCdtTrf>
        <GrpHdr>
            <MsgId>TEST123</MsgId>
            <CreDtTm>2025-06-17T12:12:12</CreDtTm>
            <NbOfTxs>1</NbOfTxs>
            <SttlmInf>
            </SttlmInf>
        </GrpHdr>
        <CdtTrfTxInf>
            <PmtId>
                <EndToEndId>TEST</EndToEndId>
            </PmtId>
            <PmtTpInf>
                <ClrChanl>RTNS</ClrChanl>
                <SvcLvl>
                </SvcLvl>
                <LclInstrm>
                </LclInstrm>
            </PmtTpInf>
            <IntrBkSttlmAmt>1000</IntrBkSttlmAmt>
            <IntrBkSttlmDt>2025-06-17</IntrBkSttlmDt>
            <ChrgBr>SLEV</ChrgBr>
            <InstgAgt>
                <FinInstnId>
                </FinInstnId>
            </InstgAgt>
            <InstdAgt>
                <FinInstnId>
                </FinInstnId>
            </InstdAgt>
            <Dbtr>
            </Dbtr>
            <DbtrAgt>
                <FinInstnId>
                </FinInstnId>
            </DbtrAgt>
            <CdtrAgt>
                <FinInstnId>
                </FinInstnId>
            </CdtrAgt>
            <Cdtr>
            </Cdtr>
        </CdtTrfTxInf>
    </FIToFICstmrCdtTrf>
</Document>
`;

console.log('Testing with minimal XML (missing BtchBookg and UETR)...');

try {
    const mockReq = {
        body: {
            xmlContent: minimalXML,
            schema: schema
        }
    };
    
    const mockRes = {
        json: (data) => {
            console.log('Validation Result:');
            console.log('Valid:', data.data.isValid);
            console.log('Errors:', data.data.errors);
            console.log('Warnings:', data.data.warnings);
        },
        status: (code) => ({
            json: (data) => {
                console.log(`Status ${code}:`, data);
            }
        })
    };
    
    xsdController.validateXMLAgainstXSD(mockReq, mockRes);
    
} catch (error) {
    console.error('Test error:', error);
}
