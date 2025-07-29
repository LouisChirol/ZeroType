# 🎤 ZeroType - Speech to Text Chrome Extension

**Transform any text input with your voice using Mistral's advanced speech-to-text AI**

ZeroType lets you fill any textbox on any website using speech instead of typing. Perfect for long emails, forms, documents, messaging apps, or any text input where typing would be slower or inconvenient.

## ✨ Features

- 🎯 **Universal Text Input**: Works on any website's text fields, textareas, and contentEditable elements
- 🚀 **Modern App Compatible**: Enhanced support for messaging apps like WhatsApp Web, Facebook Messenger, Discord, Slack
- 🎤 **High-Quality Transcription**: Powered by Mistral's Voxtral AI for accurate speech recognition
- ⚡ **Customizable Shortcuts**: Set your own keyboard shortcut - defaults to `Ctrl+Space`
- 🔧 **Smart Shortcut System**: Seamlessly switches between default and custom shortcuts
- 🧠 **Smart Text Insertion**: Multiple insertion strategies ensure compatibility with React, Vue, Angular and other frameworks
- 🔒 **Privacy-First**: Your API key is stored locally, audio processing happens via secure API calls
- 📊 **Usage Tracking**: Monitor your daily transcription usage
- 🎨 **Modern UI**: Clean, intuitive interface with visual recording feedback

## 🚀 Installation

### Method 1: Load as Unpacked Extension (Recommended for Development)

1. **Download the Extension**
   ```bash
   git clone <repository-url>
   cd ZeroType
   ```

2. **Generate Icons** (if not already present)
   ```bash
   pip install Pillow
   python3 icons/create_icons.py
   ```

3. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `ZeroType` folder

4. **Configure API Key**
   - Click the ZeroType extension icon in your browser toolbar
   - Click "Settings" or right-click the extension icon → "Options"
   - Enter your Mistral API key (get one from [Mistral Console](https://console.mistral.ai/))
   - Click "Save Settings" and optionally "Test API Key"

## 🎯 How to Use

### Quick Start
1. **Focus on any text input** - Click on any text field, textarea, or editable content
2. **Start recording** - Press `Ctrl+Space` (or `Cmd+Space` on Mac)
3. **Speak clearly** - The recording overlay will appear with visual feedback
4. **Stop and transcribe** - Press the shortcut again or click "Stop Recording"
5. **Watch the magic** - Your speech is transcribed and inserted into the text field!

### Keyboard Shortcuts

#### **Default Shortcut**
- `Ctrl+Space` (All platforms: Windows/Linux/Mac)

#### **Custom Shortcuts** 
- **Configure**: Settings → Keyboard Shortcuts → Click input field → Press desired keys
- **Examples**: `Alt+R`, `F2`, `Ctrl+Shift+V`, `Cmd+Option+Space`
- **Safety**: Requires modifier keys (Ctrl/Alt/Shift) or function keys (F1-F12)
- **Smart Switching**: Only one shortcut active at a time - no conflicts!

#### **Alternative Method**
- Use Chrome's native shortcut manager: Settings → Extensions → Keyboard shortcuts
- Or click "Chrome's Extension Shortcuts" link in ZeroType settings

### Supported Input Types & Applications

#### ✅ **Fully Compatible Applications**
- **Messaging Apps**: WhatsApp Web, Facebook Messenger, Discord, Slack, Telegram Web
- **Email Clients**: Gmail (compose), Outlook Web, Yahoo Mail
- **Productivity Tools**: Google Docs, Notion, Trello, Asana, Monday.com
- **Social Media**: Twitter, LinkedIn, Reddit, Facebook posts
- **Development Tools**: GitHub comments/issues, GitLab, CodePen, JSFiddle
- **General Websites**: Pastebin, Google Translate, forms, search boxes

#### 🔧 **Input Field Types**
- Regular text inputs (`<input type="text">`)
- Email inputs (`<input type="email">`) 
- Search fields (`<input type="search">`)
- Textareas (`<textarea>`)
- Content-editable elements (`contenteditable="true"`)
- Rich text editors with complex DOM structures
- React/Vue/Angular component-based inputs
- ARIA textbox elements (`role="textbox"`)

## ⚙️ Configuration

### Getting a Mistral API Key
1. Go to [Mistral Console](https://console.mistral.ai/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in ZeroType settings

### Extension Settings
Access settings through:
- Extension popup → "Settings" button
- Right-click extension icon → "Options"
- Chrome Extensions page → ZeroType → "Extension options"

### Customizing Keyboard Shortcuts
1. **Open Settings** → Click "Settings" in popup or right-click extension icon
2. **Find Shortcuts Section** → Scroll to "Keyboard Shortcuts"
3. **Set Custom Shortcut**:
   - Click the shortcut input field
   - Press your desired key combination (e.g., `Alt+R`, `F2`)
   - System validates and shows success/error message
4. **Save Settings** → Click "Save Settings" button
5. **Instant Activation** → New shortcut works immediately across all tabs

**Reset to Default**: Click the 🔄 reset button to return to `Ctrl+Space`

## 🔧 Technical Details

### Advanced Text Insertion
ZeroType uses multiple intelligent strategies to ensure compatibility across different web applications:

1. **Document.execCommand**: For basic compatibility with most text editors
2. **Manual Range Manipulation**: For complex contentEditable elements like messaging apps
3. **React-Compatible Value Setting**: Direct property manipulation for framework-based inputs
4. **Smart Event Dispatching**: Comprehensive event simulation (input, change, keydown, keyup)
5. **Fallback Detection**: Automatic discovery of alternative input elements when primary detection fails

### API Integration
- **Model**: `voxtral-mini-2507` (Mistral's speech-to-text model)
- **Audio Format**: WebM/Opus (automatically handled)
- **Sample Rate**: 16kHz optimized for speech
- **Processing**: Real-time transcription with noise suppression

### Privacy & Security
- API keys stored locally using Chrome's secure storage
- Audio data sent directly to Mistral API (not stored locally)
- No persistent audio storage
- Usage statistics stored locally only

### Browser Compatibility
- **Supported**: Chrome 88+, Edge 88+, Opera 74+
- **Required Permissions**:
  - `storage`: For API key and settings storage
  - `activeTab`: For interacting with current webpage
  - `scripting`: For content script injection
  - Microphone access (requested when first recording)

## 🛠️ Development

### File Structure
```
ZeroType/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (API calls)
├── content.js            # Content script (page interaction)
├── content.css           # Content script styles
├── popup.html           # Extension popup interface
├── popup.js             # Popup functionality
├── popup.css            # Popup styles
├── options.html         # Settings page
├── options.js           # Settings functionality
├── options.css          # Settings styles
├── icons/               # Extension icons
└── README.md           # This file
```

### Key Components
- **Background Script**: Handles Mistral API communication and keyboard shortcuts
- **Content Script**: Manages audio recording, UI overlay, and text insertion
- **Options Page**: API key configuration and usage instructions
- **Popup Interface**: Quick status and controls

### Building from Source
```bash
# Clone the repository
git clone <repository-url>
cd ZeroType

# Generate icons (requires Python + Pillow)
python3 icons/create_icons.py

# Load in Chrome as unpacked extension
# (See installation instructions above)
```

## ⚠️ Privacy & Data Disclaimer

**Important**: ZeroType uses external AI services (Mistral AI) for speech transcription. Please be aware:

- **No Personal Data**: Avoid dictating sensitive personal information (passwords, social security numbers, private addresses, etc.)
- **External Processing**: Your audio is processed by Mistral AI's servers - we have no control over their data handling
- **Review Mistral's Terms**: Please review [Mistral AI's Terms of Service](https://mistral.ai/terms/) and [Privacy Policy](https://mistral.ai/privacy/) before use
- **Use Responsibly**: This extension is provided as-is with no warranty regarding data privacy or security

**We disclaim all responsibility for any data shared through this extension's transcription service.**

## ☕ Support ZeroType

If ZeroType has boosted your productivity, consider buying us a coffee! ☕

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Donate-orange.svg?style=flat-square&logo=buy-me-a-coffee)](https://coff.ee/zerotype)

Your support helps us maintain and improve ZeroType for everyone! 🚀

## 🤝 Contributing

We welcome contributions! Please feel free to:
- Report bugs or request features via GitHub Issues
- Submit pull requests for improvements
- Share feedback and usage tips

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**"API key not configured"**
- Make sure you've entered your Mistral API key in Settings

**"Failed to start recording"**
- Grant microphone permissions when prompted
- Check that you're on a regular webpage (not chrome:// pages)
- Ensure you've focused on a text input field first

**"Transcription failed"**
- Check your internet connection
- Verify your Mistral API key is valid and has credits
- Try speaking more clearly or in a quieter environment

**Text not inserting properly**
- Make sure the text field is focused before recording
- For messaging apps (WhatsApp, Messenger), click directly in the message input area
- Try refreshing the page if the content script isn't responding
- Some apps may require clicking after transcription to trigger send buttons

**Extension not working on specific websites**
- Some sites with strict Content Security Policies may block extensions
- Corporate/school networks might restrict extension functionality  
- Try disabling other extensions temporarily to check for conflicts

**Keyboard shortcut not working**
- Make sure the shortcut isn't conflicting with browser/system shortcuts
- Try a different combination (e.g., `Alt+R` instead of `Ctrl+R`)
- Check if another extension is using the same shortcut
- Reset to default (`Ctrl+Space`) if having issues

**Shortcut works but shows wrong key in interface**
- Refresh the page after changing shortcuts in settings
- The popup and recording overlay should update automatically
- If not, try closing and reopening the popup

### Modern Web App Tips

**WhatsApp Web / Messenger**
- Click directly in the message compose area before recording
- The extension now handles these apps' complex text insertion automatically

**Discord / Slack**
- Focus the message input channel before starting recording
- Works with both main channels and DMs

**Google Docs / Notion**
- Click where you want to insert text in the document
- Works with rich text formatting preserved

### Getting Help
- Check the popup interface for status messages
- Review the browser console for error details (F12 → Console)
- Test your API key using the "Test API Key" button in settings
- Ensure microphone permissions are granted for the extension

---

**Made with ❤️ for productivity enthusiasts who prefer speaking over typing!**

*Now with enhanced support for modern messaging and productivity applications.*
