const { XMLBuilder } = require('fast-xml-parser');

const xsdGenerator = {
    generateXSD: (jsonSchema) => {
        const builder = new XMLBuilder({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            textNodeName: '#text',
            format: true,
            indentBy: '  ',
            processEntities: true,
            suppressEmptyNode: true
        });

        const xsd = {
            '?xml': {
                '@_version': '1.0',
                '@_encoding': 'UTF-8'
            },
            'xs:schema': {
                '@_xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
                '@_targetNamespace': jsonSchema.targetNamespace || '',
                '@_elementFormDefault': jsonSchema.elementFormDefault || 'qualified',
                '@_attributeFormDefault': jsonSchema.attributeFormDefault || 'unqualified'
            }
        };

        // Add complex types
        if (jsonSchema.complexTypes && jsonSchema.complexTypes.length > 0) {
            xsd['xs:schema']['xs:complexType'] = jsonSchema.complexTypes.map(type => {
                const complexType = {
                    '@_name': type.name
                };

                if (type.documentation) {
                    complexType['xs:annotation'] = {
                        'xs:documentation': type.documentation
                    };
                }

                if (type.children && type.children.length > 0) {
                    complexType['xs:sequence'] = {
                        'xs:element': type.children.map(child => ({
                            '@_name': child.name,
                            '@_type': child.type,
                            '@_minOccurs': child.minOccurs || '1',
                            '@_maxOccurs': child.maxOccurs || '1'
                        }))
                    };
                }

                if (type.attributes && type.attributes.length > 0) {
                    complexType['xs:attribute'] = type.attributes.map(attr => ({
                        '@_name': attr.name,
                        '@_type': attr.type,
                        '@_use': attr.use || 'optional'
                    }));
                }

                return complexType;
            });
        }

        // Add simple types
        if (jsonSchema.simpleTypes && jsonSchema.simpleTypes.length > 0) {
            xsd['xs:schema']['xs:simpleType'] = jsonSchema.simpleTypes.map(type => {
                const simpleType = {
                    '@_name': type.name
                };

                if (type.documentation) {
                    simpleType['xs:annotation'] = {
                        'xs:documentation': type.documentation
                    };
                }

                if (type.base) {
                    simpleType['xs:restriction'] = {
                        '@_base': type.base
                    };

                    const restrictions = type.restrictions || {};

                    // Handle enumerations
                    if (restrictions.enumerations && restrictions.enumerations.length > 0) {
                        simpleType['xs:restriction']['xs:enumeration'] = restrictions.enumerations.map(enumValue => ({
                            '@_value': enumValue
                        }));
                    }

                    // Handle pattern
                    if (restrictions.pattern) {
                        simpleType['xs:restriction']['xs:pattern'] = {
                            '@_value': restrictions.pattern
                        };
                    }

                    // Handle length constraints
                    if (restrictions.minLength !== undefined) {
                        simpleType['xs:restriction']['xs:minLength'] = {
                            '@_value': restrictions.minLength
                        };
                    }

                    if (restrictions.maxLength !== undefined) {
                        simpleType['xs:restriction']['xs:maxLength'] = {
                            '@_value': restrictions.maxLength
                        };
                    }

                    if (restrictions.length !== undefined) {
                        simpleType['xs:restriction']['xs:length'] = {
                            '@_value': restrictions.length
                        };
                    }

                    // Handle numeric constraints
                    if (restrictions.fractionDigits !== undefined) {
                        simpleType['xs:restriction']['xs:fractionDigits'] = {
                            '@_value': restrictions.fractionDigits
                        };
                    }

                    if (restrictions.totalDigits !== undefined) {
                        simpleType['xs:restriction']['xs:totalDigits'] = {
                            '@_value': restrictions.totalDigits
                        };
                    }

                    // Handle value range constraints
                    if (restrictions.minInclusive !== undefined) {
                        simpleType['xs:restriction']['xs:minInclusive'] = {
                            '@_value': restrictions.minInclusive
                        };
                    }

                    if (restrictions.maxInclusive !== undefined) {
                        simpleType['xs:restriction']['xs:maxInclusive'] = {
                            '@_value': restrictions.maxInclusive
                        };
                    }

                    if (restrictions.minExclusive !== undefined) {
                        simpleType['xs:restriction']['xs:minExclusive'] = {
                            '@_value': restrictions.minExclusive
                        };
                    }

                    if (restrictions.maxExclusive !== undefined) {
                        simpleType['xs:restriction']['xs:maxExclusive'] = {
                            '@_value': restrictions.maxExclusive
                        };
                    }

                    // Handle whitespace
                    if (restrictions.whiteSpace !== undefined) {
                        simpleType['xs:restriction']['xs:whiteSpace'] = {
                            '@_value': restrictions.whiteSpace
                        };
                    }

                    // Handle legacy structure for backward compatibility
                    if (type.enumerations && type.enumerations.length > 0 && (!restrictions.enumerations || restrictions.enumerations.length === 0)) {
                        simpleType['xs:restriction']['xs:enumeration'] = type.enumerations.map(enumValue => ({
                            '@_value': enumValue
                        }));
                    }

                    if (type.pattern && !restrictions.pattern) {
                        simpleType['xs:restriction']['xs:pattern'] = {
                            '@_value': type.pattern
                        };
                    }

                    if (type.minLength !== undefined && restrictions.minLength === undefined) {
                        simpleType['xs:restriction']['xs:minLength'] = {
                            '@_value': type.minLength
                        };
                    }

                    if (type.maxLength !== undefined && restrictions.maxLength === undefined) {
                        simpleType['xs:restriction']['xs:maxLength'] = {
                            '@_value': type.maxLength
                        };
                    }
                }

                return simpleType;
            });
        }

        // Add root elements
        if (jsonSchema.elements && jsonSchema.elements.length > 0) {
            xsd['xs:schema']['xs:element'] = jsonSchema.elements.map(element => ({
                '@_name': element.name,
                '@_type': element.type,
                '@_minOccurs': element.minOccurs || '1',
                '@_maxOccurs': element.maxOccurs || '1'
            }));
        }

        return builder.build(xsd);
    }
};

module.exports = xsdGenerator;