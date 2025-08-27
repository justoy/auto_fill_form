# LLM Autofill Extension

A powerful Chrome extension that uses Large Language Models to automatically fill web forms with intelligently organized profile data. Features multiple profile management, categorized data organization, and seamless form detection for enhanced productivity.

## What's New 🚀

- **📂 Profile Categories**: Organize your data into logical groups (Personal, Address, Passport, etc.)
- **👥 Multiple Profiles**: Create separate profiles for work, personal, travel, and more
- **🎛️ Simplified Field Management**: Just enter field names - keys are auto-generated
- **🔄 Smart Profile Switching**: Easy dropdown to switch between different contexts
- **🏗️ Enhanced Architecture**: Improved data structure with backward compatibility

## Features

- 🤖 **LLM-Powered Field Mapping**: Uses OpenAI's GPT models to understand form fields
- 🔒 **Privacy-First**: All personal data stays local, only form structure is sent to LLM
- 📝 **Form Detection**: Automatically detects both `<form>` elements and form-like containers
- ⚡ **One-Click Filling**: Simple button injection for easy form completion
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

2. **Set up your profile:**
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
2. **Look for the "🤖 Auto Fill with LLM" button** that appears near forms
3. **Click the button** to automatically fill the form with your profile data
4. **Review and submit** the form as needed

## How It Works

1. **Form Detection**: The extension scans pages for `<form>` elements and form-like containers with multiple input fields
2. **Button Injection**: A "Auto Fill with LLM" button is added near each detected form
3. **LLM Analysis**: When clicked, the form's HTML structure (without values) is sent to OpenAI
4. **Field Mapping**: The LLM returns a mapping of form fields to your active profile's field keys
5. **Smart Filling**: The extension searches through your profile categories to find matching data and fills the form fields

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
- Use the dropdown in the extension popup to switch between profiles
- Each profile maintains its own data independently
- Perfect for different contexts (work vs personal vs travel)

## Privacy & Security

- ✅ **Personal data never leaves your device** - only stored in Chrome's local storage
- ✅ **Only form structure sent to LLM** - no personal values or user-entered data
- ✅ **Manual trigger only** - forms are filled only when you click the button
- ✅ **No background processing** - extension only activates when you use it

## Development

### Available Scripts

- `npm run build` - Build for production
- `npm run dev` - Build and watch for changes
- `npm run type-check` - TypeScript type checking

### Project Structure

```
src/
├── background.ts       # Service worker for LLM API calls and profile management
├── content.ts         # Content script for form detection and filling
├── popup.ts          # Popup UI for profile and settings management
├── types.ts          # TypeScript type definitions (profiles, categories, LLM config)
├── form-filler.ts    # Form filling logic with profile compatibility
└── llm/
    └── openai.ts     # OpenAI API integration
```

## Troubleshooting

### General Issues
- **Button not appearing**: Refresh the page after installing/updating the extension
- **Filling not working**: Check that your OpenAI API key is valid and you have credits
- **Console errors**: Check browser console for detailed error messages

### Profile Management Issues
- **Profile not saving**: Ensure you've clicked "Save Profile" after making changes
- **Fields not appearing in forms**: Check that field keys match what the LLM expects (field names are auto-converted to keys like "first_name", "email_address")
- **Multiple profiles not working**: Make sure you've selected the correct profile from the dropdown before filling forms
- **Can't delete profile**: You can't delete the only remaining profile - create a new one first

### Form Filling Issues
- **Form not filling completely**: The LLM may not recognize all field types - try adding custom field mappings in your profile
- **Wrong data in fields**: Check that your profile categories contain the correct information for the form type
- **Form structure changed**: Some dynamic forms may need page refresh to be detected properly

## Extending to Other LLM Providers

To add support for other LLM providers, create a new service file in `src/llm/` following the pattern of `openai.ts`.

## License

MIT License - see LICENSE file for details
