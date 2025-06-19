import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Collapse,
  IconButton
} from '@mui/material';
import { 
  ExpandMore,
  Schema,
  Category,
  KeyboardArrowDown,
  KeyboardArrowRight,
  Circle
} from '@mui/icons-material';
import PropTypes from 'prop-types';

const ElementsTree = ({ schema, onNodeSelect }) => {
    const [selectedElement, setSelectedElement] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState(new Set());    // Build element hierarchy from schema
    const elementHierarchy = useMemo(() => {
        if (!schema) {
            console.log('ElementsTree: No schema provided');
            return [];
        }

        console.log('ElementsTree: Building hierarchy from schema:', schema);

        const buildElementTree = () => {
            const rootElements = [];
            const complexTypeMap = new Map();
            
            // Create a map of complex types for quick lookup
            if (schema.complexTypes) {
                console.log('ElementsTree: Found', schema.complexTypes.length, 'complex types');
                schema.complexTypes.forEach(type => {
                    complexTypeMap.set(type.name, type);
                });
            }

            // Process root elements
            if (schema.elements) {
                console.log('ElementsTree: Found', schema.elements.length, 'root elements');
                schema.elements.forEach(element => {
                    const treeNode = {
                        id: `root-${element.name}`,
                        name: element.name,
                        type: element.type,
                        minOccurs: element.minOccurs,
                        maxOccurs: element.maxOccurs,
                        documentation: element.documentation,
                        nodeType: 'element',
                        level: 0,
                        isRoot: true,
                        children: []
                    };

                    // If element has a complex type, build its children
                    if (element.type && complexTypeMap.has(element.type)) {
                        const complexType = complexTypeMap.get(element.type);
                        console.log('ElementsTree: Building children for element', element.name, 'with type', element.type);
                        treeNode.children = buildChildElements(complexType, 1, `${treeNode.id}-`, complexTypeMap);
                    }

                    rootElements.push(treeNode);
                });
            } else {
                console.log('ElementsTree: No root elements found in schema');
            }

            console.log('ElementsTree: Built hierarchy with', rootElements.length, 'root elements');
            return rootElements;
        };

        const buildChildElements = (complexType, level, parentId, complexTypeMap) => {
            const children = [];

            if (complexType.children) {
                complexType.children.forEach((child, index) => {
                    const childNode = {
                        id: `${parentId}${child.name}-${index}`,
                        name: child.name,
                        type: child.type,
                        minOccurs: child.minOccurs,
                        maxOccurs: child.maxOccurs,
                        documentation: child.documentation,
                        nodeType: 'element',
                        level: level,
                        isRoot: false,
                        children: []
                    };

                    // If child has a complex type, recursively build its children
                    if (child.type && complexTypeMap.has(child.type)) {
                        const childComplexType = complexTypeMap.get(child.type);
                        childNode.children = buildChildElements(
                            childComplexType, 
                            level + 1, 
                            `${childNode.id}-`, 
                            complexTypeMap
                        );
                    }

                    children.push(childNode);
                });
            }

            return children;
        };

        return buildElementTree();
    }, [schema]);    const handleElementClick = (element) => {
        console.log('ElementsTree: Element clicked:', element);
        setSelectedElement(element);
        if (onNodeSelect) {
            onNodeSelect(element);
        }
    };

    const handleToggleExpand = (nodeId) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    const renderElementNode = (element, depth = 0) => {
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
                        )}

                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <Schema 
                                color={element.isRoot ? 'primary' : 'success'} 
                                sx={{ fontSize: element.isRoot ? 24 : 20 }}
                            />
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
                                    </Typography>
                                    {element.isRoot && (
                                        <Chip label="ROOT" size="small" color="primary" variant="outlined" />
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
                                    {element.documentation && (
                                        <Typography 
                                            variant="caption" 
                                            color={isSelected ? 'inherit' : 'text.secondary'}
                                            sx={{ 
                                                display: 'block', 
                                                fontStyle: 'italic',
                                                opacity: isSelected ? 0.8 : 1,
                                                maxWidth: 300,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {element.documentation}
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
        );
    };

    if (!schema) {
        return (
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    No schema loaded
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Upload an XSD file to view the element hierarchy
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
            <Paper elevation={2}>
                <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
                    <Typography variant="h6">
                        Element Hierarchy
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {elementHierarchy.length} root element(s) • Click to expand/collapse • Select to edit
                    </Typography>
                </Box>
                
                <Divider />

                <List dense sx={{ maxHeight: 600, overflow: 'auto' }}>
                    {elementHierarchy.map(element => renderElementNode(element, 0))}
                </List>

                {selectedElement && (
                    <Box sx={{ p: 2, backgroundColor: 'grey.50', borderTop: '1px solid #e0e0e0' }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Selected: {selectedElement.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip 
                                label={selectedElement.isRoot ? 'Root Element' : 'Child Element'} 
                                size="small" 
                                color={selectedElement.isRoot ? 'primary' : 'secondary'}
                            />
                            <Chip 
                                label={`Type: ${selectedElement.type || 'undefined'}`} 
                                size="small" 
                                variant="outlined"
                            />
                            <Chip 
                                label={`Level: ${selectedElement.level}`} 
                                size="small" 
                                variant="outlined"
                            />
                            {selectedElement.children && selectedElement.children.length > 0 && (
                                <Chip 
                                    label={`${selectedElement.children.length} children`} 
                                    size="small" 
                                    color="info"
                                />
                            )}
                        </Box>
                        {selectedElement.documentation && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {selectedElement.documentation}
                            </Typography>
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

ElementsTree.propTypes = {
    schema: PropTypes.object,
    onNodeSelect: PropTypes.func,
};

export default ElementsTree;
