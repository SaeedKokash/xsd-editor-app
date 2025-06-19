import React, { useState, useEffect } from 'react';
import { 
  Box,
  Paper,
  TextField, 
  Button, 
  Typography, 
  Chip,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ButtonGroup
} from '@mui/material';
import {
  Edit,
  Save,
  ContentCopy
} from '@mui/icons-material';
import SimpleTypeEditor from './SimpleTypeEditor';

const ElementEditor = ({ schema, selectedNode, onElementUpdate, onSimpleTypeUpdate }) => {
    const [elementData, setElementData] = useState({
        name: '',
        type: '',
        minOccurs: '1',
        maxOccurs: '1',
        documentation: ''
    });
    
    const [simpleTypeData, setSimpleTypeData] = useState(null);
    const [isEditingSimpleType, setIsEditingSimpleType] = useState(false);
    const [originalSimpleType, setOriginalSimpleType] = useState(null);
    
    // New state for enhanced functionality
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [saveMode, setSaveMode] = useState('update'); // 'update' or 'duplicate'

    // Debug effect to monitor dialog state
    useEffect(() => {
        console.log('Dialog state changed - showDuplicateDialog:', showDuplicateDialog, 'newTypeName:', newTypeName);
    }, [showDuplicateDialog, newTypeName]);

    useEffect(() => {
        console.log('ElementEditor useEffect triggered - selectedNode changed:', selectedNode?.name);
        
        // Reset all states when switching elements
        setIsEditingSimpleType(false);
        setShowDuplicateDialog(false);
        setNewTypeName('');
        setSaveMode('update');
        
        if (selectedNode && selectedNode.nodeType === 'element') {
            setElementData({
                name: selectedNode.name || '',
                type: selectedNode.type || '',
                minOccurs: selectedNode.minOccurs || '1',
                maxOccurs: selectedNode.maxOccurs || '1',
                documentation: selectedNode.documentation || ''
            });

            // Check if this element references a simple type that can be edited
            const simpleType = findSimpleTypeForElement(selectedNode, schema);
            if (simpleType) {
                // CRITICAL: Always use deep clones to prevent accidental mutations
                const simpleTypeClone = JSON.parse(JSON.stringify(simpleType));
                const originalSimpleTypeClone = JSON.parse(JSON.stringify(simpleType));
                
                setSimpleTypeData(simpleTypeClone);
                setOriginalSimpleType(originalSimpleTypeClone);
                
                console.log('ElementEditor: Set up editing for simple type:', simpleType.name);
                console.log('- Element:', selectedNode.name, 'Type:', selectedNode.type);
                console.log('- Found simple type definition:', simpleTypeClone);
            } else {
                setSimpleTypeData(null);
                setOriginalSimpleType(null);
                console.log('ElementEditor: No editable simple type found for element:', selectedNode.name, 'Type:', selectedNode.type);
            }
        } else {
            // Clear all data when no element is selected
            setElementData({});
            setSimpleTypeData(null);
            setOriginalSimpleType(null);
            console.log('ElementEditor: No element selected, clearing data');
        }
    }, [selectedNode, schema]);

    // Find simple type definition for an element
    const findSimpleTypeForElement = (element, schema) => {
        if (!element || !element.type || !schema || !schema.simpleTypes) {
            return null;
        }

        // Remove namespace prefix if present (e.g., "xs:string" -> "string")
        const typeName = element.type.includes(':') ? element.type.split(':').pop() : element.type;
        
        // Look for custom simple types (not built-in XSD types)
        const simpleType = schema.simpleTypes.find(st => st.name === typeName);
        
        // Only return custom simple types, not built-in ones like xs:string
        if (simpleType && !element.type.startsWith('xs:')) {
            return simpleType;
        }
        
        return null;
    };

    const handleElementChange = (field, value) => {
        setElementData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSimpleTypeChange = (updatedSimpleType) => {
        // CRITICAL: Ensure we're not mutating the original type
        // Create a deep clone to prevent any accidental mutations
        const updatedTypeClone = JSON.parse(JSON.stringify(updatedSimpleType));
        setSimpleTypeData(updatedTypeClone);
        
        console.log('SimpleType changed in ElementEditor:');
        console.log('- Original type (should be unchanged):', originalSimpleType?.name, originalSimpleType);
        console.log('- Updated type (local copy):', updatedTypeClone.name, updatedTypeClone);
    };

    const handleSaveElement = () => {
        if (onElementUpdate) {
            onElementUpdate(selectedNode, elementData);
        }
        console.log('Saving element:', elementData);
    };

    const handleSaveSimpleType = (mode = saveMode) => {
        console.log('handleSaveSimpleType called with mode:', mode);
        
        if (mode === 'update') {
            // Update the existing simple type
            if (onSimpleTypeUpdate && simpleTypeData) {
                console.log('Updating existing simple type:', simpleTypeData.name);
                onSimpleTypeUpdate(originalSimpleType, simpleTypeData);
            }
            setIsEditingSimpleType(false);
            setSaveMode('update'); // Ensure state is consistent
            console.log('Saving simple type updates:', simpleTypeData);
        } else if (mode === 'duplicate') {
            // Show dialog to create duplicate
            console.log('Preparing to create duplicate simple type');
            setSaveMode('duplicate'); // Set state for dialog handling
            generateNewTypeName();
            setShowDuplicateDialog(true);
            console.log('Duplicate dialog should now be shown');
        }
    };

    const generateNewTypeName = () => {
        console.log('generateNewTypeName called with:', {
            hasSimpleTypeData: !!simpleTypeData,
            simpleTypeName: simpleTypeData?.name,
            hasSchema: !!schema,
            hasSimpleTypes: !!(schema && schema.simpleTypes),
            simpleTypesCount: schema?.simpleTypes?.length
        });
        
        if (simpleTypeData && simpleTypeData.name && schema && schema.simpleTypes) {
            const baseName = simpleTypeData.name;
            let candidateName;
            
            // Smart naming based on common patterns
            if (baseName.includes('Text') || baseName.includes('String')) {
                // For text-based types, suggest incremental names
                const match = baseName.match(/(\D+)(\d+)(\D*)/);
                if (match) {
                    // Extract number and increment it (e.g., Max35Text -> Max70Text)
                    const prefix = match[1];
                    const number = parseInt(match[2]);
                    const suffix = match[3];
                    candidateName = `${prefix}${number * 2}${suffix}`;
                } else {
                    // If no number found, add a descriptive suffix
                    candidateName = `${baseName}Extended`;
                }
            } else if (baseName.includes('Amount') || baseName.includes('Rate')) {
                // For amount/rate types, suggest precision-based names
                candidateName = `${baseName}Enhanced`;
            } else {
                // Default pattern for other types
                candidateName = `${baseName}Modified`;
            }
            
            // Ensure uniqueness by adding counter if needed
            const existingNames = new Set(schema.simpleTypes.map(st => st.name));
            let counter = 1;
            let finalName = candidateName;
            
            console.log('Generating unique type name:');
            console.log('- Base name:', baseName);
            console.log('- Initial candidate:', candidateName);
            console.log('- Existing type names:', Array.from(existingNames));
            
            while (existingNames.has(finalName)) {
                counter++;
                finalName = `${candidateName}${counter}`;
                console.log('- Name taken, trying:', finalName);
            }
            
            console.log('- Final unique name:', finalName);
            setNewTypeName(finalName);
            return finalName;
        } else {
            console.warn('Cannot generate type name - missing data:', {
                hasSimpleTypeData: !!simpleTypeData,
                hasSchema: !!schema,
                hasSimpleTypes: !!(schema && schema.simpleTypes)
            });
            return null;
        }
    };

    const handleCreateDuplicate = () => {
        if (!newTypeName.trim() || !simpleTypeData || !originalSimpleType) {
            console.error('Cannot create duplicate - missing required data:', {
                hasNewTypeName: !!newTypeName.trim(),
                hasSimpleTypeData: !!simpleTypeData,
                hasOriginalSimpleType: !!originalSimpleType
            });
            return;
        }

        // CRITICAL: Create a completely new simple type that is independent of the original
        // We use a deep clone approach to ensure no references to the original type remain
        const newSimpleType = JSON.parse(JSON.stringify({
            ...simpleTypeData,      // Use the current edited data as the base
            name: newTypeName.trim() // Set the new name
        }));

        // Update the element to reference the new type
        const updatedElementData = {
            ...elementData,
            type: newTypeName.trim()
        };

        console.log('Creating duplicate simple type:');
        console.log('- Original type (WILL BE PRESERVED):', originalSimpleType.name, originalSimpleType);
        console.log('- Current edited data:', simpleTypeData);
        console.log('- New type name:', newTypeName.trim());
        console.log('- Final new type (independent copy):', newSimpleType);

        // Verify that the original type is not being modified
        console.log('- Original type before save:', JSON.stringify(originalSimpleType));

        // Call callbacks to update schema
        if (onSimpleTypeUpdate) {
            // Add the new simple type to schema (originalSimpleType = null means ADD, not UPDATE)
            console.log('- Calling onSimpleTypeUpdate with null (ADD mode)');
            onSimpleTypeUpdate(null, newSimpleType);
        } else {
            console.error('onSimpleTypeUpdate callback not available');
        }
        
        if (onElementUpdate) {
            // Update element to reference new type
            console.log('- Updating element to reference new type');
            onElementUpdate(selectedNode, updatedElementData);
        } else {
            console.error('onElementUpdate callback not available');
        }

        // Update local state - reset the edited data to point to the new type
        setElementData(updatedElementData);
        setSimpleTypeData({ ...newSimpleType }); // Point to the new type
        setOriginalSimpleType({ ...newSimpleType }); // The new type is now our "original" for this element
        setIsEditingSimpleType(false);
        setShowDuplicateDialog(false);
        setNewTypeName('');
        setSaveMode('update');
        
        console.log('✅ Duplicate creation completed successfully!');
        console.log('- Check the Simple Types section in the schema tree to see both types');
        console.log('- Original type:', originalSimpleType.name, 'should still exist');
        console.log('- New type:', newSimpleType.name, 'should now exist');
    };

    const handleCancelDuplicate = () => {
        setShowDuplicateDialog(false);
        setNewTypeName('');
        setSaveMode('update');
        
        // Reset to original simple type data to cancel any changes
        if (originalSimpleType) {
            setSimpleTypeData({ ...originalSimpleType });
        }
    };

    // Helper function to find all elements using a specific simple type
    const findElementsUsingType = (typeName, schema) => {
        const elementsUsingType = [];
        
        // Check root elements
        if (schema?.elements) {
            schema.elements.forEach(element => {
                if (element.type === typeName) {
                    elementsUsingType.push({ name: element.name, location: 'Root Element' });
                }
            });
        }
        
        // Check elements within complex types
        if (schema?.complexTypes) {
            schema.complexTypes.forEach(complexType => {
                if (complexType.children) {
                    complexType.children.forEach(child => {
                        if (child.nodeType === 'element' && child.type === typeName) {
                            elementsUsingType.push({ 
                                name: child.name, 
                                location: `Complex Type: ${complexType.name}` 
                            });
                        }
                    });
                }
            });
        }
        
        // Check attributes
        if (schema?.attributes) {
            schema.attributes.forEach(attribute => {
                if (attribute.type === typeName) {
                    elementsUsingType.push({ name: attribute.name, location: 'Attribute' });
                }
            });
        }
        
        return elementsUsingType;
    };

    const handleCancelSimpleType = () => {
        setSimpleTypeData({ ...originalSimpleType });
        setIsEditingSimpleType(false);
    };

    const isBuiltInType = (typeName) => {
        const builtInTypes = [
            'xs:string', 'xs:int', 'xs:integer', 'xs:decimal', 'xs:boolean', 
            'xs:date', 'xs:time', 'xs:dateTime', 'xs:duration', 'xs:anyURI',
            'xs:base64Binary', 'xs:hexBinary', 'xs:long', 'xs:short', 'xs:byte',
            'xs:double', 'xs:float', 'xs:unsignedInt', 'xs:unsignedLong'
        ];
        return builtInTypes.includes(typeName);
    };

    if (!selectedNode || selectedNode.nodeType !== 'element') {
        return (
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    No Element Selected
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Select an element from the schema tree to edit its properties
                </Typography>
            </Paper>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Element Properties Section */}
            <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Typography variant="h5">
                        Edit Element: {selectedNode.name}
                    </Typography>
                    <Chip 
                        label="element" 
                        color="primary"
                        variant="outlined"
                    />
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Element Name"
                            value={elementData.name}
                            onChange={(e) => handleElementChange('name', e.target.value)}
                            fullWidth
                            required
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Type"
                            value={elementData.type}
                            onChange={(e) => handleElementChange('type', e.target.value)}
                            fullWidth
                            placeholder="e.g., xs:string, MyComplexType"
                            helperText={simpleTypeData ? "This element uses a custom simple type (editable below)" : "Built-in or complex type"}
                        />
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <TextField
                            label="Min Occurs"
                            value={elementData.minOccurs}
                            onChange={(e) => handleElementChange('minOccurs', e.target.value)}
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <TextField
                            label="Max Occurs"
                            value={elementData.maxOccurs}
                            onChange={(e) => handleElementChange('maxOccurs', e.target.value)}
                            fullWidth
                            placeholder="unbounded for unlimited"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            label="Documentation"
                            value={elementData.documentation}
                            onChange={(e) => handleElementChange('documentation', e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Enter documentation for this element..."
                        />
                    </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleSaveElement}
                        size="large"
                    >
                        Save Element Changes
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="secondary"
                        size="large"
                    >
                        Cancel
                    </Button>
                </Box>
            </Paper>

            {/* Simple Type Editing Section */}
            {simpleTypeData && (
                <Paper elevation={2} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justify: 'space-between', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h5">
                                Simple Type: {simpleTypeData.name}
                            </Typography>
                            <Chip 
                                label="simple type" 
                                color="secondary"
                                variant="outlined"
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {!isEditingSimpleType ? (
                                <Button
                                    variant="outlined"
                                    startIcon={<Edit />}
                                    onClick={() => setIsEditingSimpleType(true)}
                                >
                                    Edit Type Restrictions
                                </Button>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Alert severity="warning" sx={{ mb: 1 }}>
                                        <strong>Choose your save option:</strong>
                                        <br/>• <strong>Update Type:</strong> Modifies "{simpleTypeData.name}" for ALL elements using this type
                                        <br/>• <strong>Save as New Type:</strong> Creates a new type for this element only
                                    </Alert>
                                    
                                    {/* Show elements using this type */}
                                    {simpleTypeData && (() => {
                                        const elementsUsingType = findElementsUsingType(simpleTypeData.name, schema);
                                        return elementsUsingType.length > 1 && (
                                            <Alert severity="info" sx={{ mb: 1 }}>
                                                <strong>Impact Analysis:</strong> The type "{simpleTypeData.name}" is currently used by {elementsUsingType.length} element(s):
                                                <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                                                    {elementsUsingType.map((element, index) => (
                                                        <li key={index}>
                                                            <strong>{element.name}</strong> ({element.location})
                                                        </li>
                                                    ))}
                                                </Box>
                                                {elementsUsingType.length > 1 && (
                                                    <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                                        "Update Type" will affect all these elements. "Save as New Type" will only affect "{elementData.name}".
                                                    </Typography>
                                                )}
                                            </Alert>
                                        );
                                    })()}
                                    
                                    <ButtonGroup variant="contained" aria-label="save options" sx={{ alignSelf: 'flex-end' }}>
                                        <Button
                                            color="primary"
                                            startIcon={<Save />}
                                            onClick={() => {
                                                console.log('Update Type button clicked');
                                                handleSaveSimpleType('update');
                                            }}
                                            title={`Update the existing "${simpleTypeData.name}" type. This will affect ALL elements using this type.`}
                                        >
                                            Update Type
                                        </Button>
                                        <Button
                                            color="secondary"
                                            variant="contained"
                                            startIcon={<ContentCopy />}
                                            onClick={() => {
                                                console.log('Save as New Type button clicked');
                                                handleSaveSimpleType('duplicate');
                                            }}
                                            title="Create a new simple type with your modifications. Only this element will use the new type."
                                        >
                                            Save as New Type
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={handleCancelSimpleType}
                                            title="Cancel editing and revert all changes"
                                        >
                                            Cancel
                                        </Button>
                                    </ButtonGroup>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {!isEditingSimpleType ? (
                        // Simple Type Summary View
                        <Box>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                This element uses the simple type "{simpleTypeData.name}" which defines restrictions on the data.
                                Click "Edit Type Restrictions" to modify the validation rules.
                            </Alert>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>Base Type:</Typography>
                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        {simpleTypeData.base || 'Not specified'}
                                    </Typography>
                                </Grid>
                                
                                {simpleTypeData.restrictions && (
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" gutterBottom>Applied Restrictions:</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {simpleTypeData.restrictions.enumerations && simpleTypeData.restrictions.enumerations.length > 0 && (
                                                <Chip size="small" label={`${simpleTypeData.restrictions.enumerations.length} enumerations`} />
                                            )}
                                            {simpleTypeData.restrictions.pattern && (
                                                <Chip size="small" label="Pattern constraint" color="secondary" />
                                            )}
                                            {(simpleTypeData.restrictions.minLength !== undefined || 
                                              simpleTypeData.restrictions.maxLength !== undefined || 
                                              simpleTypeData.restrictions.length !== undefined) && (
                                                <Chip size="small" label="Length constraint" color="info" />
                                            )}
                                            {(simpleTypeData.restrictions.fractionDigits !== undefined || 
                                              simpleTypeData.restrictions.totalDigits !== undefined) && (
                                                <Chip size="small" label="Numeric precision" color="warning" />
                                            )}
                                            {(simpleTypeData.restrictions.minInclusive !== undefined || 
                                              simpleTypeData.restrictions.maxInclusive !== undefined ||
                                              simpleTypeData.restrictions.minExclusive !== undefined || 
                                              simpleTypeData.restrictions.maxExclusive !== undefined) && (
                                                <Chip size="small" label="Value range" color="success" />
                                            )}
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    ) : (
                        // Full Simple Type Editor
                        <SimpleTypeEditor 
                            simpleType={simpleTypeData}
                            onChange={handleSimpleTypeChange}
                            disableNameEdit={true}
                        />
                    )}
                </Paper>
            )}

            {/* Duplicate Simple Type Dialog */}
            <Dialog open={showDuplicateDialog} onClose={handleCancelDuplicate} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ContentCopy color="primary" />
                        Create New Simple Type
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <strong>Creating a New Simple Type:</strong><br/>
                        You are creating a copy of "<strong>{simpleTypeData?.name}</strong>" with your modifications. 
                        The original type will remain unchanged and can still be used by other elements.
                    </Alert>
                    
                    <Alert severity="success" sx={{ mb: 3 }}>
                        <strong>Original Type Preserved:</strong><br/>
                        The original "<strong>{simpleTypeData?.name}</strong>" will remain in the schema and 
                        will not be removed or modified.
                    </Alert>
                    
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            <strong>Suggested Name:</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Based on the original type "{simpleTypeData?.name}", we suggest:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {newTypeName || 'Generating...'}
                        </Typography>
                    </Box>
                    
                    <TextField
                        autoFocus
                        margin="dense"
                        label="New Simple Type Name"
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                        helperText={newTypeName.trim() && schema?.simpleTypes?.some(st => st.name === newTypeName.trim()) 
                            ? "⚠️ This name already exists. Please choose a different name." 
                            : "✅ Enter a unique name for the new simple type"
                        }
                        error={!newTypeName.trim() || (schema?.simpleTypes?.some(st => st.name === newTypeName.trim()))}
                    />
                    
                    {newTypeName.trim() && schema?.simpleTypes?.some(st => st.name === newTypeName.trim()) && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            <strong>Name Conflict:</strong> A simple type named "{newTypeName.trim()}" already exists. 
                            Please choose a different name.
                        </Alert>
                    )}
                    
                    <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, color: 'primary.contrastText' }}>
                        <Typography variant="subtitle2" gutterBottom>
                            <strong>What will happen:</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            1. Create new simple type: "<strong>{newTypeName.trim() || 'NewTypeName'}</strong>"
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            2. Update element "<strong>{elementData.name}</strong>" to use the new type
                        </Typography>
                        <Typography variant="body2">
                            3. Keep original type "<strong>{simpleTypeData?.name}</strong>" unchanged
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 2 }}>
                    <Button onClick={handleCancelDuplicate} size="large">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleCreateDuplicate} 
                        variant="contained" 
                        size="large"
                        color="primary"
                        startIcon={<ContentCopy />}
                        disabled={!newTypeName.trim() || (schema?.simpleTypes?.some(st => st.name === newTypeName.trim()))}
                        sx={{ minWidth: 180 }}
                    >
                        Create "{newTypeName.trim() || 'New Type'}"
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Info about built-in types */}
            {!simpleTypeData && elementData.type && isBuiltInType(elementData.type) && (
                <Alert severity="info">
                    This element uses the built-in XSD type "{elementData.type}". 
                    Built-in types cannot be modified, but you can create a custom simple type 
                    with restrictions and change the element's type to reference it.
                </Alert>
            )}
        </Box>
    );
};

export default ElementEditor;