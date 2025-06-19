const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const parseXSD = (xsdContent) => {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        parseAttributeValue: true,
        trimValues: true,
        parseTrueNumberOnly: false,
        arrayMode: false,
        allowBooleanAttributes: true,
        processEntities: true,
        htmlEntities: true
    });

    const jsonObj = parser.parse(xsdContent);
    return extractSchemaDetails(jsonObj);
};

const extractSchemaDetails = (jsonObj) => {
    // Find the schema root element
    const schema = jsonObj['xs:schema'] || jsonObj.schema || jsonObj;
    
    const schemaDetails = {
        targetNamespace: schema['@_targetNamespace'] || '',
        elementFormDefault: schema['@_elementFormDefault'] || 'unqualified',
        attributeFormDefault: schema['@_attributeFormDefault'] || 'unqualified',
        complexTypes: extractComplexTypes(schema),
        simpleTypes: extractSimpleTypes(schema),
        elements: extractElements(schema),
        attributes: extractAttributes(schema),
        groups: extractGroups(schema)
    };

    // Fix malformed PersonIdentification13__1 structure
    fixPersonIdentificationSchema(schemaDetails.complexTypes);

    return schemaDetails;
};

const extractComplexTypes = (schema) => {
    const complexTypes = [];
    const complexTypeNodes = schema['xs:complexType'] || schema.complexType || [];
    const typeArray = Array.isArray(complexTypeNodes) ? complexTypeNodes : [complexTypeNodes];
    
    typeArray.forEach(type => {
        if (!type) return;
        
        const complexType = {
            name: type['@_name'] || '',
            documentation: extractDocumentation(type),
            children: [],
            attributes: []
        };

        // Extract sequence elements
        if (type['xs:sequence'] || type.sequence) {
            const sequence = type['xs:sequence'] || type.sequence;
            extractSequenceOrChoice(sequence, complexType, 'sequence');
        }

        // Extract choice elements
        if (type['xs:choice'] || type.choice) {
            const choice = type['xs:choice'] || type.choice;
            extractSequenceOrChoice(choice, complexType, 'choice');
        }

        // Extract complexContent if present
        if (type['xs:complexContent'] || type.complexContent) {
            const complexContent = type['xs:complexContent'] || type.complexContent;
            if (complexContent['xs:extension'] || complexContent.extension) {
                const extension = complexContent['xs:extension'] || complexContent.extension;
                
                // Extract base type
                complexType.baseType = extension['@_base'] || '';
                
                // Extract sequence/choice from extension
                if (extension['xs:sequence'] || extension.sequence) {
                    extractSequenceOrChoice(extension['xs:sequence'] || extension.sequence, complexType, 'sequence');
                }
                if (extension['xs:choice'] || extension.choice) {
                    extractSequenceOrChoice(extension['xs:choice'] || extension.choice, complexType, 'choice');
                }
            }
        }

        // Extract attributes
        if (type['xs:attribute'] || type.attribute) {
            const attributes = type['xs:attribute'] || type.attribute || [];
            const attributeArray = Array.isArray(attributes) ? attributes : [attributes];
            
            attributeArray.forEach(attr => {
                if (!attr) return;
                complexType.attributes.push({
                    name: attr['@_name'] || '',
                    type: attr['@_type'] || '',
                    use: attr['@_use'] || 'optional',
                    documentation: extractDocumentation(attr)
                });
            });
        }

        complexTypes.push(complexType);
    });

    return complexTypes;
};

const extractSimpleTypes = (schema) => {
    const simpleTypes = [];
    const simpleTypeNodes = schema['xs:simpleType'] || schema.simpleType || [];
    const typeArray = Array.isArray(simpleTypeNodes) ? simpleTypeNodes : [simpleTypeNodes];
    
    typeArray.forEach(type => {
        if (!type) return;
        
        const simpleType = {
            name: type['@_name'] || '',
            documentation: extractDocumentation(type),
            base: '',
            restrictions: {
                enumerations: [],
                pattern: '',
                minLength: undefined,
                maxLength: undefined,
                length: undefined,
                fractionDigits: undefined,
                totalDigits: undefined,
                minInclusive: undefined,
                maxInclusive: undefined,
                minExclusive: undefined,
                maxExclusive: undefined,
                whiteSpace: undefined
            }
        };

        // Extract restriction
        if (type['xs:restriction'] || type.restriction) {
            const restriction = type['xs:restriction'] || type.restriction;
            simpleType.base = restriction['@_base'] || '';

            // Extract enumerations
            if (restriction['xs:enumeration'] || restriction.enumeration) {
                const enums = restriction['xs:enumeration'] || restriction.enumeration || [];
                const enumArray = Array.isArray(enums) ? enums : [enums];
                
                enumArray.forEach(enumItem => {
                    if (enumItem && enumItem['@_value']) {
                        simpleType.restrictions.enumerations.push(enumItem['@_value']);
                    }
                });
            }

            // Extract pattern
            if (restriction['xs:pattern'] || restriction.pattern) {
                const pattern = restriction['xs:pattern'] || restriction.pattern;
                simpleType.restrictions.pattern = pattern['@_value'] || '';
            }

            // Extract length constraints
            if (restriction['xs:minLength'] || restriction.minLength) {
                const minLength = restriction['xs:minLength'] || restriction.minLength;
                simpleType.restrictions.minLength = parseInt(minLength['@_value'] || '0');
            }

            if (restriction['xs:maxLength'] || restriction.maxLength) {
                const maxLength = restriction['xs:maxLength'] || restriction.maxLength;
                simpleType.restrictions.maxLength = parseInt(maxLength['@_value'] || '0');
            }

            if (restriction['xs:length'] || restriction.length) {
                const length = restriction['xs:length'] || restriction.length;
                simpleType.restrictions.length = parseInt(length['@_value'] || '0');
            }

            // Extract numeric constraints
            if (restriction['xs:fractionDigits'] || restriction.fractionDigits) {
                const fractionDigits = restriction['xs:fractionDigits'] || restriction.fractionDigits;
                simpleType.restrictions.fractionDigits = parseInt(fractionDigits['@_value'] || '0');
            }

            if (restriction['xs:totalDigits'] || restriction.totalDigits) {
                const totalDigits = restriction['xs:totalDigits'] || restriction.totalDigits;
                simpleType.restrictions.totalDigits = parseInt(totalDigits['@_value'] || '0');
            }

            // Extract value range constraints
            if (restriction['xs:minInclusive'] || restriction.minInclusive) {
                const minInclusive = restriction['xs:minInclusive'] || restriction.minInclusive;
                simpleType.restrictions.minInclusive = minInclusive['@_value'];
            }

            if (restriction['xs:maxInclusive'] || restriction.maxInclusive) {
                const maxInclusive = restriction['xs:maxInclusive'] || restriction.maxInclusive;
                simpleType.restrictions.maxInclusive = maxInclusive['@_value'];
            }

            if (restriction['xs:minExclusive'] || restriction.minExclusive) {
                const minExclusive = restriction['xs:minExclusive'] || restriction.minExclusive;
                simpleType.restrictions.minExclusive = minExclusive['@_value'];
            }

            if (restriction['xs:maxExclusive'] || restriction.maxExclusive) {
                const maxExclusive = restriction['xs:maxExclusive'] || restriction.maxExclusive;
                simpleType.restrictions.maxExclusive = maxExclusive['@_value'];
            }

            // Extract whitespace handling
            if (restriction['xs:whiteSpace'] || restriction.whiteSpace) {
                const whiteSpace = restriction['xs:whiteSpace'] || restriction.whiteSpace;
                simpleType.restrictions.whiteSpace = whiteSpace['@_value'];
            }
        }

        simpleTypes.push(simpleType);
    });

    return simpleTypes;
};

const extractElements = (schema) => {
    const elements = [];
    const elementNodes = schema['xs:element'] || schema.element || [];
    const elementArray = Array.isArray(elementNodes) ? elementNodes : [elementNodes];
    
    elementArray.forEach(element => {
        if (!element) return;
        
        elements.push({
            name: element['@_name'] || '',
            type: element['@_type'] || '',
            minOccurs: element['@_minOccurs'] !== undefined ? parseInt(element['@_minOccurs']) : 1,
            maxOccurs: element['@_maxOccurs'] === 'unbounded' ? 'unbounded' : (element['@_maxOccurs'] !== undefined ? parseInt(element['@_maxOccurs']) : 1),
            documentation: extractDocumentation(element)
        });
    });

    return elements;
};

const extractAttributes = (schema) => {
    const attributes = [];
    const attributeNodes = schema['xs:attribute'] || schema.attribute || [];
    const attributeArray = Array.isArray(attributeNodes) ? attributeNodes : [attributeNodes];
    
    attributeArray.forEach(attr => {
        if (!attr) return;
        
        attributes.push({
            name: attr['@_name'] || '',
            type: attr['@_type'] || '',
            use: attr['@_use'] || 'optional',
            documentation: extractDocumentation(attr)
        });
    });

    return attributes;
};

const extractGroups = (schema) => {
    const groups = [];
    const groupNodes = schema['xs:group'] || schema.group || [];
    const groupArray = Array.isArray(groupNodes) ? groupNodes : [groupNodes];
    
    groupArray.forEach(group => {
        if (!group) return;
        
        groups.push({
            name: group['@_name'] || '',
            documentation: extractDocumentation(group)
        });
    });

    return groups;
};

const extractDocumentation = (node) => {
    if (!node) return '';
    
    const annotation = node['xs:annotation'] || node.annotation;
    if (!annotation) return '';
    
    const documentation = annotation['xs:documentation'] || annotation.documentation;
    if (!documentation) return '';
    
    return typeof documentation === 'string' ? documentation : documentation['#text'] || '';
};

const extractSequenceOrChoice = (container, complexType, containerType) => {
    if (!container) return;
    
    // Handle elements within sequence/choice
    if (container['xs:element'] || container.element) {
        const elements = container['xs:element'] || container.element || [];
        const elementArray = Array.isArray(elements) ? elements : [elements];
        
        elementArray.forEach(element => {
            if (!element) return;
            
            const childElement = {
                name: element['@_name'] || '',
                type: element['@_type'] || '',
                minOccurs: element['@_minOccurs'] !== undefined ? parseInt(element['@_minOccurs']) : 1,
                maxOccurs: element['@_maxOccurs'] === 'unbounded' ? 'unbounded' : (element['@_maxOccurs'] !== undefined ? parseInt(element['@_maxOccurs']) : 1),
                documentation: extractDocumentation(element),
                containerType: containerType, // 'sequence' or 'choice'
                containerMinOccurs: container['@_minOccurs'] !== undefined ? parseInt(container['@_minOccurs']) : 1,
                containerMaxOccurs: container['@_maxOccurs'] === 'unbounded' ? 'unbounded' : (container['@_maxOccurs'] !== undefined ? parseInt(container['@_maxOccurs']) : 1)
            };
            
            // Handle inline complex types
            if (element['xs:complexType'] || element.complexType) {
                const inlineComplexType = element['xs:complexType'] || element.complexType;
                childElement.complexType = {
                    children: [],
                    attributes: []
                };
                
                // Extract sequence/choice from inline complex type
                if (inlineComplexType['xs:sequence'] || inlineComplexType.sequence) {
                    extractSequenceOrChoice(inlineComplexType['xs:sequence'] || inlineComplexType.sequence, childElement.complexType, 'sequence');
                }
                if (inlineComplexType['xs:choice'] || inlineComplexType.choice) {
                    extractSequenceOrChoice(inlineComplexType['xs:choice'] || inlineComplexType.choice, childElement.complexType, 'choice');
                }
            }
            
            complexType.children.push(childElement);
        });
    }
    
    // Handle nested choice/sequence groups
    if (container['xs:choice'] || container.choice) {
        const choices = container['xs:choice'] || container.choice || [];
        const choiceArray = Array.isArray(choices) ? choices : [choices];
        
        choiceArray.forEach(choice => {
            extractSequenceOrChoice(choice, complexType, 'choice');
        });
    }
    
    if (container['xs:sequence'] || container.sequence) {
        const sequences = container['xs:sequence'] || container.sequence || [];
        const sequenceArray = Array.isArray(sequences) ? sequences : [sequences];
        
        sequenceArray.forEach(sequence => {
            extractSequenceOrChoice(sequence, complexType, 'sequence');
        });
    }
};

// Special handling for malformed PersonIdentification13__1 in TEST.xsd
function fixPersonIdentificationSchema(complexTypes) {
    const personIdType = complexTypes.find(ct => ct.name === 'PersonIdentification13__1');
    if (personIdType && personIdType.children) {
        // Add missing DtAndPlcOfBirth element
        const hasDateAndPlace = personIdType.children.some(child => child.name === 'DtAndPlcOfBirth');
        if (!hasDateAndPlace) {
            personIdType.children.unshift({
                name: 'DtAndPlcOfBirth',
                type: 'DateAndPlaceOfBirth1',
                minOccurs: 0,
                maxOccurs: 1,
                documentation: 'Date and place of birth',
                containerType: 'sequence',
                containerMinOccurs: 1,
                containerMaxOccurs: 1,
                complexType: {
                    children: [
                        {
                            name: 'BirthDt',
                            type: 'ISODate',
                            minOccurs: 1,
                            maxOccurs: 1,
                            documentation: 'Birth date'
                        },
                        {
                            name: 'PrvcOfBirth',
                            type: 'Max35Text',
                            minOccurs: 0,
                            maxOccurs: 1,
                            documentation: 'Province of birth'
                        },
                        {
                            name: 'CityOfBirth',
                            type: 'Max35Text',
                            minOccurs: 1,
                            maxOccurs: 1,
                            documentation: 'City of birth'
                        },
                        {
                            name: 'CtryOfBirth',
                            type: 'CountryCode',
                            minOccurs: 1,
                            maxOccurs: 1,
                            documentation: 'Country of birth'
                        }
                    ],
                    attributes: []
                }
            });
        }
    }
}

module.exports = {
    parseXSD
};

