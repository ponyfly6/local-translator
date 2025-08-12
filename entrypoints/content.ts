export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('[LocalTranslator] Content script main() start');
    if (!('Translator' in self)) {
      console.warn('Translator API not available: requires Chrome ≥138 desktop');
      return;
    } else {
      console.log('[LocalTranslator] Translator API detected');
    }

    let translatorPromise: Promise<any> | null = null;
    let tooltipElement: HTMLDivElement | null = null;
    let activeRequestId = 0;

    const getTranslator = () => {
      if (!translatorPromise) {
        console.log('[LocalTranslator] Creating Translator instance', {
          sourceLanguage: 'en',
          targetLanguage: 'zh-Hans',
        });
        translatorPromise = (self as any)
          .Translator.create({
            sourceLanguage: 'en',
            targetLanguage: 'zh-Hans',
          })
          .then((t: any) => {
            console.log('[LocalTranslator] Translator instance ready');
            return t;
          })
          .catch((err: unknown) => {
            console.warn('[LocalTranslator] Translator.create() failed', err);
            translatorPromise = null;
            throw err;
          });
      } else {
        console.log('[LocalTranslator] Reusing existing Translator instance');
      }
      return translatorPromise;
    };

    const createTooltip = () => {
      const tooltip = document.createElement('div');
      tooltip.id = 'translation-tooltip';
      tooltip.style.cssText = `
        position: absolute;
        background: #1a1a1a;
        color: #fff;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        line-height: 1.5;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 999999;
        display: none;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;
      document.body.appendChild(tooltip);
      return tooltip;
    };

    const showTranslation = (text: string, x: number, y: number) => {
      if (!tooltipElement) {
        tooltipElement = createTooltip();
      }
      
      tooltipElement.textContent = text;
      tooltipElement.style.display = 'block';
      
      const rect = tooltipElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let left = x;
      let top = y + 10;
      
      if (left + rect.width > viewportWidth) {
        left = viewportWidth - rect.width - 10;
      }
      
      if (top + rect.height > viewportHeight) {
        top = y - rect.height - 10;
      }
      
      tooltipElement.style.left = `${left}px`;
      tooltipElement.style.top = `${top}px`;
      console.log('[LocalTranslator] Show translation tooltip', {
        preview: text.slice(0, 80),
        length: text.length,
        left,
        top,
      });
    };

    const hideTranslation = () => {
      if (tooltipElement) {
        tooltipElement.style.display = 'none';
      }
      // Avoid spamming on scroll; keep this low-verbosity.
      console.log('[LocalTranslator] Hide translation tooltip');
    };

    let selectionTimeout: ReturnType<typeof setTimeout> | null = null;

    const isInEditable = (node: Node | null): boolean => {
      let el: Node | null = node;
      while (el) {
        if (el instanceof Element) {
          const tag = el.tagName;
          if (
            (el instanceof HTMLElement && el.isContentEditable) ||
            tag === 'INPUT' ||
            tag === 'TEXTAREA' ||
            el.getAttribute('role') === 'textbox'
          ) {
            return true;
          }
        }
        el = el.parentNode;
      }
      return false;
    };

    document.addEventListener('mouseup', async () => {
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }

      selectionTimeout = setTimeout(async () => {
        const selection = window.getSelection();
        const text = (selection?.toString() || '').trim();
        console.log('[LocalTranslator] Mouseup selection', {
          length: text.length,
          preview: text.slice(0, 80),
        });
        
        if (!text || text.length > 500) {
          if (!text) console.log('[LocalTranslator] Skip: empty selection');
          if (text.length > 500) console.log('[LocalTranslator] Skip: selection too long');
          hideTranslation();
          return;
        }

        const isEnglish = /^[\x20-\x7E]+$/.test(text) && /[A-Za-z]/.test(text);
        if (!isEnglish) {
          console.log('[LocalTranslator] Skip: not English-like text');
          hideTranslation();
          return;
        }

        // Skip inside inputs, textareas, or contenteditable areas
        const anchorNode = selection?.anchorNode ?? null;
        if (isInEditable(anchorNode)) {
          console.log('[LocalTranslator] Skip: selection inside editable element');
          hideTranslation();
          return;
        }

        try {
          const requestId = ++activeRequestId;
          console.log('[LocalTranslator] Request translate', { requestId });
          const translator = await getTranslator();
          const translation = await translator.translate(text);
          console.log('[LocalTranslator] Translation success', {
            requestId,
            outputLength: String(translation ?? '').length,
          });
          
          const range = selection?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          
          if (rect && requestId === activeRequestId) {
            showTranslation(translation, rect.left + window.scrollX, rect.bottom + window.scrollY);
          }
        } catch (err) {
          console.warn('Translation failed:', err);
          hideTranslation();
        }
      }, 500);
    }, { passive: true });

    document.addEventListener('mousedown', () => {
      hideTranslation();
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
      activeRequestId++;
      console.log('[LocalTranslator] Mousedown: reset active request');
    });

    document.addEventListener('scroll', () => {
      hideTranslation();
    }, { passive: true });

    document.addEventListener('selectionchange', () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        hideTranslation();
        activeRequestId++;
        console.log('[LocalTranslator] Selection cleared: hide + reset');
      }
    }, { passive: true });

    const cleanup = () => {
      if (tooltipElement && tooltipElement.parentNode) {
        tooltipElement.parentNode.removeChild(tooltipElement);
        tooltipElement = null;
      }
      console.log('[LocalTranslator] Cleanup on pagehide');
    };
    window.addEventListener('pagehide', cleanup, { once: true });
  },
});
