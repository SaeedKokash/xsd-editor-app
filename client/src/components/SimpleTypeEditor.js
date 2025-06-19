import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Tooltip,
  Paper,
  Badge
} from '@mui/material';
import {
  ExpandMore,
  Add,
  Delete,
  Info,
  CheckCircle
} from '@mui/icons-material';
import PropTypes from 'prop-types';

const SimpleTypeEditor = ({ simpleType, onChange, disableNameEdit = false }) => {
  const [editingType, setEditingType] = useState(simpleType || {
    name: '',
    base: '',
    documentation: '',
    restrictions: {
      enumerations: [],
      pattern: '',
      minLength: undefined,
      maxLength: undefined,
      length: undefined,
      fractionDigits: undefined,
      totalDigits: undefined,
      minInclusive: undefined,
      maxInclusive: undefined,
      minExclusive: undefined,
      maxExclusive: undefined,
      whiteSpace: undefined
    }
  });
  const [newEnumValue, setNewEnumValue] = useState('');
  // Synchronize with prop changes
  useEffect(() => {
    if (simpleType) {
      console.log('SimpleTypeEditor: Syncing with new simpleType prop:', simpleType.name);
      setEditingType({
        ...simpleType,
        restrictions: simpleType.restrictions || {
          enumerations: [],
          pattern: '',
          minLength: undefined,
          maxLength: undefined,
          length: undefined,
          fractionDigits: undefined,
          totalDigits: undefined,
          minInclusive: undefined,
          maxInclusive: undefined,
          minExclusive: undefined,
          maxExclusive: undefined,
          whiteSpace: undefined
        }
      });
      // Clear the enum input when switching types
      setNewEnumValue('');
    }
  }, [simpleType]);

  const handlePropertyChange = useCallback((property, value) => {
    const updatedType = { ...editingType };
    
    if (property.startsWith('restrictions.')) {
      const restrictionProperty = property.replace('restrictions.', '');
      updatedType.restrictions = {
        ...updatedType.restrictions,
        [restrictionProperty]: value === '' ? undefined : value
      };
    } else {
      updatedType[property] = value;
    }
    
    setEditingType(updatedType);
    if (onChange) {
      onChange(updatedType);
    }
  }, [editingType, onChange]);

  const handleAddEnumeration = useCallback(() => {
    if (newEnumValue.trim()) {
      const updatedEnums = [...(editingType.restrictions.enumerations || []), newEnumValue.trim()];
      handlePropertyChange('restrictions.enumerations', updatedEnums);
      setNewEnumValue('');
    }
  }, [newEnumValue, editingType.restrictions.enumerations, handlePropertyChange]);

  const handleRemoveEnumeration = useCallback((index) => {
    const updatedEnums = editingType.restrictions.enumerations.filter((_, i) => i !== index);
    handlePropertyChange('restrictions.enumerations', updatedEnums);
  }, [editingType.restrictions.enumerations, handlePropertyChange]);

  const getRestrictionInfo = (restrictionType) => {
    const info = {
      pattern: 'Regular expression pattern for string validation',
      minLength: 'Minimum number of characters',
      maxLength: 'Maximum number of characters',
      length: 'Exact number of characters',
      fractionDigits: 'Maximum number of decimal places',
      totalDigits: 'Total maximum number of digits',
      minInclusive: 'Minimum value (inclusive)',
      maxInclusive: 'Maximum value (inclusive)',
      minExclusive: 'Minimum value (exclusive)',
      maxExclusive: 'Maximum value (exclusive)',
      whiteSpace: 'Whitespace handling: preserve, replace, or collapse'
    };
    return info[restrictionType] || '';
  };

  const getActiveRestrictionsCount = () => {
    const restrictions = editingType.restrictions || {};
    let count = 0;
    
    Object.keys(restrictions).forEach(key => {
      if (key === 'enumerations') {
        if (restrictions[key] && restrictions[key].length > 0) count++;
      } else if (restrictions[key] !== undefined && restrictions[key] !== '') {
        count++;
      }
    });
    
    return count;
  };

  const getBaseTypeHelp = (baseType) => {
    const typeHelp = {
      'xs:string': 'Text data type',
      'xs:decimal': 'Decimal number (with fractions)',
      'xs:integer': 'Whole number',
      'xs:boolean': 'True/false value',
      'xs:date': 'Date (YYYY-MM-DD)',
      'xs:time': 'Time (HH:MM:SS)',
      'xs:dateTime': 'Date and time combined',
      'xs:duration': 'Duration (P1Y2M3DT4H5M6S)',
      'xs:anyURI': 'URI/URL',
      'xs:base64Binary': 'Base64 encoded binary data',
      'xs:hexBinary': 'Hexadecimal encoded binary data'
    };
    return typeHelp[baseType] || '';
  };

  const validateRestrictions = () => {
    const restrictions = editingType.restrictions || {};
    const warnings = [];
    
    // Check for conflicting length restrictions
    if (restrictions.length !== undefined && 
        (restrictions.minLength !== undefined || restrictions.maxLength !== undefined)) {
      warnings.push('Length conflicts with minLength/maxLength - use either exact length OR min/max length');
    }
    
    // Check for conflicting value restrictions
    if (restrictions.minInclusive !== undefined && restrictions.minExclusive !== undefined) {
      warnings.push('Cannot use both minInclusive and minExclusive');
    }
    
    if (restrictions.maxInclusive !== undefined && restrictions.maxExclusive !== undefined) {
      warnings.push('Cannot use both maxInclusive and maxExclusive');
    }
    
    // Check numeric restrictions for non-numeric types
    if (editingType.base && !editingType.base.includes('decimal') && !editingType.base.includes('integer') && !editingType.base.includes('double') && !editingType.base.includes('float')) {
      if (restrictions.fractionDigits !== undefined || restrictions.totalDigits !== undefined) {
        warnings.push('Numeric restrictions (fractionDigits, totalDigits) only apply to numeric types');
      }
    }
    
    return warnings;
  };

  const isNumericType = (baseType) => {
    return baseType && (
      baseType.includes('decimal') || 
      baseType.includes('integer') || 
      baseType.includes('double') || 
      baseType.includes('float') ||
      baseType.includes('long') ||
      baseType.includes('int') ||
      baseType.includes('short') ||
      baseType.includes('byte')
    );
  };

  const isStringType = (baseType) => {
    return baseType && baseType.includes('string');
  };

  if (!editingType) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No simple type selected for editing
        </Typography>
      </Box>
    );
  }

  const restrictionWarnings = validateRestrictions();
  const activeRestrictions = getActiveRestrictionsCount();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header with type info */}
      <Paper elevation={1} sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h5" gutterBottom>
          {editingType.name || 'Unnamed Simple Type'}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Base Type: {editingType.base || 'Not specified'} {getBaseTypeHelp(editingType.base) && `(${getBaseTypeHelp(editingType.base)})`}
        </Typography>
        {activeRestrictions > 0 && (
          <Chip 
            label={`${activeRestrictions} restriction${activeRestrictions > 1 ? 's' : ''} applied`}
            size="small"
            sx={{ mt: 1, bgcolor: 'primary.light', color: 'primary.contrastText' }}
          />
        )}
      </Paper>

      {/* Validation warnings */}
      {restrictionWarnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Validation Issues:</Typography>
          {restrictionWarnings.map((warning, index) => (
            <Typography key={index} variant="body2">• {warning}</Typography>
          ))}
        </Alert>
      )}

      {/* Basic Properties */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Basic Properties</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>              <TextField
                label="Simple Type Name"
                value={editingType.name || ''}
                onChange={(e) => handlePropertyChange('name', e.target.value)}
                fullWidth
                variant="outlined"
                disabled={disableNameEdit}
                helperText={disableNameEdit ? "Name editing disabled - use 'Save as New Type' to create a copy with a new name" : "Enter the name for this simple type"}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Base Type</InputLabel>
                <Select
                  value={editingType.base || ''}
                  onChange={(e) => handlePropertyChange('base', e.target.value)}
                  label="Base Type"
                >
                  <MenuItem value="">
                    <em>Select base type</em>
                  </MenuItem>
                  <MenuItem value="xs:string">xs:string</MenuItem>
                  <MenuItem value="xs:decimal">xs:decimal</MenuItem>
                  <MenuItem value="xs:integer">xs:integer</MenuItem>
                  <MenuItem value="xs:boolean">xs:boolean</MenuItem>
                  <MenuItem value="xs:date">xs:date</MenuItem>
                  <MenuItem value="xs:time">xs:time</MenuItem>
                  <MenuItem value="xs:dateTime">xs:dateTime</MenuItem>
                  <MenuItem value="xs:duration">xs:duration</MenuItem>
                  <MenuItem value="xs:anyURI">xs:anyURI</MenuItem>
                  <MenuItem value="xs:base64Binary">xs:base64Binary</MenuItem>
                  <MenuItem value="xs:hexBinary">xs:hexBinary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Documentation"
                value={editingType.documentation || ''}
                onChange={(e) => handlePropertyChange('documentation', e.target.value)}
                multiline
                rows={2}
                fullWidth
                variant="outlined"
                helperText="Optional description of this simple type"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>      {/* Enumerations */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Enumerations</Typography>
            {editingType.restrictions.enumerations && editingType.restrictions.enumerations.length > 0 && (
              <Badge badgeContent={editingType.restrictions.enumerations.length} color="primary">
                <CheckCircle color="success" fontSize="small" />
              </Badge>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Enumerations restrict the value to a specific set of allowed values. 
                This is useful for creating dropdown lists or validation constraints.
              </Typography>
            </Alert>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label="New enumeration value"
                value={newEnumValue}
                onChange={(e) => setNewEnumValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddEnumeration()}
                size="small"
                sx={{ flexGrow: 1 }}
                helperText="Press Enter or click Add to include this value"
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddEnumeration}
                disabled={!newEnumValue.trim()}
                size="small"
              >
                Add
              </Button>
            </Box>
            
            {editingType.restrictions.enumerations && editingType.restrictions.enumerations.length > 0 ? (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Allowed Values ({editingType.restrictions.enumerations.length}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {editingType.restrictions.enumerations.map((enumValue, index) => (
                    <Chip
                      key={index}
                      label={enumValue}
                      onDelete={() => handleRemoveEnumeration(index)}
                      deleteIcon={<Delete />}
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No enumeration values defined. Add values above to restrict this type to specific choices.
              </Typography>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Pattern and String Constraints */}
      {(isStringType(editingType.base) || !editingType.base) && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">Pattern and String Constraints</Typography>
              {(editingType.restrictions.pattern || 
                editingType.restrictions.minLength !== undefined || 
                editingType.restrictions.maxLength !== undefined || 
                editingType.restrictions.length !== undefined ||
                editingType.restrictions.whiteSpace) && (
                <CheckCircle color="success" fontSize="small" />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    String constraints apply to text-based data types and control formatting, length, and patterns.
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Pattern (Regular Expression)"
                  value={editingType.restrictions.pattern || ''}
                  onChange={(e) => handlePropertyChange('restrictions.pattern', e.target.value)}
                  fullWidth
                  variant="outlined"
                  helperText="Use regex patterns like [A-Z]{3} for 3 uppercase letters"
                  InputProps={{
                    endAdornment: (
                      <Tooltip title={getRestrictionInfo('pattern')}>
                        <IconButton size="small">
                          <Info />
                        </IconButton>
                      </Tooltip>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Min Length"
                  type="number"
                  value={editingType.restrictions.minLength || ''}
                  onChange={(e) => handlePropertyChange('restrictions.minLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  fullWidth
                  variant="outlined"
                  inputProps={{ min: 0 }}
                  helperText={getRestrictionInfo('minLength')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Max Length"
                  type="number"
                  value={editingType.restrictions.maxLength || ''}
                  onChange={(e) => handlePropertyChange('restrictions.maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  fullWidth
                  variant="outlined"
                  inputProps={{ min: 0 }}
                  helperText={getRestrictionInfo('maxLength')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Exact Length"
                  type="number"
                  value={editingType.restrictions.length || ''}
                  onChange={(e) => handlePropertyChange('restrictions.length', e.target.value ? parseInt(e.target.value) : undefined)}
                  fullWidth
                  variant="outlined"
                  inputProps={{ min: 0 }}
                  helperText={getRestrictionInfo('length')}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>White Space Handling</InputLabel>
                  <Select
                    value={editingType.restrictions.whiteSpace || ''}
                    onChange={(e) => handlePropertyChange('restrictions.whiteSpace', e.target.value)}
                    label="White Space Handling"
                  >
                    <MenuItem value="">
                      <em>Default</em>
                    </MenuItem>
                    <MenuItem value="preserve">Preserve - Keep all whitespace as-is</MenuItem>
                    <MenuItem value="replace">Replace - Convert tabs/newlines to spaces</MenuItem>
                    <MenuItem value="collapse">Collapse - Remove leading/trailing and condense internal whitespace</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Numeric Constraints */}
      {isNumericType(editingType.base) && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">Numeric Constraints</Typography>
              {(editingType.restrictions.fractionDigits !== undefined || 
                editingType.restrictions.totalDigits !== undefined) && (
                <CheckCircle color="success" fontSize="small" />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Numeric constraints control the precision and scale of decimal numbers.
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fraction Digits"
                  type="number"
                  value={editingType.restrictions.fractionDigits || ''}
                  onChange={(e) => handlePropertyChange('restrictions.fractionDigits', e.target.value ? parseInt(e.target.value) : undefined)}
                  fullWidth
                  variant="outlined"
                  inputProps={{ min: 0 }}
                  helperText="Maximum digits after the decimal point"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Total Digits"
                  type="number"
                  value={editingType.restrictions.totalDigits || ''}
                  onChange={(e) => handlePropertyChange('restrictions.totalDigits', e.target.value ? parseInt(e.target.value) : undefined)}
                  fullWidth
                  variant="outlined"
                  inputProps={{ min: 1 }}
                  helperText="Maximum total number of digits"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}      {/* Value Range Constraints */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Value Range Constraints</Typography>
            {(editingType.restrictions.minInclusive !== undefined || 
              editingType.restrictions.maxInclusive !== undefined ||
              editingType.restrictions.minExclusive !== undefined || 
              editingType.restrictions.maxExclusive !== undefined) && (
              <CheckCircle color="success" fontSize="small" />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Value range constraints set minimum and maximum boundaries for the data. 
                  Use "inclusive" to include the boundary value, "exclusive" to exclude it.
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Min Inclusive"
                value={editingType.restrictions.minInclusive || ''}
                onChange={(e) => handlePropertyChange('restrictions.minInclusive', e.target.value)}
                fullWidth
                variant="outlined"
                helperText="Minimum value (included in valid range)"
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Value must be greater than or equal to this">
                      <IconButton size="small">
                        <Info />
                      </IconButton>
                    </Tooltip>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Max Inclusive"
                value={editingType.restrictions.maxInclusive || ''}
                onChange={(e) => handlePropertyChange('restrictions.maxInclusive', e.target.value)}
                fullWidth
                variant="outlined"
                helperText="Maximum value (included in valid range)"
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Value must be less than or equal to this">
                      <IconButton size="small">
                        <Info />
                      </IconButton>
                    </Tooltip>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Min Exclusive"
                value={editingType.restrictions.minExclusive || ''}
                onChange={(e) => handlePropertyChange('restrictions.minExclusive', e.target.value)}
                fullWidth
                variant="outlined"
                helperText="Minimum value (excluded from valid range)"
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Value must be greater than this">
                      <IconButton size="small">
                        <Info />
                      </IconButton>
                    </Tooltip>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Max Exclusive"
                value={editingType.restrictions.maxExclusive || ''}
                onChange={(e) => handlePropertyChange('restrictions.maxExclusive', e.target.value)}
                fullWidth
                variant="outlined"
                helperText="Maximum value (excluded from valid range)"
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Value must be less than this">
                      <IconButton size="small">
                        <Info />
                      </IconButton>
                    </Tooltip>
                  )
                }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Restrictions Summary */}
      {activeRestrictions > 0 && (
        <Paper elevation={2} sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            Applied Restrictions Summary
          </Typography>
          <Grid container spacing={1}>
            {editingType.restrictions.enumerations && editingType.restrictions.enumerations.length > 0 && (
              <Grid item>
                <Chip 
                  size="small" 
                  label={`${editingType.restrictions.enumerations.length} enumerations`}
                  color="primary"
                  variant="outlined"
                />
              </Grid>
            )}
            {editingType.restrictions.pattern && (
              <Grid item>
                <Chip 
                  size="small" 
                  label="Pattern constraint"
                  color="secondary"
                  variant="outlined"
                />
              </Grid>
            )}
            {(editingType.restrictions.minLength !== undefined || 
              editingType.restrictions.maxLength !== undefined || 
              editingType.restrictions.length !== undefined) && (
              <Grid item>
                <Chip 
                  size="small" 
                  label="Length constraint"
                  color="info"
                  variant="outlined"
                />
              </Grid>
            )}
            {(editingType.restrictions.fractionDigits !== undefined || 
              editingType.restrictions.totalDigits !== undefined) && (
              <Grid item>
                <Chip 
                  size="small" 
                  label="Numeric precision"
                  color="warning"
                  variant="outlined"
                />
              </Grid>
            )}
            {(editingType.restrictions.minInclusive !== undefined || 
              editingType.restrictions.maxInclusive !== undefined ||
              editingType.restrictions.minExclusive !== undefined || 
              editingType.restrictions.maxExclusive !== undefined) && (
              <Grid item>
                <Chip 
                  size="small" 
                  label="Value range"
                  color="success"
                  variant="outlined"
                />
              </Grid>
            )}
            {editingType.restrictions.whiteSpace && (
              <Grid item>
                <Chip 
                  size="small" 
                  label="Whitespace handling"
                  color="default"
                  variant="outlined"
                />
              </Grid>
            )}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

SimpleTypeEditor.propTypes = {
  simpleType: PropTypes.object,
  onChange: PropTypes.func,
  disableNameEdit: PropTypes.bool
};

export default SimpleTypeEditor;
