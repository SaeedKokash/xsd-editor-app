import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  CssBaseline, 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Grid, 
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import FileUploader from './components/FileUploader';
import SchemaTree from './components/SchemaTree';
import ElementsTree from './components/ElementsTree';
import ElementTreeEditor from './components/ElementTreeEditor';
import XmlValidator from './components/XmlValidator';
import TypeEditor from './components/TypeEditor';
import ElementEditor from './components/ElementEditor';
import AttributeEditor from './components/AttributeEditor';
import SearchBar from './components/SearchBar';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function AppContent() {
    const [schema, setSchema] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [currentTab, setCurrentTab] = useState(0);

    const handleSchemaUpload = (uploadedSchema) => {
        console.log('Schema uploaded:', uploadedSchema);
        setSchema(uploadedSchema);
        setSelectedNode(null);
        // Show the schema tree tab after successful upload
        setCurrentTab(0);
    };

    const handleSchemaUpdate = (updatedSchema) => {
        console.log('Schema updated:', updatedSchema);
        setSchema(updatedSchema);
        // Optionally, you could send the updated schema to the backend here
        // to save it or generate the XSD file
    };

    const handleNodeSelect = (node) => {
        console.log('Node selected:', node);
        setSelectedNode(node);
        
        // Switch to appropriate editor tab based on node type
        if (node.nodeType === 'complexType' || node.nodeType === 'simpleType') {
            setCurrentTab(4); // Type Editor (index shifted due to new Search tab)
        } else if (node.nodeType === 'element') {
            setCurrentTab(5); // Element Editor
        } else if (node.nodeType === 'attribute') {
            setCurrentTab(6); // Attribute Editor
        }
    };

    const handleSearchNodeSelect = (node) => {
        handleNodeSelect(node);
        // Switch to appropriate editor based on selected node
    };

    const handleElementUpdate = (elementNode, updatedElementData) => {
        // Update the element in the schema
        const newSchema = JSON.parse(JSON.stringify(schema)); // Deep clone to avoid mutation
        
        if (elementNode && elementNode.nodeType === 'element') {
            // Helper function to update element in array
            const updateElementInArray = (elements, targetNode, newData) => {
                if (!elements) return false;
                
                const elementIndex = elements.findIndex(el => el.name === targetNode.name);
                if (elementIndex >= 0) {
                    elements[elementIndex] = {
                        ...elements[elementIndex],
                        ...newData
                    };
                    return true;
                }
                return false;
            };
            
            // Helper function to update element in complex type children
            const updateElementInComplexTypes = (complexTypes, targetNode, newData) => {
                if (!complexTypes) return false;
                
                for (const complexType of complexTypes) {
                    if (complexType.children) {
                        const elementIndex = complexType.children.findIndex(el => 
                            el.name === targetNode.name && el.nodeType === 'element'
                        );
                        if (elementIndex >= 0) {
                            complexType.children[elementIndex] = {
                                ...complexType.children[elementIndex],
                                ...newData
                            };
                            return true;
                        }
                    }
                }
                return false;
            };
            
            // Try to update in root elements first
            let updated = updateElementInArray(newSchema.elements, elementNode, updatedElementData);
            
            // If not found in root elements, check complex types
            if (!updated) {
                updated = updateElementInComplexTypes(newSchema.complexTypes, elementNode, updatedElementData);
            }
            
            if (updated) {
                console.log('Element updated successfully:', updatedElementData);
            } else {
                console.warn('Element not found for update:', elementNode);
            }
        }
        
        handleSchemaUpdate(newSchema);
    };

    const handleSimpleTypeUpdate = (originalSimpleType, updatedSimpleType) => {
        const newSchema = JSON.parse(JSON.stringify(schema)); // Deep clone to avoid mutation
        
        if (!newSchema.simpleTypes) {
            newSchema.simpleTypes = [];
        }
        
        console.log('handleSimpleTypeUpdate called:');
        console.log('- originalSimpleType:', originalSimpleType);
        console.log('- updatedSimpleType:', updatedSimpleType);
        console.log('- Current simpleTypes count:', newSchema.simpleTypes.length);
        
        if (originalSimpleType === null) {
            // Adding a new simple type (for duplicate functionality)
            console.log('ADDING new simple type - original types will be preserved');
            console.log('- Before addition - existing types:', newSchema.simpleTypes.map(st => st.name));
            
            // Double-check that we're not accidentally replacing an existing type
            const existingTypeIndex = newSchema.simpleTypes.findIndex(st => st.name === updatedSimpleType.name);
            if (existingTypeIndex >= 0) {
                console.error('ERROR: Attempting to add a type that already exists:', updatedSimpleType.name);
                console.error('This should not happen - the duplicate dialog should prevent this');
                return; // Abort the operation to prevent overwriting
            }
            
            newSchema.simpleTypes.push(updatedSimpleType);
            console.log('- After addition - new simpleTypes count:', newSchema.simpleTypes.length);
            console.log('- After addition - all types:', newSchema.simpleTypes.map(st => st.name));
            console.log('- Added type details:', updatedSimpleType.name, updatedSimpleType);
        } else {
            // Updating existing simple type
            console.log('UPDATING existing simple type');
            const typeIndex = newSchema.simpleTypes.findIndex(st => st.name === originalSimpleType.name);
            if (typeIndex >= 0) {
                const oldTypeName = originalSimpleType.name;
                const newTypeName = updatedSimpleType.name;
                
                console.log(`- Found type at index ${typeIndex}`);
                console.log(`- Updating "${oldTypeName}" to "${newTypeName}"`);
                
                // Update the simple type
                newSchema.simpleTypes[typeIndex] = updatedSimpleType;
                
                // If the type name changed, update all references to this type
                if (oldTypeName !== newTypeName) {
                    console.log('- Type name changed, updating all references');
                    updateAllTypeReferences(newSchema, oldTypeName, newTypeName);
                } else {
                    console.log('- Type name unchanged, only updating properties');
                }
            } else {
                console.warn('- Simple type not found for update:', originalSimpleType);
            }
        }
        
        console.log('- Final simpleTypes count:', newSchema.simpleTypes.length);
        console.log('- Final simpleTypes names:', newSchema.simpleTypes.map(st => st.name));
        
        handleSchemaUpdate(newSchema);
    };

    // Helper function to update all references to a renamed simple type
    const updateAllTypeReferences = (schema, oldTypeName, newTypeName) => {
        // Update root elements
        if (schema.elements) {
            schema.elements.forEach(element => {
                if (element.type === oldTypeName) {
                    element.type = newTypeName;
                }
            });
        }
        
        // Update elements within complex types
        if (schema.complexTypes) {
            schema.complexTypes.forEach(complexType => {
                if (complexType.children) {
                    complexType.children.forEach(child => {
                        if (child.nodeType === 'element' && child.type === oldTypeName) {
                            child.type = newTypeName;
                        }
                    });
                }
            });
        }
        
        // Update attributes
        if (schema.attributes) {
            schema.attributes.forEach(attribute => {
                if (attribute.type === oldTypeName) {
                    attribute.type = newTypeName;
                }
            });
        }
        
        // Update complex types that might extend/restrict the renamed simple type
        if (schema.complexTypes) {
            schema.complexTypes.forEach(complexType => {
                if (complexType.base === oldTypeName) {
                    complexType.base = newTypeName;
                }
                if (complexType.type === oldTypeName) {
                    complexType.type = newTypeName;
                }
            });
        }
        
        // Update other simple types that might extend/restrict the renamed simple type
        if (schema.simpleTypes) {
            schema.simpleTypes.forEach(simpleType => {
                if (simpleType.base === oldTypeName) {
                    simpleType.base = newTypeName;
                }
            });
        }
    };

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <div className="App">
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        XSD Schema Editor
                    </Typography>
                    {schema && (
                        <Typography variant="body2" sx={{ mr: 2 }}>
                            Schema loaded with {' '}
                            {(schema.complexTypes?.length || 0) + (schema.simpleTypes?.length || 0)} types, {' '}
                            {schema.elements?.length || 0} elements
                        </Typography>
                    )}
                </Toolbar>
            </AppBar>
            
            <Container maxWidth="xl" sx={{ mt: 2 }}>
                {/* File Uploader - Always visible */}
                <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                    <FileUploader onUpload={handleSchemaUpload} />
                </Paper>

                {/* Schema Content - Only shown when schema is loaded */}
                {schema ? (
                    <Box>
                        {/* Tabs for different views */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                            <Tabs value={currentTab} onChange={handleTabChange}>
                                <Tab label="Schema Tree" />
                                <Tab label="Elements Tree" />
                                <Tab label="Element Tree Editor" />
                                <Tab label="XML Validator" />
                                <Tab label="Search" />
                                <Tab 
                                    label={`Type Editor${selectedNode && (selectedNode.nodeType === 'complexType' || selectedNode.nodeType === 'simpleType') ? ` (${selectedNode.name})` : ''}`} 
                                    disabled={!selectedNode || (selectedNode.nodeType !== 'complexType' && selectedNode.nodeType !== 'simpleType')}
                                />
                                <Tab 
                                    label={`Element Editor${selectedNode && selectedNode.nodeType === 'element' ? ` (${selectedNode.name})` : ''}`} 
                                    disabled={!selectedNode || selectedNode.nodeType !== 'element'}
                                />
                                <Tab 
                                    label={`Attribute Editor${selectedNode && selectedNode.nodeType === 'attribute' ? ` (${selectedNode.name})` : ''}`} 
                                    disabled={!selectedNode || selectedNode.nodeType !== 'attribute'}
                                />
                            </Tabs>
                        </Box>

                        {/* Tab Content */}
                        <Grid container spacing={3}>
                            {currentTab === 0 && (
                                <Grid item xs={12}>
                                    <SchemaTree 
                                        schema={schema} 
                                        onNodeSelect={handleNodeSelect} 
                                    />
                                </Grid>
                            )}
                            
                            {currentTab === 1 && (
                                <Grid item xs={12}>
                                    <ElementsTree 
                                        schema={schema} 
                                        onNodeSelect={handleNodeSelect} 
                                    />
                                </Grid>
                            )}
                            
                            {currentTab === 2 && (
                                <Grid item xs={12}>
                                    <ElementTreeEditor 
                                        schema={schema} 
                                        onSchemaUpdate={handleSchemaUpdate} 
                                    />
                                </Grid>
                            )}
                            
                            {currentTab === 3 && (
                                <Grid item xs={12}>
                                    <XmlValidator 
                                        schema={schema}
                                    />
                                </Grid>
                            )}
                            
                            {currentTab === 4 && (
                                <Grid item xs={12}>
                                    <Paper elevation={2} sx={{ p: 3 }}>
                                        <Typography variant="h5" gutterBottom>
                                            Search Schema Components
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                            Search for elements, simple types, complex types, and attributes in your XSD schema.
                                        </Typography>
                                        <SearchBar 
                                            schema={schema}
                                            onNodeSelect={handleSearchNodeSelect}
                                        />
                                    </Paper>
                                </Grid>
                            )}
                            
                            {currentTab === 5 && (
                                <Grid item xs={12}>
                                    <TypeEditor 
                                        schema={schema} 
                                        selectedNode={selectedNode} 
                                    />
                                </Grid>
                            )}
                            
                            {currentTab === 6 && (
                                <Grid item xs={12}>
                                    <ElementEditor 
                                        schema={schema} 
                                        selectedNode={selectedNode}
                                        onElementUpdate={handleElementUpdate}
                                        onSimpleTypeUpdate={handleSimpleTypeUpdate}
                                    />
                                </Grid>
                            )}
                            
                            {currentTab === 6 && (
                                <Grid item xs={12}>
                                    <AttributeEditor 
                                        schema={schema} 
                                        selectedNode={selectedNode} 
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                ) : (
                    /* Welcome message when no schema is loaded */
                    <Paper elevation={1} sx={{ p: 6, textAlign: 'center', backgroundColor: 'grey.50' }}>
                        <Typography variant="h4" gutterBottom color="primary">
                            Welcome to XSD Schema Editor
                        </Typography>
                        <Typography variant="h6" gutterBottom color="text.secondary">
                            Upload an XSD file to get started
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            • Visualize your XML Schema structure
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            • Edit complex and simple types
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            • Modify elements and attributes
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            • Export your modified schema
                        </Typography>
                    </Paper>
                )}
            </Container>
        </div>
    );
}

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Routes>
                    <Route path="/*" element={<AppContent />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;