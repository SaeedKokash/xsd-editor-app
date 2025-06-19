# XSD Editor App

A powerful web-based XSD (XML Schema Definition) editor and validator with a React frontend and Node.js backend.

## 🚀 Features

- **XSD Schema Editing**: Interactive visual editing of XSD schemas
- **XML Validation**: Validate XML files against XSD schemas with robust error handling
- **Tree View**: Visual representation of schema structure
- **Element Management**: Add, edit, and delete schema elements
- **Type Management**: Create and manage simple and complex types
- **Real-time Validation**: Instant feedback on schema and XML validity
- **File Upload**: Support for uploading XSD and XML files
- **Export**: Generate and download modified XSD schemas
- **Array Handling**: Proper support for elements with maxOccurs="unbounded"
- **Optional Elements**: Correct handling of elements with minOccurs="0"
- **Combined Element & Simple Type Editing**: Edit element properties and their associated simple type restrictions in a unified interface.
- **Comprehensive Simple Type Editor**: Full support for all XSD restriction facets (pattern, enumerations, length, numeric constraints, value ranges, whitespace handling).
- **Advanced Search**: Powerful search functionality to quickly find elements, simple types, complex types, and attributes across the entire schema.
- Edit existing types and add new complexTypes/simpleTypes.
- Reorder child elements via drag-and-drop functionality.
- Convert modified JSON schemas back to valid XSD format.
- Download or save the modified XSD files.
- **Real-time Validation**: Conflict detection and helpful warnings for restriction combinations.
- **Type-aware Interface**: Smart UI that shows relevant restrictions based on the base type.

## Project Structure
```
xsd-editor-app
├── client                # Frontend React application
│   ├── public
│   │   └── index.html    # Main HTML file
│   ├── src
│   │   ├── components     # React components
│   │   ├── services       # API service functions
│   │   ├── utils          # Utility functions
│   │   ├── App.js         # Main application component
│   │   └── index.js       # Entry point for React app
│   └── package.json       # Frontend dependencies and scripts
├── server                # Backend Node.js application
│   ├── src
│   │   ├── controllers    # Request handling logic
│   │   ├── services       # XSD parsing and generation logic
│   │   ├── routes         # API routes
│   │   ├── middleware      # Middleware for file uploads
│   │   └── app.js         # Main entry point for the server
│   └── package.json       # Backend dependencies and scripts
├── shared                # Shared types and constants
│   └── types.js
└── README.md             # Project documentation
```

## Installation

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node package manager)

### Setup
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/xsd-editor-app.git
   cd xsd-editor-app
   ```

2. Install dependencies for the client:
   ```
   cd client
   npm install
   ```

3. Install dependencies for the server:
   ```
   cd ../server
   npm install
   ```

## Running the Application
1. Start the backend server:
   ```
   cd server
   npm start
   ```

2. Start the frontend application:
   ```
   cd ../client
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000` to access the application.

## Usage

### Basic Operations
- Use the file uploader to upload an XSD file.
- Explore the parsed schema in the tree view.
- Edit types, elements, and attributes as needed.
- Save or download the modified XSD file.

### Search Functionality
The application includes powerful search capabilities to quickly locate schema components:

1. **Global Search**: Use the dedicated "Search" tab for comprehensive search across all schema components
2. **Integrated Search**: Access search directly from the Schema Tree view
3. **Smart Filtering**: Filter results by component type (elements, simple types, complex types, attributes)
4. **Intelligent Matching**: Search by name, type, documentation, enumeration values, or patterns
5. **Relevance Ranking**: Results are ranked by relevance with exact matches prioritized
6. **Direct Navigation**: Click any search result to immediately navigate to the appropriate editor

### Combined Element and Simple Type Editing
The application now supports unified editing of elements and their associated simple types:

1. **Upload your XSD file** - Try the provided `TEST.xsd` for examples
2. **Navigate to "Elements Tree Editor"** tab
3. **Select an element** that references a custom simple type (e.g., `MsgId` with type `Max35Text`)
4. **Edit element properties** - name, type reference, occurrences, documentation
5. **Edit simple type restrictions** - click "Edit Type Restrictions" to modify:
   - Pattern constraints (regex patterns)
   - Enumerations (allowed values)
   - Length restrictions (min/max/exact length)
   - Numeric constraints (fraction digits, total digits)
   - Value ranges (min/max inclusive/exclusive)
   - Whitespace handling (preserve/replace/collapse)
6. **Save Options**:
   - **Update Type**: Modify the existing simple type (affects all elements using this type)
   - **Save as New Type**: Create a duplicate with modifications and link only the current element to it

### Key Benefits
- **Single Interface**: Edit both element and type properties without switching views
- **Smart Detection**: Automatically identifies editable simple types
- **Visual Feedback**: See all applied restrictions at a glance
- **Validation**: Real-time conflict detection with helpful warnings
- **Type-Aware**: Only shows relevant restrictions for each data type
- **Flexible Editing**: Choose between updating existing types or creating new ones
- **Powerful Search**: Quickly find any component in complex schemas

### Detailed Documentation
- **Combined Editing**: [COMBINED_ELEMENT_SIMPLE_TYPE_EDITING.md](COMBINED_ELEMENT_SIMPLE_TYPE_EDITING.md)
- **Search Functionality**: [SEARCH_FUNCTIONALITY.md](SEARCH_FUNCTIONALITY.md)
- **Element Tree Integration**: [ELEMENTS_TREE_INTEGRATION.md](ELEMENTS_TREE_INTEGRATION.md)

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.