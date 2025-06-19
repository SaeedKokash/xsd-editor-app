import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  ExpandMore,
  Schema,
  Category,
  DataObject,
  Attribution
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import SearchBar from './SearchBar';

const SchemaTree = ({ schema, onNodeSelect }) => {
    const [selectedNode, setSelectedNode] = useState(null);

    const handleNodeClick = (node, type) => {
        const nodeData = { ...node, nodeType: type };
        setSelectedNode(nodeData);
        if (onNodeSelect) {
            onNodeSelect(nodeData);
        }
    };

    const handleSearchNodeSelect = (node) => {
        setSelectedNode(node);
        if (onNodeSelect) {
            onNodeSelect(node);
        }
    };

    const handleSearchResults = (results) => {
        // Search functionality can be implemented here if needed
        console.log('Search results:', results);
    };

    if (!schema) {
        return (
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    No schema loaded
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Upload an XSD file to view its structure
                </Typography>
            </Paper>
        );
    }

    const renderSchemaInfo = () => (
        <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
                Schema Information
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {schema.targetNamespace && (
                    <Chip 
                        label={`Namespace: ${schema.targetNamespace}`} 
                        size="small" 
                        color="primary"
                    />
                )}
                <Chip 
                    label={`Element Form: ${schema.elementFormDefault || 'unqualified'}`} 
                    size="small" 
                    variant="outlined"
                />
                <Chip 
                    label={`Attribute Form: ${schema.attributeFormDefault || 'unqualified'}`} 
                    size="small" 
                    variant="outlined"
                />
            </Box>
        </Paper>
    );

    const renderNodeList = (items, type, icon) => {
        if (!items || items.length === 0) return null;

        return (
            <List dense>
                {items.map((item, index) => (
                    <ListItem key={`${type}-${index}`} disablePadding>
                        <ListItemButton
                            selected={selectedNode?.name === item.name && selectedNode?.nodeType === type}
                            onClick={() => handleNodeClick(item, type)}
                            sx={{ 
                                borderRadius: 1,
                                '&.Mui-selected': {
                                    backgroundColor: 'primary.light',
                                    color: 'primary.contrastText'
                                }
                            }}
                        >
                            <ListItemIcon>
                                {icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.name || `Unnamed ${type}`}
                                secondary={item.documentation || item.type || ''}
                                secondaryTypographyProps={{
                                    sx: { 
                                        fontSize: '0.75rem',
                                        color: selectedNode?.name === item.name ? 'inherit' : 'text.secondary'
                                    }
                                }}
                            />
                            {item.children && item.children.length > 0 && (
                                <Chip 
                                    label={item.children.length} 
                                    size="small" 
                                    color="secondary"
                                    sx={{ ml: 1 }}
                                />
                            )}
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        );
    };

    return (
        <Box>
            {renderSchemaInfo()}
            
            {/* Search Bar */}
            <SearchBar 
                schema={schema}
                onNodeSelect={handleSearchNodeSelect}
                onSearchResults={handleSearchResults}
            />
            
            <Paper elevation={2}>
                <Typography variant="h6" sx={{ p: 2 }}>
                    Schema Components
                </Typography>
                <Divider />

                {/* Complex Types */}
                {schema.complexTypes && schema.complexTypes.length > 0 && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Category color="primary" />
                                <Typography variant="subtitle1">
                                    Complex Types ({schema.complexTypes.length})
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            {renderNodeList(
                                schema.complexTypes, 
                                'complexType', 
                                <Category color="primary" />
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Simple Types */}
                {schema.simpleTypes && schema.simpleTypes.length > 0 && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DataObject color="secondary" />
                                <Typography variant="subtitle1">
                                    Simple Types ({schema.simpleTypes.length})
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            {renderNodeList(
                                schema.simpleTypes, 
                                'simpleType', 
                                <DataObject color="secondary" />
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Elements */}
                {schema.elements && schema.elements.length > 0 && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Schema color="success" />
                                <Typography variant="subtitle1">
                                    Elements ({schema.elements.length})
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            {renderNodeList(
                                schema.elements, 
                                'element', 
                                <Schema color="success" />
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Attributes */}
                {schema.attributes && schema.attributes.length > 0 && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Attribution color="warning" />
                                <Typography variant="subtitle1">
                                    Attributes ({schema.attributes.length})
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            {renderNodeList(
                                schema.attributes, 
                                'attribute', 
                                <Attribution color="warning" />
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}

                {/* Empty State */}
                {(!schema.complexTypes || schema.complexTypes.length === 0) &&
                 (!schema.simpleTypes || schema.simpleTypes.length === 0) &&
                 (!schema.elements || schema.elements.length === 0) &&
                 (!schema.attributes || schema.attributes.length === 0) && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Alert severity="info">
                            No schema components found. The XSD file might be empty or invalid.
                        </Alert>
                    </Box>
                )}
            </Paper>

            {selectedNode && (
                <Paper elevation={2} sx={{ p: 2, mt: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Selected: {selectedNode.nodeType} - {selectedNode.name}
                    </Typography>
                    {selectedNode.documentation && (
                        <Typography variant="body2" color="text.secondary">
                            {selectedNode.documentation}
                        </Typography>
                    )}
                </Paper>
            )}
        </Box>
    );
};

SchemaTree.propTypes = {
    schema: PropTypes.object,
    onNodeSelect: PropTypes.func,
};

export default SchemaTree;