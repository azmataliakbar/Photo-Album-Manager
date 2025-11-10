# Photo Album Manager

A comprehensive web-based application for organizing, managing, and viewing photo albums with advanced features for import, export, and image manipulation.

## Features

### Core Functionality
- **Album Management**: Create, view, and organize photo albums with custom titles and descriptions
- **Photo Organization**: Add photos to albums with custom captions
- **Search Functionality**: Search albums by title, date, or description
- **Responsive Design**: Optimized for all screen sizes from 270px to desktop

### Photo Management
- **Add Photos to Albums**: Select from available assets or add custom photos
- **Upload Images**: Direct file upload with drag & drop support
- **Import from Folder**: Bulk import images from your computer
- **URL Support**: Add images via direct URLs (including image hosting services)
- **Auto-Detection**: Automatically scans assets folder for new images

### Selection & Manipulation
- **Image Selection**: Toggle selection mode to select multiple images
- **Delete Images**: Remove selected images from albums
- **Download Images**: Download selected images to your computer
- **Organize Images**: Automatically sort images into appropriate albums

### Data Management
- **Import Functionality**: Import album data in JSON format with "JSON Format Only" label
- **Export Functionality**: Export album data in JSON format with "JSON Format Only" label
- **Data Persistence**: Uses SQL.js with localStorage fallback for data storage
- **Reset Data**: Clear all albums and photos with confirmation

### User Experience
- **Breadcrumbs**: Navigate easily between albums and views
- **Toasts & Messages**: Visual feedback for user actions
- **Loading States**: Visual indicators during operations
- **Accessibility**: Proper labels and keyboard navigation support

## Technical Implementation

### Architecture
- **Database**: SQL.js for WebSQL functionality with localStorage fallback
- **Frontend**: Pure HTML/CSS/JavaScript (no external frameworks)
- **Responsive Design**: Mobile-first approach with multiple breakpoints
- **Modular Code**: Class-based organization (DatabaseManager, AlbumManager, AssetScanner, PhotoAlbumApp)

### Key Classes
- **DatabaseManager**: Handles database operations with fallback to localStorage
- **AlbumManager**: Manages album and photo operations
- **AssetScanner**: Scans and discovers images in assets folder
- **PhotoAlbumApp**: Main application controller

### UI Components
- **Header**: With import/export, create album, and scan controls
- **Album Viewer**: With add/upload/import/download/delete controls
- **Modal Dialogs**: For adding photos and file operations
- **Responsive Grids**: For album and photo display

### Responsive Design
- **Desktop**: Full feature set with text labels
- **Tablet**: Optimized controls with appropriate spacing
- **Mobile**: Icon-only buttons with tooltips for small screens (480px and below)
- **Very Small**: Minimal interface elements (350px and below)

## Setup Instructions

1. Clone or download the project files
2. Open `index.html` in a modern web browser
3. No server required - works as a standalone HTML application
4. For asset scanning, place images in the `assets/` folder

## Best Practices Implemented

- **Accessibility**: Proper labels, ARIA attributes, and keyboard support
- **Performance**: Optimized rendering and minimal DOM operations
- **Security**: Proper validation and sanitization of inputs
- **Maintainability**: Clean, well-commented code with modular architecture
- **Responsive Design**: Works on all device sizes with appropriate layouts

## How to Recreate This Project

### 1. Core Structure
- Create an HTML file with a responsive layout
- Implement separate sections for albums view and photo viewer
- Add navigation with breadcrumbs and back buttons
- Create modal dialogs for operations like adding photos

### 2. Database Layer
- Implement DatabaseManager class with SQL.js integration
- Add localStorage fallback for compatibility
- Create tables for albums, photos, and app state
- Implement methods for CRUD operations

### 3. Album Management
- Create AlbumManager class to handle album operations
- Implement methods for creating, reading, and organizing albums
- Add photo management capabilities linked to albums
- Include search and filtering functionality

### 4. Asset Handling
- Implement AssetScanner class to discover images
- Create methods to scan assets folder for available images
- Handle image validation and loading
- Support for various image formats

### 5. User Interface
- Design responsive CSS with mobile-first approach
- Create visual indicators for selection modes
- Implement drag and drop functionality
- Add proper button states and feedback

### 6. Responsive Design
- Use CSS media queries for different screen sizes
- Implement flexible grid layouts
- Adjust font sizes and spacing for small screens
- Create icon-only buttons for very small screens

### 7. Feature Implementation
- Import/export functionality with JSON format
- Image selection and bulk operations
- Direct file upload with drag & drop
- URL validation for external images

### 8. Error Handling
- Implement try/catch blocks for asynchronous operations
- Add user feedback for errors and successes
- Handle missing images gracefully
- Validate inputs before processing

### 9. Performance Optimization
- Use document fragments for efficient DOM updates
- Implement loading indicators
- Optimize image loading and display
- Reduce unnecessary re-renders

### 10. Testing & Validation
- Test on multiple screen sizes
- Verify database operations work correctly
- Validate all user interactions
- Ensure accessibility standards are met

## Key Features Summary

- 📁 **Import/Export**: JSON format with clear labeling
- 📷 **Photo Management**: Add, upload, organize photos
- 🗑️ **Delete Functionality**: Select and remove images
- ⬇️ **Download**: Selected images to local computer
- ☑️ **Selection Mode**: Toggle for bulk operations
- 🔍 **Search**: Find albums by criteria
- 📱 **Responsive**: Works on all device sizes
- 🏷️ **Accessibility**: Proper labeling and navigation
- 💾 **Persistent Storage**: Database with fallback
- 🎨 **Modern UI**: Clean, intuitive interface

This application demonstrates modern web development practices with a focus on usability, accessibility, and responsive design.