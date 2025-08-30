# Seamless Form AutoFiller Chrome Extension

A powerful Chrome extension that uses Large Language Models to automatically detect and suggest completions for web forms with intelligently organized profile data. Features multiple profile management, categorized data organization, and seamless form detection with tab-key confirmation for enhanced productivity.

## What's New 🚀

- **⚡ Auto-Fill with Tab Confirmation**: Forms are automatically detected and filled with suggestions - press Tab to accept
- **🎛️ Enable/Disable Toggle**: Easy toggle in the Settings to turn auto-fill on/off
- **📂 Profile Categories**: Organize your data into logical groups (Personal, Address, Passport, etc.)
- **👥 Multiple Profiles**: Create separate profiles for work, personal, travel, and more
- **🎛️ Simplified Field Management**: Just enter field names - keys are auto-generated
- **🔄 Smart Profile Switching**: Easy dropdown to switch between different contexts
- **🏗️ Enhanced Architecture**: Improved data structure with backward compatibility

## Features

- 🤖 **LLM-Powered Field Mapping**: Uses LLM models to understand form fields
- 🔒 **Privacy-First**: All personal data stays local, only form structure is sent to LLM
- 📝 **Automatic Form Detection**: Automatically detects both `<form>` elements and form-like containers
- ⚡ **Auto-Fill with Tab Confirmation**: Forms are filled with suggestions automatically - press Tab to accept
- 🎛️ **Enable/Disable Toggle**: Easy toggle to turn auto-fill on/off as needed
- 📂 **Organized Profile Categories**: Fields grouped into logical categories (Personal, Address, Passport, etc.)
- 👥 **Multiple Profile Management**: Create and switch between different profiles for various use cases
- 🎛️ **Easy Field Management**: Add custom fields with simple name entry - field keys auto-generated
- 🏷️ **Smart Field Organization**: Auto-categorize and manage your profile data efficiently

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Build Instructions

1. **Clone and install dependencies:**
   ```bash
   cd form_auto_fill
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

3. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `form_auto_fill` directory

## Setup

1. **Configure OpenAI API:**
   - Click the extension icon in Chrome toolbar
   - Enter your OpenAI API key
   - Select your preferred model
   - Click "Save LLM Configuration"

2. **Enable Auto-Fill:**
   - Check the "Enable Auto-Fill" toggle in the General Settings section
   - The extension will automatically detect and suggest completions for forms

3. **Set up your profile:**
   - **Create a Profile**: Click "Create Profile" and give it a name (e.g., "Work", "Personal", "Travel")
   - **Organize Your Data**: Your profile comes with pre-organized categories:
     - **Personal Information**: Name, email, phone
     - **Address**: Complete address details
     - **Passport**: Passport number, nationality, issue details
   - **Add Custom Fields**: Click "+ Field" within any category and enter just the field name
   - **Add Custom Categories**: Create new categories for specific use cases
   - **Switch Profiles**: Use the dropdown to switch between different profiles
   - Click "Save Profile" to store your changes

## Usage

1. **Navigate to any web page with forms**
2. **Auto-fill suggestions appear automatically** in form fields as gray placeholder text
3. **Press Tab to accept** a suggestion and move to the next field
4. **Continue pressing Tab** to accept additional suggestions or type to override them
5. **Submit the form** when you're satisfied with the filled data

### Enable/Disable Auto-Fill

- **Enable**: Check the "Enable Auto-Fill" toggle in the extension settings
- **Disable**: Uncheck the toggle to stop automatic form detection
- **Quick Toggle**: Access the extension settings by clicking the extension icon in your browser toolbar

## How It Works

1. **Automatic Form Detection**: The extension continuously scans pages for `<form>` elements and form-like containers with multiple input fields
2. **LLM Analysis**: When a form is detected, its HTML structure (without values) is sent to OpenAI for analysis
3. **Field Mapping**: The LLM returns a mapping of form fields to your active profile's field keys
4. **Suggestion Display**: Matching profile data appears as gray placeholder text in form fields
5. **Tab Confirmation**: Press **Tab** to accept a suggestion, which fills the field and moves focus to the next input
6. **Smart Navigation**: The system automatically moves focus to the next relevant field after each acceptance

## Profile Management

The extension supports multiple profiles with organized categories for better data management:

### Creating Profiles
- Click "Create Profile" to make a new profile
- Give it a descriptive name (e.g., "Work", "Personal", "Travel")
- Each profile comes with pre-built categories

### Organizing Data
- **Personal Information**: Basic details like name, email, phone
- **Address**: Complete address information
- **Passport**: Travel document details
- **Custom Categories**: Create your own categories for specific needs

### Managing Fields
- Add fields by clicking "+ Field" within any category
- Simply enter the field name - the system auto-generates the internal field key
- Remove fields or categories as needed
- All changes are automatically saved

### Switching Profiles
- Use the dropdown in the extension settings to switch between profiles
- Each profile maintains its own data independently
- Perfect for different contexts (work vs personal vs travel)

### Export/Import Profiles
- Export: Click "Export" in Profile Management to download the active profile as JSON
- Import: Click "Import" and select a JSON file to create a new profile
- Supported formats:
  - Current format with categories and fields
  - Legacy flat key/value JSON (will be placed under an "Imported" category)
-
  The imported profile is saved as a new profile; you can rename it during import.

## Privacy & Security

- ✅ **Personal data never leaves your device** - only stored in Chrome's local storage
- ✅ **Only form structure sent to LLM** - no personal values or user-entered data
- ✅ **Enable/Disable control** - you have full control over when auto-fill is active
- ✅ **Tab confirmation required** - suggestions are shown but require explicit Tab confirmation to fill
- ✅ **Automatic processing** - only when enabled and forms are detected on pages you visit

## Development

### Project Structure

```
src/
├── background.ts       # Service worker for LLM API calls and profile management
├── content.ts          # Content script for form detection and filling
├── settings.ts         # Settings page UI for profile and configuration management
├── types.ts            # TypeScript type definitions (profiles, categories, LLM config)
├── form-filler.ts      # Form filling logic with profile compatibility
└── llm/
    └── openai.ts       # OpenAI API integration
```

## License

MIT License - see LICENSE file for details
