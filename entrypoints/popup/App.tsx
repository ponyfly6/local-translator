import { useState, useEffect } from 'react';
import { browser } from 'wxt/browser';
import { storage, StoredSettings } from '../../lib/storage';
import './App.css';

interface TabInfo {
  id: number;
  url: string;
  title: string;
}

interface TranslationSettings {
  enabled: boolean;
  displayMode: 'overlay' | 'replace';
  textStyle: 'fuzzy' | 'dashline';
}

interface TranslatorCheckResponse {
  available: boolean;
  chromeVersionSupported?: boolean;
}

function App() {
  const isMac = navigator.platform.toLowerCase().includes('mac');
  const modifierKey = isMac ? 'Option' : 'Alt';
  const [currentTab, setCurrentTab] = useState<TabInfo | null>(null);
  const [settings, setSettings] = useState<TranslationSettings>({
    enabled: true, // Default to enabled
    displayMode: 'overlay',
    textStyle: 'fuzzy',
  });
  const [isTranslatorAvailable, setIsTranslatorAvailable] = useState(false);
  const [chromeVersionSupported, setChromeVersionSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load settings from storage first
    storage.getSettings().then((storedSettings) => {
      setSettings(storedSettings);
    });

    // Listen for storage changes
    storage.onChanged((newSettings) => {
      setSettings(newSettings);
    });

    // Get current tab info
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0]) {
        setCurrentTab({
          id: tabs[0].id!,
          url: tabs[0].url || '',
          title: tabs[0].title || '',
        });
        
        // Check if translator is available
        browser.tabs.sendMessage(tabs[0].id!, { action: 'check_translator' })
          .then((response: TranslatorCheckResponse) => {
            setIsTranslatorAvailable(response?.available || false);
            setChromeVersionSupported(response?.chromeVersionSupported !== false);
          })
          .catch((error) => {
            console.error('Error checking translator:', error);
            setIsTranslatorAvailable(false);
            setChromeVersionSupported(true); // Assume true if can't check
          });

        // Get current settings
        browser.tabs.sendMessage(tabs[0].id!, { action: 'get_settings' })
          .then((response: any) => {
            if (response?.settings) {
              setSettings(response.settings);
            }
          })
          .catch((error) => {
            console.error('Error getting settings:', error);
          });
      }
    });
  }, []);

  const sendMessage = (action: string, data?: any) => {
    if (!currentTab) return;
    
    browser.tabs.sendMessage(currentTab.id, { action, ...data })
      .then((response: any) => {
        console.log('Message sent successfully:', action, response);
      })
      .catch((error) => {
        console.error('Error sending message:', error);
      });
  };

  const toggleTranslation = () => {
    const newEnabled = !settings.enabled;
    const newSettings = { ...settings, enabled: newEnabled };
    setSettings(newSettings);
    
    // Save to storage
    storage.updateSetting('enabled', newEnabled);
    
    if (currentTab) {
      browser.tabs.sendMessage(currentTab.id, { 
        action: newEnabled ? 'enable_translation' : 'disable_translation' 
      })
      .then((response: any) => {
        if (response?.message) {
          setStatusMessage(response.message);
          setTimeout(() => setStatusMessage(null), 5000);
        }
      })
      .catch((error) => {
        console.error('Error toggling translation:', error);
      });
    }
  };

  const toggleTextStyle = () => {
    const newStyle = settings.textStyle === 'fuzzy' ? 'dashline' : 'fuzzy';
    setSettings({ ...settings, textStyle: newStyle });
    storage.updateSetting('textStyle', newStyle);
    sendMessage('toggle_style');
  };

  const changeDisplayMode = (mode: 'overlay' | 'replace') => {
    setSettings({ ...settings, displayMode: mode });
    storage.updateSetting('displayMode', mode);
    sendMessage('change_display_mode', { mode });
  };

  const translateAll = () => {
    if (!currentTab) return;
    
    browser.tabs.sendMessage(currentTab.id, { action: 'translate_all' })
      .then((response: any) => {
        console.log('Translate all sent successfully:', response);
        setStatusMessage('Translating all content...');
        setTimeout(() => setStatusMessage(null), 3000);
      })
      .catch((error) => {
        console.error('Error translating all:', error);
      });
  };

  if (!isTranslatorAvailable) {
    return (
      <div className="w-96 p-6 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Translator Not Available</h2>
            <p className="text-sm text-gray-600">
              {!chromeVersionSupported ? 'Chrome version < 138' : 'API not enabled'}
            </p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            {!chromeVersionSupported 
              ? 'Your Chrome version is below 138. Please update Chrome to version 138 or higher to use the Translator API.'
              : 'The Chrome Translator API needs to be enabled:'}
          </p>
          {chromeVersionSupported && (
            <>
              <ol className="mt-3 text-sm text-gray-600 list-decimal list-inside space-y-2">
                <li>Open <code className="bg-gray-200 px-1 rounded">chrome://flags</code> in a new tab</li>
                <li>Search for "translation api"</li>
                <li>Enable <strong>"Experimental Translation API"</strong></li>
                <li>Click "Relaunch" to restart Chrome</li>
                <li>Return to this page and reload</li>
              </ol>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    browser.tabs.create({ url: 'chrome://flags/#enable-experimental-translation-api' });
                  }}
                  className="flex-1 bg-blue-500 text-white text-sm px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Open Chrome Flags
                </button>
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 text-sm px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          Local Translator
        </h1>
        <p className="text-sm text-blue-50 mt-1">English → 中文简体</p>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className="px-4 pt-2">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-3 py-2">
            {statusMessage}
          </div>
        </div>
      )}

      {/* Main Controls */}
      <div className="p-4 space-y-4">
        {/* Toggle Button */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <div>
            <p className="font-medium text-gray-900">Translation</p>
            <p className="text-sm text-gray-600">Enable page translation</p>
          </div>
          <button
            onClick={toggleTranslation}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.enabled ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                settings.enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {settings.enabled && (
          <>
            {/* Display Mode */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-3">Display Mode</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => changeDisplayMode('overlay')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.displayMode === 'overlay'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Overlay
                </button>
                <button
                  onClick={() => changeDisplayMode('replace')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.displayMode === 'replace'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Replace
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {settings.displayMode === 'overlay' 
                  ? 'Show translation below original text'
                  : 'Replace original text with translation'}
              </p>
            </div>

            {/* Text Style */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-3">Text Style</p>
              <button
                onClick={toggleTextStyle}
                className="w-full px-4 py-2 bg-white hover:bg-gray-100 rounded-lg text-sm transition-colors flex items-center justify-between border border-gray-300"
              >
                <span className="text-gray-700">Current: {settings.textStyle === 'fuzzy' ? 'Fuzzy' : 'Dashed Line'}</span>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Translation Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-3">Translation Actions</p>
              <div className="space-y-2">
                <button
                  onClick={translateAll}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span>Translate All Content</span>
                </button>
                <div className="text-xs text-gray-600 mt-2 space-y-1">
                  <p>• Click button above to translate all content</p>
                  <p>• Hold {modifierKey} and click to translate paragraphs</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Usage Instructions */}
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="font-medium text-gray-900 mb-2 text-sm">How to Use</p>
          <div className="space-y-1 text-xs text-gray-700">
            <p>• Enable translation with the toggle above</p>
            <p>• Click "Translate All Content" for full page</p>
            <p>• Hold {modifierKey} and click any paragraph to translate it</p>
            <p>• Click translated text again to remove translation</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        <p className="text-xs text-gray-600 text-center">
          Powered by Chrome Translator API
        </p>
      </div>
    </div>
  );
}

export default App;