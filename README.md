# LLM Autofill Extension

A Chrome extension that uses Large Language Models to automatically fill web forms by intelligently mapping form fields to your saved profile information.

## Features

- 🤖 **LLM-Powered Field Mapping**: Uses OpenAI's GPT models to understand form fields
- 🔒 **Privacy-First**: All personal data stays local, only form structure is sent to LLM
- 📝 **Form Detection**: Automatically detects both `<form>` elements and form-like containers
- ⚡ **One-Click Filling**: Simple button injection for easy form completion
- 🎛️ **Customizable Profile**: Manage your personal information with custom fields

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
   - Fill in your personal information in the profile section
   - Add custom fields as needed using the "Add Field" button
   - Click "Save Profile"

## Usage

1. **Navigate to any web page with forms**
2. **Look for the "🤖 Auto Fill with LLM" button** that appears near forms
3. **Click the button** to automatically fill the form with your profile data
4. **Review and submit** the form as needed

## How It Works

1. **Form Detection**: The extension scans pages for `<form>` elements and form-like containers with multiple input fields
2. **Button Injection**: A "Auto Fill with LLM" button is added near each detected form
3. **LLM Analysis**: When clicked, the form's HTML structure (without values) is sent to OpenAI
4. **Field Mapping**: The LLM returns a mapping of form fields to your profile keys
5. **Form Filling**: The extension fills the form fields with your saved profile data

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
├── background.ts       # Service worker for LLM API calls
├── content.ts         # Content script for form detection and filling
├── popup.ts          # Popup UI for settings management
├── types.ts          # TypeScript type definitions
└── llm/
    └── openai.ts     # OpenAI API integration
```

## Troubleshooting

- **Button not appearing**: Refresh the page after installing/updating the extension
- **Filling not working**: Check that your OpenAI API key is valid and you have credits
- **Console errors**: Check browser console for detailed error messages

## Extending to Other LLM Providers

To add support for other LLM providers, create a new service file in `src/llm/` following the pattern of `openai.ts`.

## License

MIT License - see LICENSE file for details
