# Chrome Translator API Setup

## Requirements
- Chrome version 138 or higher (desktop only)
- Experimental Translation API enabled

## Enable the Translation API

1. **Open Chrome Flags**
   - Navigate to `chrome://flags` in your browser
   - Or use the "Open Chrome Flags" button in the extension popup

2. **Enable the API**
   - Search for "translation api" or "experimental translation"
   - Find **"Experimental Translation API"** 
   - Set it to **"Enabled"**

3. **Restart Chrome**
   - Click the "Relaunch" button that appears
   - Chrome will restart with the API enabled

4. **Verify Installation**
   - Open the extension popup
   - You should see the translation controls
   - If you still see "API not enabled", try refreshing the page

## Troubleshooting

### "Translator Not Available - API not enabled"
This means Chrome version is correct but the API is not enabled. Follow the steps above.

### "Translator Not Available - Chrome version < 138"
Update Chrome to version 138 or higher:
- Go to Chrome menu → Help → About Google Chrome
- Chrome will automatically check for updates

### Translation not working after enabling
1. Make sure you've restarted Chrome after enabling the flag
2. Refresh the page you want to translate
3. Click on the page once to activate the translator (required for first use)

### API Download
When you first use the translator, Chrome may need to download language models:
- This happens automatically in the background
- It may take a few moments on first use
- Subsequent translations will be faster

## Usage Tips

### Auto-Enable Translation
- Translation is **enabled by default** when you install the extension
- Your settings (enabled/disabled, display mode, text style) are **saved automatically**
- Settings persist across browser sessions and page reloads

### How to Translate

There are two ways to translate content:

1. **Translate All Content**
   - Click the extension popup icon
   - Click "Translate All Content" button
   - All text on the page will be translated

2. **Translate Specific Paragraphs**
   - Hold **Option** (Mac) / **Alt** (Windows/Linux)
   - Click on any paragraph, heading, or text block
   - The clicked element will be translated
   - Click again (with Option/Alt) to remove translation

### Translation Modes
- **Overlay**: Shows translation below original text
- **Replace**: Replaces original text with translation

### Text Styles
- **Fuzzy**: Slightly blurred translation text
- **Dashed Line**: Translation with a dashed border on top