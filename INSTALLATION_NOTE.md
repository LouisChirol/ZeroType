# 🚀 Quick Installation Guide

## Icon Files
The extension is complete but needs PNG icons to work properly. I've created SVG versions that need to be converted:

### Option 1: Convert SVG to PNG (Recommended)
1. Use an online converter like [CloudConvert](https://cloudconvert.com/svg-to-png) or [Convertio](https://convertio.co/svg-png/)
2. Upload `icons/icon16.svg`, `icons/icon48.svg`, and `icons/icon128.svg`
3. Download as `icon16.png`, `icon48.png`, and `icon128.png`
4. Place them in the `icons/` folder

### Option 2: Install Pillow and Generate PNG
```bash
# If you have pip/pip3 available:
pip install Pillow
# or
pip3 install Pillow

# Then run:
python3 icons/create_icons.py
```

## Loading the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `ZeroType` folder
5. Configure your Mistral API key in the extension settings

## Ready to Use!
- Focus on any text input field
- Press `Ctrl+Space` (Windows/Linux) or `Cmd+Space` (Mac)
- Speak clearly
- Press the shortcut again to stop and transcribe

Enjoy hands-free typing! 🎤✨ 