# Local Translator (Improved Version)

A Chrome extension that provides on-device, privacy-focused translation using Chrome's built-in Translator API. Translate web pages instantly without sending data to external servers.

## 🎉 本版本改进 / Improvements in This Version

> **原项目**: [kaichen/local-translator](https://github.com/kaichen/local-translator)

### 🐛 修复的问题 / Fixed Issues
- **修复翻译内容消失问题**: 解决了翻译整个页面后翻译内容快速消失的问题
- **提升翻译稳定性**: 改进了DOM监听机制，避免翻译过程中的无限循环
- **增强用户体验**: 翻译内容现在能够稳定显示，不会意外消失

### 🔧 技术改进 / Technical Improvements
- 改进MutationObserver过滤逻辑，避免翻译内容触发重新扫描
- 添加翻译状态标记（`data-translating`, `data-translation-stable`）
- 增加2秒延迟机制，给翻译过程足够时间完成
- 优化DOM变化检测，忽略翻译相关的元素变化

---

## Features

- **🔒 Privacy-First**: All translations happen locally on your device
- **⚡ Instant Translation**: No network latency, translations appear immediately
- **🎯 Flexible Translation Modes**:
  - Translate entire pages with one click
  - Selectively translate paragraphs with Alt/Option + Click
- **🎨 Customizable Display**:
  - Overlay mode: Shows translation below original text
  - Replace mode: Replaces original text with translation
- **💾 Persistent Settings**: Your preferences are saved automatically
- **🚀 Auto-Enable**: Translation activates automatically based on your saved preferences

## Requirements

- Chrome version 138 or higher (desktop only)
- Experimental Translation API enabled in Chrome flags

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/ponyfly6/local-translator.git
   cd local-translator
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Build the extension:
   ```bash
   bun run build
   ```

4. Load in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `.output/chrome-mv3` directory

### Enable Chrome Translator API

1. Navigate to `chrome://flags` in Chrome
2. Search for "translation api"
3. Enable **"Experimental Translation API"**
4. Click "Relaunch" to restart Chrome

## Usage

### Translation Methods

**Translate All Content**
- Click the extension icon in your toolbar
- Click "Translate All Content" button
- The entire page will be translated

**Translate Specific Paragraphs**
- Hold **Option** (Mac) or **Alt** (Windows/Linux)
- Click on any text element
- Click again (with modifier key) to remove translation

### Settings

All settings are automatically saved and persist across sessions:

- **Translation Toggle**: Enable/disable translation globally
- **Display Mode**: 
  - Overlay: Shows translation below original text
  - Replace: Replaces original text with translation
- **Text Style**:
  - Fuzzy: Slightly blurred translation text
  - Dashed Line: Translation with a dashed border

## Development

### Project Structure

```
local-translator/
├── entrypoints/          # Extension entry points
│   ├── background.ts     # Service worker
│   ├── content.ts        # Content script
│   └── popup/           # Extension popup UI
├── lib/                 # Shared utilities
│   ├── dom-translator.ts # Core translation logic
│   └── storage.ts       # Settings persistence
├── wxt.config.ts        # WXT configuration
└── package.json         # Dependencies
```

### Development Commands

```bash
# Install dependencies
bun install

# Start development server with hot reload
bun run dev

# Build for production
bun run build

# Type check
bun run compile

# Package as zip
bun run zip
```

### Technologies

- **[WXT](https://wxt.dev/)**: Modern web extension framework
- **[React](https://react.dev/)**: UI components for popup
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first styling
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe JavaScript
- **[Bun](https://bun.sh/)**: Fast JavaScript runtime and package manager

## How It Works

1. **Chrome Translator API**: Uses Chrome's built-in translation engine for on-device processing
2. **DOM Manipulation**: Intelligently parses and translates text while preserving page structure
3. **Smart Selection**: Automatically identifies translatable content while preserving code, links, and media
4. **Lazy Loading**: Only translates visible content for optimal performance

## Privacy

This extension prioritizes your privacy:
- ✅ All translations happen locally on your device
- ✅ No data is sent to external servers
- ✅ No tracking or analytics
- ✅ No account or API keys required
- ✅ Open source and auditable

## Supported Languages

Currently supports English to Simplified Chinese translation. The Chrome Translator API will expand language support in future updates.

## Troubleshooting

### "Translator Not Available"
- Ensure Chrome version is 138 or higher
- Enable the Experimental Translation API in `chrome://flags`
- Restart Chrome after enabling the flag

### Translation Not Working
- Check that the extension is enabled in the popup
- Try clicking "Translate All Content" button
- For selective translation, ensure you're holding Alt/Option while clicking

### Performance Issues
- The first translation may take longer as Chrome downloads language models
- Subsequent translations will be faster
- Large pages may take a moment to fully translate

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Chrome team for the Translator API
- WXT framework for modern extension development
- The open source community for inspiration and tools

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the [setup guide](SETUP.md) for detailed configuration

---

Built with ❤️ for privacy-conscious users who want fast, local translations.