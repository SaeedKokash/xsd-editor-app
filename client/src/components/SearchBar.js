import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { 
  Search,
  Clear,
  FilterList,
  Schema,
  DataObject,
  Category,
  Attribution,
  FindInPage,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';

const SearchBar = ({ schema, onNodeSelect, onSearchResults }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [isExpanded, setIsExpanded] = useState(false);    // Perform search function
    const performSearch = useCallback((term) => {
        if (!schema || !term) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        const results = [];
        const searchTermLower = term.toLowerCase();

        // Helper function to check if a string matches the search term
        const matchesSearch = (text) => {
            if (!text) return false;
            return text.toLowerCase().includes(searchTermLower);
        };

        // Helper function to add matched item to results
        const addToResults = (item, type, matchReason) => {
            results.push({
                ...item,
                nodeType: type,
                matchReason,
                score: calculateRelevanceScore(item, term, matchReason)
            });
        };

        // Search in elements
        if ((filterType === 'all' || filterType === 'element') && schema.elements) {
            schema.elements.forEach(element => {
                const reasons = [];
                if (matchesSearch(element.name)) reasons.push('name');
                if (matchesSearch(element.type)) reasons.push('type');
                if (matchesSearch(element.documentation)) reasons.push('documentation');
                
                if (reasons.length > 0) {
                    addToResults(element, 'element', reasons);
                }
            });
        }

        // Search in simple types
        if ((filterType === 'all' || filterType === 'simpleType') && schema.simpleTypes) {
            schema.simpleTypes.forEach(simpleType => {
                const reasons = [];
                if (matchesSearch(simpleType.name)) reasons.push('name');
                if (matchesSearch(simpleType.base)) reasons.push('base');
                if (matchesSearch(simpleType.documentation)) reasons.push('documentation');
                
                // Search in restrictions
                if (simpleType.restrictions) {
                    if (simpleType.restrictions.enumerations) {
                        const hasEnumMatch = simpleType.restrictions.enumerations.some(
                            enumValue => matchesSearch(enumValue)
                        );
                        if (hasEnumMatch) reasons.push('enumeration');
                    }
                    if (matchesSearch(simpleType.restrictions.pattern)) reasons.push('pattern');
                }
                
                if (reasons.length > 0) {
                    addToResults(simpleType, 'simpleType', reasons);
                }
            });
        }

        // Search in complex types
        if ((filterType === 'all' || filterType === 'complexType') && schema.complexTypes) {
            schema.complexTypes.forEach(complexType => {
                const reasons = [];
                if (matchesSearch(complexType.name)) reasons.push('name');
                if (matchesSearch(complexType.documentation)) reasons.push('documentation');
                
                if (reasons.length > 0) {
                    addToResults(complexType, 'complexType', reasons);
                }
            });
        }

        // Search in attributes
        if ((filterType === 'all' || filterType === 'attribute') && schema.attributes) {
            schema.attributes.forEach(attribute => {
                const reasons = [];
                if (matchesSearch(attribute.name)) reasons.push('name');
                if (matchesSearch(attribute.type)) reasons.push('type');
                if (matchesSearch(attribute.documentation)) reasons.push('documentation');
                
                if (reasons.length > 0) {
                    addToResults(attribute, 'attribute', reasons);
                }
            });
        }

        // Sort results by relevance score
        const sortedResults = results.sort((a, b) => b.score - a.score);
        
        setSearchResults(sortedResults);
        setShowResults(true);
        
        // Notify parent component about search results
        if (onSearchResults) {
            onSearchResults(sortedResults);
        }
    }, [schema, filterType, onSearchResults]);

    // Debounced search effect
    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            if (searchTerm.trim()) {
                performSearch(searchTerm.trim());
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(delayedSearch);
    }, [searchTerm, performSearch]);    const calculateRelevanceScore = (item, term, matchReasons) => {
        let score = 0;
        const termLower = term.toLowerCase();
        
        // Higher score for exact name matches
        if (item.name && item.name.toLowerCase() === termLower) {
            score += 100;
        } else if (item.name && item.name.toLowerCase().includes(termLower)) {
            score += 50;
        }
        
        // Score for different match types
        matchReasons.forEach(reason => {
            switch (reason) {
                case 'name':
                    score += 30;
                    break;
                case 'type':
                    score += 20;
                    break;
                case 'documentation':
                    score += 10;
                    break;
                case 'enumeration':
                case 'pattern':
                    score += 15;
                    break;
                default:
                    score += 5;
            }
        });
        
        return score;
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setSearchResults([]);
        setShowResults(false);
        if (onSearchResults) {
            onSearchResults([]);
        }
    };

    const handleResultClick = (result) => {
        if (onNodeSelect) {
            onNodeSelect(result);
        }
        setShowResults(false);
    };

    const getNodeIcon = (nodeType) => {
        switch (nodeType) {
            case 'element':
                return <Schema color="success" />;
            case 'simpleType':
                return <DataObject color="secondary" />;
            case 'complexType':
                return <Category color="primary" />;
            case 'attribute':
                return <Attribution color="warning" />;
            default:
                return <FindInPage />;
        }
    };

    const getNodeTypeLabel = (nodeType) => {
        switch (nodeType) {
            case 'element':
                return 'Element';
            case 'simpleType':
                return 'Simple Type';
            case 'complexType':
                return 'Complex Type';
            case 'attribute':
                return 'Attribute';
            default:
                return 'Item';
        }
    };

    const getMatchReasonText = (reasons) => {
        if (!reasons || reasons.length === 0) return '';
        
        const reasonTexts = {
            name: 'Name',
            type: 'Type',
            documentation: 'Documentation',
            enumeration: 'Enumeration',
            pattern: 'Pattern',
            base: 'Base Type'
        };
        
        return reasons.map(reason => reasonTexts[reason] || reason).join(', ');
    };

    const getResultCounts = () => {
        const counts = {};
        searchResults.forEach(result => {
            counts[result.nodeType] = (counts[result.nodeType] || 0) + 1;
        });
        return counts;
    };

    const resultCounts = getResultCounts();

    return (
        <Box sx={{ position: 'relative' }}>
            {/* Search Input */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search elements, types, attributes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={handleClearSearch}>
                                        <Clear />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    
                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>Filter</InputLabel>
                        <Select
                            value={filterType}
                            label="Filter"
                            onChange={(e) => setFilterType(e.target.value)}
                            startAdornment={<FilterList />}
                        >
                            <MenuItem value="all">All Types</MenuItem>
                            <MenuItem value="element">Elements</MenuItem>
                            <MenuItem value="simpleType">Simple Types</MenuItem>
                            <MenuItem value="complexType">Complex Types</MenuItem>
                            <MenuItem value="attribute">Attributes</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Search Results Summary */}
                {searchResults.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}:
                        </Typography>
                        {Object.entries(resultCounts).map(([type, count]) => (
                            <Chip
                                key={type}
                                label={`${getNodeTypeLabel(type)}: ${count}`}
                                size="small"
                                variant="outlined"
                                color="primary"
                            />
                        ))}
                        <IconButton 
                            size="small" 
                            onClick={() => setIsExpanded(!isExpanded)}
                            sx={{ ml: 'auto' }}
                        >
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </Box>
                )}
            </Paper>

            {/* Search Results */}
            {showResults && searchResults.length > 0 && isExpanded && (
                <Paper elevation={2} sx={{ mb: 2, maxHeight: 400, overflow: 'auto' }}>
                    <List dense>
                        {searchResults.map((result, index) => (
                            <React.Fragment key={`${result.nodeType}-${result.name}-${index}`}>
                                <ListItem disablePadding>
                                    <ListItemButton 
                                        onClick={() => handleResultClick(result)}
                                        sx={{ py: 1 }}
                                    >
                                        <ListItemIcon>
                                            {getNodeIcon(result.nodeType)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {result.name}
                                                    </Typography>
                                                    <Chip
                                                        label={getNodeTypeLabel(result.nodeType)}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ minWidth: 'auto' }}
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    {result.type && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Type: {result.type}
                                                        </Typography>
                                                    )}
                                                    {result.matchReason && (
                                                        <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                                                            Matches: {getMatchReasonText(result.matchReason)}
                                                        </Typography>
                                                    )}
                                                    {result.documentation && (
                                                        <Typography 
                                                            variant="caption" 
                                                            color="text.secondary"
                                                            sx={{ 
                                                                display: 'block',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                maxWidth: '300px'
                                                            }}
                                                        >
                                                            {result.documentation}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                                {index < searchResults.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}

            {/* No Results Message */}
            {showResults && searchResults.length === 0 && searchTerm.trim() && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    No items found matching "{searchTerm}". Try adjusting your search terms or filter settings.
                </Alert>
            )}
        </Box>
    );
};

export default SearchBar;
