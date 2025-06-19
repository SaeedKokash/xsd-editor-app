export const formatSchemaData = (schema) => {
    // Format the schema data for display or editing
    return schema.map(type => ({
        name: type.name,
        documentation: type.documentation || '',
        validation: {
            pattern: type.validation?.pattern || '',
            enumeration: type.validation?.enumeration || [],
            minOccurs: type.validation?.minOccurs || 0,
            maxOccurs: type.validation?.maxOccurs || 1,
        },
        children: type.children || [],
    }));
};

export const validateSchemaType = (type) => {
    // Validate the schema type before saving
    if (!type.name) {
        return { valid: false, message: 'Type name is required.' };
    }
    // Additional validation logic can be added here
    return { valid: true };
};

export const deepClone = (obj) => {
    // Deep clone an object to avoid mutation
    return JSON.parse(JSON.stringify(obj));
};