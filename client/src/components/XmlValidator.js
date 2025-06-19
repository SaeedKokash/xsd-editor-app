import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Upload,
  CheckCircle,
  Error,
  Warning,
  Info,
  ExpandMore,
  Clear,
  Refresh,
  Code,
  Description
} from '@mui/icons-material';
import { validateXMLAgainstXSD } from '../services/api';

const XmlValidator = ({ schema }) => {
  const [xmlFile, setXmlFile] = useState(null);
  const [xmlContent, setXmlContent] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [inputMode, setInputMode] = useState('file'); // 'file' or 'text'

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'text/xml' || file.name.endsWith('.xml')) {
        setXmlFile(file);
        
        // Read file content for preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setXmlContent(e.target.result);
        };
        reader.readAsText(file);
        
        setValidationResult(null);
      } else {
        alert('Please select a valid XML file (.xml)');
      }
    }
  }, []);

  const handleTextInput = useCallback((value) => {
    setXmlContent(value);
    setXmlFile(null);
    setValidationResult(null);
  }, []);

  const validateXML = useCallback(async () => {
    if (!schema) {
      alert('No XSD schema loaded. Please upload an XSD file first.');
      return;
    }

    if (!xmlContent.trim()) {
      alert('Please provide XML content to validate.');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      console.log('Validating XML against current schema...');
      
      // Send both the current schema and XML content for validation
      const result = await validateXMLAgainstXSD(schema, xmlContent);
        console.log('Validation result:', result);
      
      // Extract the actual validation data from the API response
      if (result.success && result.data) {
        const validationData = {
          isValid: result.data.isValid,
          errors: result.data.errors || [],
          warnings: result.data.warnings || [],
          summary: result.data.summary
        };
        setValidationResult(validationData);
      } else {
        setValidationResult({
          isValid: false,
          errors: ['Validation failed: Invalid response from server'],
          warnings: [],
          summary: { totalErrors: 1, totalWarnings: 0 }
        });
      }
      
    } catch (error) {
      console.error('Validation failed:', error);
      setValidationResult({
        isValid: false,
        errors: [
          {
            type: 'error',
            message: `Validation failed: ${error.message}`,
            line: null,
            column: null
          }
        ]
      });
    } finally {
      setIsValidating(false);
    }
  }, [schema, xmlContent]);

  const clearAll = useCallback(() => {
    setXmlFile(null);
    setXmlContent('');
    setValidationResult(null);
  }, []);
  const getValidationSummary = () => {
    if (!validationResult) return null;

    const { isValid, errors = [], warnings = [] } = validationResult;
    
    // Convert string arrays to objects for consistent handling
    const errorObjects = errors.map(error => ({
      type: 'error',
      message: typeof error === 'string' ? error : error.message || 'Unknown error'
    }));
    
    const warningObjects = warnings.map(warning => ({
      type: 'warning', 
      message: typeof warning === 'string' ? warning : warning.message || 'Unknown warning'
    }));
    
    const errorCount = errorObjects.length;
    const warningCount = warningObjects.length;

    return {
      isValid,
      errorCount,
      warningCount,
      totalIssues: errorCount + warningCount,
      errorObjects,
      warningObjects
    };
  };

  const renderValidationIssue = (issue, index) => {
    const getIcon = () => {
      switch (issue.type) {
        case 'error': return <Error color="error" />;
        case 'warning': return <Warning color="warning" />;
        case 'info': return <Info color="info" />;
        default: return <Error color="error" />;
      }
    };

    const getColor = () => {
      switch (issue.type) {
        case 'error': return 'error';
        case 'warning': return 'warning';
        case 'info': return 'info';
        default: return 'error';
      }
    };

    return (
      <ListItem key={index} sx={{ py: 1 }}>
        <ListItemIcon sx={{ minWidth: 40 }}>
          {getIcon()}
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color={`${getColor()}.main`}>
                {issue.message}
              </Typography>
              {(issue.line || issue.column) && (
                <Chip 
                  label={`Line: ${issue.line || '?'}, Column: ${issue.column || '?'}`}
                  size="small"
                  variant="outlined"
                  color={getColor()}
                />
              )}
            </Box>
          }
          secondary={issue.details && (
            <Typography variant="caption" color="text.secondary">
              {issue.details}
            </Typography>
          )}
        />
      </ListItem>
    );
  };

  const summary = getValidationSummary();

  if (!schema) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <Description sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          No XSD Schema Loaded
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please upload and load an XSD schema first to validate XML files against it.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h4" gutterBottom>
          XML Validator
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Validate XML files against your current XSD schema. 
          The validation adapts automatically as you modify the schema.
        </Typography>
        {schema && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={`Schema: ${schema.targetNamespace || 'No namespace'}`}
              sx={{ backgroundColor: 'primary.light', color: 'primary.contrastText' }}
            />
            <Chip 
              label={`${schema.simpleTypes?.length || 0} Simple Types`}
              sx={{ backgroundColor: 'primary.light', color: 'primary.contrastText' }}
            />
            <Chip 
              label={`${schema.complexTypes?.length || 0} Complex Types`}
              sx={{ backgroundColor: 'primary.light', color: 'primary.contrastText' }}
            />
          </Box>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* Left Panel - XML Input */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2}>
            <Box sx={{ p: 2, backgroundColor: 'secondary.main', color: 'secondary.contrastText', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                XML Input
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={inputMode === 'file' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setInputMode('file')}
                  sx={{ color: 'secondary.contrastText', borderColor: 'secondary.contrastText' }}
                >
                  File Upload
                </Button>
                <Button
                  variant={inputMode === 'text' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setInputMode('text')}
                  sx={{ color: 'secondary.contrastText', borderColor: 'secondary.contrastText' }}
                >
                  Text Input
                </Button>
              </Box>
            </Box>
            
            <Divider />
            
            <Box sx={{ p: 3 }}>
              {inputMode === 'file' ? (
                // File Upload Mode
                <Box>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<Upload />}
                    fullWidth
                    sx={{ mb: 2, py: 2 }}
                  >
                    Upload XML File
                    <input
                      type="file"
                      accept=".xml,text/xml"
                      onChange={handleFileUpload}
                      hidden
                    />
                  </Button>
                  
                  {xmlFile && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>File loaded:</strong> {xmlFile.name} ({(xmlFile.size / 1024).toFixed(1)} KB)
                      </Typography>
                    </Alert>
                  )}
                </Box>
              ) : (
                // Text Input Mode
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Paste or type your XML content below:
                  </Typography>
                  <TextField
                    multiline
                    rows={8}
                    fullWidth
                    placeholder="<?xml version='1.0' encoding='UTF-8'?>&#10;<root>&#10;  <!-- Your XML content here -->&#10;</root>"
                    value={xmlContent}
                    onChange={(e) => handleTextInput(e.target.value)}
                    variant="outlined"
                    sx={{ fontFamily: 'monospace' }}
                  />
                </Box>
              )}

              {/* XML Preview */}
              {xmlContent && (
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">
                      XML Preview ({xmlContent.length} characters)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box 
                      sx={{ 
                        backgroundColor: 'grey.100', 
                        p: 2, 
                        borderRadius: 1, 
                        maxHeight: 300, 
                        overflow: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {xmlContent.substring(0, 1000)}
                      {xmlContent.length > 1000 && '...'}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={validateXML}
                  disabled={!xmlContent.trim() || isValidating}
                  startIcon={isValidating ? <Refresh /> : <CheckCircle />}
                  sx={{ flex: 1 }}
                >
                  {isValidating ? 'Validating...' : 'Validate XML'}
                </Button>
                <Tooltip title="Clear all content">
                  <IconButton onClick={clearAll} color="secondary">
                    <Clear />
                  </IconButton>
                </Tooltip>
              </Box>

              {isValidating && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Validating XML against current XSD schema...
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Panel - Validation Results */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2}>
            <Box sx={{ p: 2, backgroundColor: summary?.isValid ? 'success.main' : (summary ? 'error.main' : 'grey.600'), color: 'white' }}>
              <Typography variant="h6">
                Validation Results
              </Typography>
              {summary && (
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {summary.isValid ? 'XML is valid!' : `${summary.errorCount} error(s), ${summary.warningCount} warning(s)`}
                </Typography>
              )}
            </Box>
            
            <Divider />
            
            <Box sx={{ p: 3 }}>
              {!validationResult ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Code sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Ready to Validate
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload or paste XML content and click "Validate XML" to check it against your XSD schema.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {/* Validation Summary */}
                  <Card sx={{ mb: 3, backgroundColor: summary.isValid ? 'success.light' : 'error.light' }}>
                    <CardContent sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {summary.isValid ? (
                          <CheckCircle color="success" sx={{ fontSize: 32 }} />
                        ) : (
                          <Error color="error" sx={{ fontSize: 32 }} />
                        )}
                        <Box>
                          <Typography variant="h6" color={summary.isValid ? 'success.dark' : 'error.dark'}>
                            {summary.isValid ? 'Valid XML Document' : 'Invalid XML Document'}
                          </Typography>
                          <Typography variant="body2" color={summary.isValid ? 'success.dark' : 'error.dark'}>
                            {summary.isValid 
                              ? 'The XML document conforms to the XSD schema.'
                              : `Found ${summary.totalIssues} issue(s) that need to be resolved.`
                            }
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Header Detection Info */}
                  {validationResult.summary && (
                    <Alert 
                      severity={validationResult.summary.hasHeaderStructure ? "info" : "success"} 
                      sx={{ mb: 2 }}
                      icon={<Info />}
                    >
                      <Typography variant="body2">
                        <strong>Validation Scope:</strong> {validationResult.summary.validatedElement || 'Root element'}
                        {validationResult.summary.hasHeaderStructure && (
                          <span> - Header structure detected and Document element extracted for validation.</span>
                        )}
                      </Typography>
                    </Alert>
                  )}

                  {/* Issues List */}
                  {summary.totalIssues > 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Issues Found
                      </Typography>
                      <List dense>
                        {summary.errorObjects?.map((error, index) => renderValidationIssue(error, index))}
                        {summary.warningObjects?.map((warning, index) => renderValidationIssue(warning, `warning-${index}`))}
                      </List>
                    </Box>
                  )}

                  {/* Success Message */}
                  {summary.isValid && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Congratulations!</strong> Your XML document is valid according to the current XSD schema. 
                        All elements, attributes, and data types conform to the schema requirements.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Schema Information */}
      <Paper elevation={1} sx={{ p: 3, backgroundColor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          Current XSD Schema Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Target Namespace:</Typography>
            <Typography variant="body2">{schema.targetNamespace || 'None'}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Element Form Default:</Typography>
            <Typography variant="body2">{schema.elementFormDefault || 'unqualified'}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Attribute Form Default:</Typography>
            <Typography variant="body2">{schema.attributeFormDefault || 'unqualified'}</Typography>
          </Grid>
        </Grid>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> This validator uses the current state of your XSD schema. 
            Any modifications you make to the schema (adding/editing simple types, complex types, elements, etc.) 
            will automatically be reflected in the validation process.
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
};

export default XmlValidator;
