import React, { useState, useEffect } from 'react';
import { 
  Box,
  Paper,
  TextField, 
  Button, 
  Typography, 
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';

const TypeEditor = ({ schema, selectedNode }) => {
    const [editingType, setEditingType] = useState(null);
    const [name, setName] = useState('');
    const [documentation, setDocumentation] = useState('');
    const [base, setBase] = useState('');
    const [pattern, setPattern] = useState('');
    const [enumerations, setEnumerations] = useState([]);
    const [minLength, setMinLength] = useState('');
    const [maxLength, setMaxLength] = useState('');
    const [children, setChildren] = useState([]);
    const [attributes, setAttributes] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [enumValue, setEnumValue] = useState('');

    useEffect(() => {
        if (selectedNode) {
            setEditingType(selectedNode);
            setName(selectedNode.name || '');
            setDocumentation(selectedNode.documentation || '');
            setBase(selectedNode.base || '');
            setPattern(selectedNode.pattern || '');
            setEnumerations(selectedNode.enumerations || []);
            setMinLength(selectedNode.minLength || '');
            setMaxLength(selectedNode.maxLength || '');
            setChildren(selectedNode.children || []);
            setAttributes(selectedNode.attributes || []);
        }
    }, [selectedNode]);

    const handleSave = () => {
        if (!editingType) return;

        const updatedType = {
            ...editingType,
            name,
            documentation,
            base,
            pattern,
            enumerations,
            minLength: minLength ? parseInt(minLength) : undefined,
            maxLength: maxLength ? parseInt(maxLength) : undefined,
            children,
            attributes
        };

        console.log('Saving type:', updatedType);
        // Here you would typically send the updated type back to the parent
        // or make an API call to save the changes
    };

    const handleAddEnumeration = () => {
        if (enumValue.trim()) {
            setEnumerations([...enumerations, enumValue.trim()]);
            setEnumValue('');
            setDialogOpen(false);
        }
    };

    const handleRemoveEnumeration = (index) => {
        setEnumerations(enumerations.filter((_, i) => i !== index));
    };

    if (!selectedNode) {
        return (
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    No Type Selected
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Select a type from the schema tree to edit its properties
                </Typography>
            </Paper>
        );
    }

    const isComplexType = selectedNode.nodeType === 'complexType';
    const isSimpleType = selectedNode.nodeType === 'simpleType';

    return (
        <Box>
            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Edit {selectedNode.nodeType}: {selectedNode.name}
                </Typography>
                <Chip 
                    label={selectedNode.nodeType} 
                    color={isComplexType ? 'primary' : 'secondary'}
                    sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Basic Information */}
                    <TextField
                        label="Type Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        required
                    />

                    <TextField
                        label="Documentation"
                        value={documentation}
                        onChange={(e) => setDocumentation(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Enter documentation for this type..."
                    />

                    {/* Simple Type Specific Fields */}
                    {isSimpleType && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6">Simple Type Properties</Typography>
                            
                            <TextField
                                label="Base Type"
                                value={base}
                                onChange={(e) => setBase(e.target.value)}
                                fullWidth
                                placeholder="e.g., xs:string, xs:int"
                            />

                            <TextField
                                label="Pattern"
                                value={pattern}
                                onChange={(e) => setPattern(e.target.value)}
                                fullWidth
                                placeholder="Regular expression pattern"
                            />

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Min Length"
                                    type="number"
                                    value={minLength}
                                    onChange={(e) => setMinLength(e.target.value)}
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    label="Max Length"
                                    type="number"
                                    value={maxLength}
                                    onChange={(e) => setMaxLength(e.target.value)}
                                    sx={{ flex: 1 }}
                                />
                            </Box>

                            {/* Enumerations */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="subtitle1">Enumerations</Typography>
                                    <Button
                                        size="small"
                                        startIcon={<Add />}
                                        onClick={() => setDialogOpen(true)}
                                    >
                                        Add
                                    </Button>
                                </Box>
                                {enumerations.length > 0 ? (
                                    <List dense>
                                        {enumerations.map((enumVal, index) => (
                                            <ListItem
                                                key={index}
                                                secondaryAction={
                                                    <IconButton 
                                                        edge="end" 
                                                        onClick={() => handleRemoveEnumeration(index)}
                                                        size="small"
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemText primary={enumVal} />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No enumerations defined
                                    </Typography>
                                )}
                            </Box>
                        </>
                    )}

                    {/* Complex Type Specific Fields */}
                    {isComplexType && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6">Complex Type Properties</Typography>
                            
                            {/* Child Elements */}
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    Child Elements ({children.length})
                                </Typography>
                                {children.length > 0 ? (
                                    <List dense>
                                        {children.map((child, index) => (
                                            <ListItem key={index}>
                                                <ListItemText
                                                    primary={child.name}
                                                    secondary={`Type: ${child.type} | Min: ${child.minOccurs} | Max: ${child.maxOccurs}`}
                                                />
                                                <IconButton size="small">
                                                    <Edit />
                                                </IconButton>
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No child elements defined
                                    </Typography>
                                )}
                            </Box>

                            {/* Attributes */}
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    Attributes ({attributes.length})
                                </Typography>
                                {attributes.length > 0 ? (
                                    <List dense>
                                        {attributes.map((attr, index) => (
                                            <ListItem key={index}>
                                                <ListItemText
                                                    primary={attr.name}
                                                    secondary={`Type: ${attr.type} | Use: ${attr.use}`}
                                                />
                                                <IconButton size="small">
                                                    <Edit />
                                                </IconButton>
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No attributes defined
                                    </Typography>
                                )}
                            </Box>
                        </>
                    )}

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleSave}
                            size="large"
                        >
                            Save Changes
                        </Button>
                        <Button 
                            variant="outlined" 
                            color="secondary"
                            size="large"
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Add Enumeration Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <DialogTitle>Add Enumeration Value</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Enumeration Value"
                        value={enumValue}
                        onChange={(e) => setEnumValue(e.target.value)}
                        fullWidth
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddEnumeration} variant="contained">Add</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TypeEditor;