import React, { useState, useEffect } from 'react';
import { 
  Box,
  Paper,
  TextField, 
  Button, 
  Typography, 
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const AttributeEditor = ({ schema, selectedNode }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [use, setUse] = useState('optional');
    const [documentation, setDocumentation] = useState('');

    useEffect(() => {
        if (selectedNode && selectedNode.nodeType === 'attribute') {
            setName(selectedNode.name || '');
            setType(selectedNode.type || '');
            setUse(selectedNode.use || 'optional');
            setDocumentation(selectedNode.documentation || '');
        }
    }, [selectedNode]);

    const handleSave = () => {
        const updatedAttribute = {
            name,
            type,
            use,
            documentation
        };
        console.log('Saving attribute:', updatedAttribute);
    };

    if (!selectedNode || selectedNode.nodeType !== 'attribute') {
        return (
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    No Attribute Selected
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Select an attribute from the schema tree to edit its properties
                </Typography>
            </Paper>
        );
    }

    return (
        <Box>
            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Edit Attribute: {selectedNode.name}
                </Typography>
                <Chip 
                    label="attribute" 
                    color="warning"
                    sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Attribute Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        required
                    />

                    <TextField
                        label="Type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        fullWidth
                        placeholder="e.g., xs:string, xs:int"
                    />

                    <FormControl fullWidth>
                        <InputLabel>Use</InputLabel>
                        <Select
                            value={use}
                            label="Use"
                            onChange={(e) => setUse(e.target.value)}
                        >
                            <MenuItem value="optional">Optional</MenuItem>
                            <MenuItem value="required">Required</MenuItem>
                            <MenuItem value="prohibited">Prohibited</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="Documentation"
                        value={documentation}
                        onChange={(e) => setDocumentation(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Enter documentation for this attribute..."
                    />

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
        </Box>
    );
};

export default AttributeEditor;