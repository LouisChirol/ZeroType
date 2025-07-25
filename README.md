# 🎤 ZeroType - Speech to Text Chrome Extension

**Transform any text input with your voice using Mistral's advanced speech-to-text AI**

ZeroType lets you fill any textbox on any website using speech instead of typing. Perfect for long emails, forms, documents, or any text input where typing would be slower or inconvenient.

## ✨ Features

- 🎯 **Universal Text Input**: Works on any website's text fields, textareas, and contentEditable elements
- 🎤 **High-Quality Transcription**: Powered by Mistral's Voxtral AI for accurate speech recognition
- ⚡ **Instant Shortcuts**: Quick keyboard shortcut (`Ctrl+Space`) to start/stop recording
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
- **Windows/Linux**: `Ctrl+Space`
- **Mac**: `Cmd+Space`

### Supported Input Types
- Regular text inputs (`<input type="text">`)
- Email inputs (`<input type="email">`)
- Search fields (`<input type="search">`)
- Textareas (`<textarea>`)
- Content-editable elements (`contenteditable="true"`)
- Most rich text editors (Gmail, Google Docs, Notion, etc.)

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

## 🔧 Technical Details

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
- Verify the key format starts with `mr-` or `mistral`

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
- Some complex web apps may require clicking the field after transcription
- Try refreshing the page if the content script isn't working

### Getting Help
- Check the popup interface for status messages
- Review the browser console for error details
- Test your API key using the "Test API Key" button in settings

---

**Made with ❤️ for productivity enthusiasts who prefer speaking over typing!**
