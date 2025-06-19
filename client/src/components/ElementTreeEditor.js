import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Alert,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Collapse,
  IconButton,
  Button
} from '@mui/material';
import { 
  Schema,
  KeyboardArrowDown,
  KeyboardArrowRight,
  Circle,
  Save,
  Undo,
  Edit,
  Refresh,
  Download,
  Code
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { generateXSD } from '../services/api';
import SimpleTypeEditor from './SimpleTypeEditor';
import ElementEditor from './ElementEditor';

const ElementTreeEditor = ({ schema, onSchemaUpdate }) => {
    const [selectedElement, setSelectedElement] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [editingElement, setEditingElement] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [workingSchema, setWorkingSchema] = useState(null);    // Initialize working schema
    useEffect(() => {
        if (schema) {
            console.log('ElementTreeEditor: Initializing working schema from prop');
            console.log('- Schema simpleTypes count:', schema?.simpleTypes?.length);
            setWorkingSchema(JSON.parse(JSON.stringify(schema))); // Deep clone
        }
    }, [schema]);// Build element hierarchy from working schema
    const elementHierarchy = useMemo(() => {
        if (!workingSchema) {
            console.log('ElementTreeEditor: No working schema available');
            return [];
        }

        console.log('ElementTreeEditor: Building hierarchy from working schema:', workingSchema);

        const buildElementTree = () => {
            const allNodes = [];
            const complexTypeMap = new Map();
            
            // Create a map of complex types for quick lookup
            if (workingSchema.complexTypes) {
                console.log('ElementTreeEditor: Found', workingSchema.complexTypes.length, 'complex types');
                workingSchema.complexTypes.forEach(type => {
                    complexTypeMap.set(type.name, type);
                });
            }            // Add simple types as top-level nodes
            if (workingSchema.simpleTypes) {
                console.log('ElementTreeEditor: Found', workingSchema.simpleTypes.length, 'simple types');
                console.log('ElementTreeEditor: Simple types names:', workingSchema.simpleTypes.map(st => st.name));
                workingSchema.simpleTypes.forEach((simpleType, index) => {
                    const treeNode = {
                        id: `simpleType-${simpleType.name}-${index}`,
                        name: simpleType.name,
                        type: simpleType.base || 'xs:string',
                        nodeType: 'simpleType',
                        level: 0,
                        isRoot: true,
                        children: [],
                        elementIndex: index,
                        parentPath: 'simpleTypes',
                        restrictions: simpleType.restrictions || {},
                        documentation: simpleType.documentation
                    };
                    allNodes.push(treeNode);
                    console.log('ElementTreeEditor: Added simple type node:', treeNode.name, 'with id:', treeNode.id);
                });
            }

            // Process root elements
            if (workingSchema.elements) {
                console.log('ElementTreeEditor: Found', workingSchema.elements.length, 'root elements');
                workingSchema.elements.forEach((element, index) => {
                    const treeNode = {
                        id: `root-${element.name}-${index}`,
                        name: element.name,
                        type: element.type,
                        minOccurs: element.minOccurs || '1',
                        maxOccurs: element.maxOccurs || '1',
                        documentation: element.documentation,
                        nodeType: 'element',
                        level: 0,
                        isRoot: true,
                        children: [],
                        elementIndex: index,
                        parentPath: 'root'
                    };

                    // If element has a complex type, build its children
                    if (element.type && complexTypeMap.has(element.type)) {
                        const complexType = complexTypeMap.get(element.type);
                        console.log('ElementTreeEditor: Building children for element', element.name, 'with type', element.type);
                        treeNode.children = buildChildElements(complexType, 1, `${treeNode.id}-`, complexTypeMap, `root.${index}`);
                    }

                    allNodes.push(treeNode);
                });
            } else {
                console.log('ElementTreeEditor: No root elements found in schema');
            }

            console.log('ElementTreeEditor: Built hierarchy with', allNodes.length, 'total nodes');
            return allNodes;
        };

        const buildChildElements = (complexType, level, parentId, complexTypeMap, parentPath) => {
            const children = [];

            if (complexType.children) {
                complexType.children.forEach((child, index) => {
                    const childNode = {
                        id: `${parentId}${child.name}-${index}`,
                        name: child.name,
                        type: child.type,
                        minOccurs: child.minOccurs || '1',
                        maxOccurs: child.maxOccurs || '1',
                        documentation: child.documentation,
                        nodeType: 'element',
                        level: level,
                        isRoot: false,
                        children: [],
                        elementIndex: index,
                        parentPath: parentPath,
                        parentTypeName: complexType.name
                    };

                    // If child has a complex type, recursively build its children
                    if (child.type && complexTypeMap.has(child.type)) {
                        const childComplexType = complexTypeMap.get(child.type);
                        childNode.children = buildChildElements(
                            childComplexType, 
                            level + 1, 
                            `${childNode.id}-`, 
                            complexTypeMap,
                            `${parentPath}.children.${index}`
                        );
                    }

                    children.push(childNode);
                });
            }

            return children;
        };

        return buildElementTree();
    }, [workingSchema]);    const handleElementClick = useCallback((element) => {
        console.log('ElementTreeEditor: Element clicked:', element);
        
        // Always clear the previous editing element first to force a reset
        setEditingElement(null);
        setSelectedElement(element);
        
        // Use a timeout to ensure state is properly reset before setting new element
        setTimeout(() => {
            // Create a copy of the element for editing
            const editingData = {
                ...element,
                originalName: element.name,
                originalType: element.type,
                originalMinOccurs: element.minOccurs,
                originalMaxOccurs: element.maxOccurs,
                originalDocumentation: element.documentation
            };

            // For simple types, include restrictions
            if (element.nodeType === 'simpleType') {
                editingData.restrictions = element.restrictions || {};
                editingData.originalRestrictions = JSON.parse(JSON.stringify(element.restrictions || {}));
            }

            setEditingElement(editingData);
        }, 0);
    }, []);

    const handleToggleExpand = useCallback((nodeId) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }        setExpandedNodes(newExpanded);
    }, [expandedNodes]);const applyChangesToSchema = useCallback(() => {
        if (!editingElement || !workingSchema) return;

        const newSchema = JSON.parse(JSON.stringify(workingSchema));
        
        // Function to update element in schema
        const updateElementInSchema = (element, pathParts) => {
            if (element.nodeType === 'simpleType') {
                // Update simple type
                const simpleTypeIndex = element.elementIndex;
                if (newSchema.simpleTypes && newSchema.simpleTypes[simpleTypeIndex]) {
                    newSchema.simpleTypes[simpleTypeIndex] = {
                        ...newSchema.simpleTypes[simpleTypeIndex],
                        name: editingElement.name,
                        base: editingElement.type,
                        documentation: editingElement.documentation,
                        restrictions: editingElement.restrictions || {}
                    };
                }
            } else if (element.isRoot) {
                // Update root element
                const rootIndex = element.elementIndex;
                if (newSchema.elements && newSchema.elements[rootIndex]) {
                    newSchema.elements[rootIndex] = {
                        ...newSchema.elements[rootIndex],
                        name: editingElement.name,
                        type: editingElement.type,
                        minOccurs: editingElement.minOccurs,
                        maxOccurs: editingElement.maxOccurs,
                        documentation: editingElement.documentation
                    };
                }
            } else {
                // Update child element within complex type
                const parentTypeName = element.parentTypeName;
                const complexType = newSchema.complexTypes?.find(ct => ct.name === parentTypeName);
                
                if (complexType && complexType.children && complexType.children[element.elementIndex]) {
                    complexType.children[element.elementIndex] = {
                        ...complexType.children[element.elementIndex],
                        name: editingElement.name,
                        type: editingElement.type,
                        minOccurs: editingElement.minOccurs,
                        maxOccurs: editingElement.maxOccurs,
                        documentation: editingElement.documentation
                    };
                }
            }
        };

        updateElementInSchema(editingElement);
        
        setWorkingSchema(newSchema);
        setHasChanges(false);
        
        // Update the selected element to reflect changes
        const updatedSelectedElement = {
            ...selectedElement,
            name: editingElement.name,
            type: editingElement.type,
            minOccurs: editingElement.minOccurs,
            maxOccurs: editingElement.maxOccurs,
            documentation: editingElement.documentation
        };

        if (editingElement.nodeType === 'simpleType') {
            updatedSelectedElement.restrictions = editingElement.restrictions;
        }        setSelectedElement(updatedSelectedElement);

        console.log('ElementTreeEditor: Applied changes to schema');
    }, [editingElement, workingSchema, selectedElement]);

    // New callback functions for ElementEditor
    const handleElementUpdate = useCallback((elementNode, updatedElementData) => {
        if (!workingSchema || !elementNode) return;

        const newSchema = JSON.parse(JSON.stringify(workingSchema));
        
        if (elementNode.isRoot && elementNode.nodeType === 'element') {
            // Update root element
            const rootIndex = elementNode.elementIndex;
            if (newSchema.elements && newSchema.elements[rootIndex]) {
                newSchema.elements[rootIndex] = {
                    ...newSchema.elements[rootIndex],
                    name: updatedElementData.name,
                    type: updatedElementData.type,
                    minOccurs: updatedElementData.minOccurs,
                    maxOccurs: updatedElementData.maxOccurs,
                    documentation: updatedElementData.documentation
                };
            }
        } else if (!elementNode.isRoot && elementNode.nodeType === 'element') {
            // Update child element within complex type
            const parentTypeName = elementNode.parentTypeName;
            const complexType = newSchema.complexTypes?.find(ct => ct.name === parentTypeName);
            
            if (complexType && complexType.children && complexType.children[elementNode.elementIndex]) {
                complexType.children[elementNode.elementIndex] = {
                    ...complexType.children[elementNode.elementIndex],
                    name: updatedElementData.name,
                    type: updatedElementData.type,
                    minOccurs: updatedElementData.minOccurs,
                    maxOccurs: updatedElementData.maxOccurs,
                    documentation: updatedElementData.documentation
                };
            }
        }

        setWorkingSchema(newSchema);
        setHasChanges(true);
        
        // Update the selected element to reflect changes
        const updatedElement = {
            ...elementNode,
            name: updatedElementData.name,
            type: updatedElementData.type,
            minOccurs: updatedElementData.minOccurs,
            maxOccurs: updatedElementData.maxOccurs,
            documentation: updatedElementData.documentation
        };
        setSelectedElement(updatedElement);
        
        console.log('ElementTreeEditor: Element updated:', updatedElementData);
    }, [workingSchema]);    const handleSimpleTypeUpdate = useCallback((originalSimpleType, updatedSimpleType) => {
        if (!workingSchema || !updatedSimpleType) return;

        const newSchema = JSON.parse(JSON.stringify(workingSchema));
        
        if (originalSimpleType === null) {
            // ADD NEW SIMPLE TYPE
            console.log('ElementTreeEditor: Adding new simple type:', updatedSimpleType.name);
            if (!newSchema.simpleTypes) {
                newSchema.simpleTypes = [];
            }
            newSchema.simpleTypes.push(updatedSimpleType);
        } else {
            // UPDATE EXISTING SIMPLE TYPE
            console.log('ElementTreeEditor: Updating existing simple type:', updatedSimpleType.name);
            if (newSchema.simpleTypes) {
                const simpleTypeIndex = newSchema.simpleTypes.findIndex(st => st.name === originalSimpleType.name);
                if (simpleTypeIndex !== -1) {
                    newSchema.simpleTypes[simpleTypeIndex] = {
                        ...updatedSimpleType
                    };
                }
            }
        }        setWorkingSchema(newSchema);
        setHasChanges(true);
        
        console.log('ElementTreeEditor: Simple type operation completed:', updatedSimpleType);
        console.log('ElementTreeEditor: New schema simpleTypes count:', newSchema.simpleTypes?.length);
        console.log('ElementTreeEditor: New schema simpleTypes names:', newSchema.simpleTypes?.map(st => st.name));
        
        // CRITICAL: Update the parent component immediately to prevent loss of changes
        if (onSchemaUpdate) {
            console.log('ElementTreeEditor: Updating parent component with new schema');
            onSchemaUpdate(newSchema);
        }
    }, [workingSchema, onSchemaUpdate]);const downloadXSD = useCallback(async () => {
        if (!workingSchema) return;

        try {
            const xsdBlob = await generateXSD(workingSchema, 'schema.xsd');
            const url = window.URL.createObjectURL(xsdBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'schema.xsd';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            console.log('ElementTreeEditor: XSD file downloaded');
        } catch (error) {
            console.error('Error downloading XSD:', error);
        }
    }, [workingSchema]);

    const saveChangesToParent = useCallback(async () => {
        if (onSchemaUpdate && workingSchema) {
            onSchemaUpdate(workingSchema);
            console.log('ElementTreeEditor: Saved changes to parent component');

            // Also try to generate and download the updated XSD
            try {
                const xsdBlob = await generateXSD(workingSchema, 'updated_schema.xsd');
                const url = window.URL.createObjectURL(xsdBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'updated_schema.xsd';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                console.log('ElementTreeEditor: XSD file generated and downloaded');
            } catch (error) {
                console.error('Error generating XSD:', error);
                // Continue with just the schema update even if XSD generation fails
            }
        }
    }, [workingSchema, onSchemaUpdate]);

    const resetChanges = useCallback(() => {
        if (editingElement) {
            setEditingElement(prev => ({
                ...prev,
                name: prev.originalName,
                type: prev.originalType,
                minOccurs: prev.originalMinOccurs,
                maxOccurs: prev.originalMaxOccurs,
                documentation: prev.originalDocumentation
            }));
            setHasChanges(false);
        }
    }, [editingElement]);

    const renderElementNode = useCallback((element, depth = 0) => {
        const hasChildren = element.children && element.children.length > 0;
        const isExpanded = expandedNodes.has(element.id);
        const isSelected = selectedElement?.id === element.id;

        return (
            <Box key={element.id}>
                <ListItem 
                    disablePadding 
                    sx={{ 
                        pl: depth * 2,
                        borderLeft: depth > 0 ? '2px solid #e0e0e0' : 'none',
                        ml: depth > 0 ? 1 : 0
                    }}
                >
                    <ListItemButton
                        selected={isSelected}
                        onClick={() => handleElementClick(element)}
                        sx={{ 
                            borderRadius: 1,
                            py: 0.5,
                            '&.Mui-selected': {
                                backgroundColor: 'primary.light',
                                color: 'primary.contrastText'
                            }
                        }}
                    >
                        {hasChildren && (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleExpand(element.id);
                                }}
                                sx={{ mr: 1, p: 0.5 }}
                            >
                                {isExpanded ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                            </IconButton>
                        )}
                        
                        {!hasChildren && (
                            <Box sx={{ width: 32, display: 'flex', justifyContent: 'center' }}>
                                <Circle sx={{ fontSize: 8, color: 'text.disabled' }} />
                            </Box>
                        )}                        <ListItemIcon sx={{ minWidth: 40 }}>
                            {element.nodeType === 'simpleType' ? (
                                <Code 
                                    color={element.isRoot ? 'primary' : 'secondary'} 
                                    sx={{ fontSize: element.isRoot ? 24 : 20 }}
                                />
                            ) : (
                                <Schema 
                                    color={element.isRoot ? 'primary' : 'success'} 
                                    sx={{ fontSize: element.isRoot ? 24 : 20 }}
                                />
                            )}
                        </ListItemIcon>
                        
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography 
                                        variant="body2" 
                                        fontWeight={element.isRoot ? 'bold' : 'normal'}
                                        color={isSelected ? 'inherit' : 'text.primary'}
                                    >
                                        {element.name}
                                    </Typography>                                    {element.isRoot && (
                                        <Chip 
                                            label={element.nodeType === 'simpleType' ? 'SIMPLE TYPE' : 'ROOT'} 
                                            size="small" 
                                            color={element.nodeType === 'simpleType' ? 'secondary' : 'primary'} 
                                            variant="outlined" 
                                        />
                                    )}
                                    {hasChildren && (
                                        <Chip 
                                            label={`${element.children.length} children`} 
                                            size="small" 
                                            color="secondary" 
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                            }
                            secondary={
                                <Box>
                                    <Typography 
                                        variant="caption" 
                                        color={isSelected ? 'inherit' : 'text.secondary'}
                                        sx={{ opacity: isSelected ? 0.8 : 1 }}
                                    >
                                        Type: {element.type || 'undefined'}
                                    </Typography>
                                    {(element.minOccurs !== '1' || element.maxOccurs !== '1') && (
                                        <Typography 
                                            variant="caption" 
                                            color={isSelected ? 'inherit' : 'text.secondary'}
                                            sx={{ display: 'block', opacity: isSelected ? 0.8 : 1 }}
                                        >
                                            Occurs: {element.minOccurs}..{element.maxOccurs}
                                        </Typography>
                                    )}
                                </Box>
                            }
                        />
                    </ListItemButton>
                </ListItem>

                {/* Render children */}
                {hasChildren && (
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {element.children.map(child => renderElementNode(child, depth + 1))}
                        </List>
                    </Collapse>
                )}
            </Box>
        );    }, [expandedNodes, selectedElement, handleElementClick, handleToggleExpand]);

    if (!workingSchema) {
        return (
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    No schema loaded
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Upload an XSD file to view and edit the element hierarchy
                </Typography>
            </Paper>
        );
    }

    if (!elementHierarchy || elementHierarchy.length === 0) {
        return (
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                <Alert severity="info">
                    No root elements found in the schema.
                </Alert>
            </Paper>
        );
    }

    return (
        <Box>
            <Grid container spacing={3}>
                {/* Left Panel - Elements Tree */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2}>                        <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
                            <Typography variant="h6">
                                Schema Structure
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                {elementHierarchy.length} items • Elements and Simple Types • Click to select and edit
                            </Typography>
                        </Box>
                        
                        <Divider />

                        <List dense sx={{ maxHeight: 600, overflow: 'auto' }}>
                            {elementHierarchy.map(element => renderElementNode(element, 0))}
                        </List>
                    </Paper>
                </Grid>

                {/* Right Panel - Element Editor */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2}>                        <Box sx={{ p: 2, backgroundColor: 'secondary.main', color: 'secondary.contrastText' }}>
                            <Typography variant="h6">
                                {selectedElement?.nodeType === 'simpleType' ? 'Simple Type Editor' : 'Element Editor'}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                {selectedElement ? 
                                    `Editing: ${selectedElement.name} (${selectedElement.nodeType === 'simpleType' ? 'Simple Type' : 'Element'})` : 
                                    'Select an element or simple type to edit'
                                }
                            </Typography>
                        </Box>
                        
                        <Divider />                        <Box sx={{ p: 3 }}>
                            {selectedElement ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>                                    {selectedElement.nodeType === 'simpleType' ? (
                                        // Use the existing SimpleTypeEditor for standalone simple types
                                        editingElement && (
                                            <SimpleTypeEditor
                                                key={selectedElement.id} // Force re-render when element changes
                                                simpleType={editingElement}
                                                onChange={(updatedType) => {
                                                    setEditingElement(updatedType);
                                                    setHasChanges(true);
                                                }}
                                            />
                                        )
                                    ) : (
                                        // Use the new combined ElementEditor for elements
                                        <ElementEditor
                                            schema={workingSchema}
                                            selectedNode={selectedElement}
                                            onElementUpdate={handleElementUpdate}
                                            onSimpleTypeUpdate={handleSimpleTypeUpdate}
                                        />
                                    )}

                                    {/* Action Buttons - only show for simple types since ElementEditor has its own buttons */}
                                    {selectedElement.nodeType === 'simpleType' && (
                                        <>
                                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2, flexWrap: 'wrap' }}>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<Undo />}
                                                    onClick={resetChanges}
                                                    disabled={!hasChanges}
                                                >
                                                    Reset Changes
                                                </Button>
                                                
                                                <Button
                                                    variant="contained"
                                                    startIcon={<Refresh />}
                                                    onClick={applyChangesToSchema}
                                                    disabled={!hasChanges}
                                                    color="primary"
                                                >
                                                    Apply Changes
                                                </Button>
                                                
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<Download />}
                                                    onClick={downloadXSD}
                                                    color="info"
                                                >
                                                    Download XSD
                                                </Button>
                                                
                                                <Button
                                                    variant="contained"
                                                    startIcon={<Save />}
                                                    onClick={saveChangesToParent}
                                                    color="success"
                                                >
                                                    Save Schema
                                                </Button>
                                            </Box>

                                            {/* Changes Indicator */}
                                            {hasChanges && (
                                                <Alert severity="warning" sx={{ mt: 2 }}>
                                                    <Typography variant="body2">
                                                        You have unsaved changes. Click "Apply Changes" to update the element in the tree, 
                                                        then "Save Schema" to persist changes.
                                                    </Typography>
                                                </Alert>
                                            )}
                                        </>
                                    )}

                                    {/* Action Buttons for all other cases */}
                                    {selectedElement.nodeType !== 'simpleType' && (
                                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2, flexWrap: 'wrap' }}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<Download />}
                                                onClick={downloadXSD}
                                                color="info"
                                            >
                                                Download XSD
                                            </Button>
                                            
                                            <Button
                                                variant="contained"
                                                startIcon={<Save />}
                                                onClick={saveChangesToParent}
                                                color="success"
                                            >
                                                Save Schema
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Edit sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary">
                                        Select an Element to Edit
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Choose an element from the tree on the left to modify its properties
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

ElementTreeEditor.propTypes = {
    schema: PropTypes.object,
    onSchemaUpdate: PropTypes.func,
};

export default ElementTreeEditor;
