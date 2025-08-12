interface Rule {
  selector: string;
  keepSelector?: string;
  terms?: string;
  displayMode?: 'overlay' | 'replace';
  trigger?: 'scroll' | 'open' | 'hover' | 'manual';
  hoverKey?: 'alt' | 'ctrl' | 'shift';
  minLen?: number;
  maxLen?: number;
  selectStyle?: string;
  parentStyle?: string;
  textStyle?: 'fuzzy' | 'dashline';
  onRenderStart?: (el: Element, rawText: string) => void;
  onRemove?: (el: Element) => void;
  translateTitle?: boolean;
}

interface Setting {
  reflowDebounce?: number;
  visibleThreshold?: number;
  skipTags?: string[];
  hostTag?: string;
}

interface Cache {
  snapshot?: string;
  htmlBackup?: string;
  lastId?: string;
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms = 200): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export class DomTranslator {
  private rule: Required<Omit<Rule, 'keepSelector' | 'terms' | 'selectStyle' | 'parentStyle' | 'onRenderStart' | 'onRemove' | 'hoverKey'>> & Pick<Rule, 'keepSelector' | 'terms' | 'selectStyle' | 'parentStyle' | 'onRenderStart' | 'onRemove' | 'hoverKey'>;
  private setting: Required<Setting>;
  private translate: (text: string) => Promise<string>;
  private rootSet = new Set<Document | ShadowRoot>();
  private targetMap = new Map<Element, Cache>();
  private io?: IntersectionObserver;
  private mo?: MutationObserver;
  private _origTitle?: string;
  private _origAttachShadow?: typeof HTMLElement.prototype.attachShadow;
  private _retranslate: () => void;
  private _isUpdating = false;

  constructor(rule: Rule, setting: Setting, translate: (text: string) => Promise<string>) {
    this.rule = {
      selector: rule.selector,
      keepSelector: rule.keepSelector,
      terms: rule.terms,
      displayMode: rule.displayMode ?? 'overlay',
      trigger: rule.trigger ?? 'scroll',
      hoverKey: rule.hoverKey,
      minLen: rule.minLen ?? 2,
      maxLen: rule.maxLen ?? 8000,
      selectStyle: rule.selectStyle,
      parentStyle: rule.parentStyle,
      textStyle: rule.textStyle ?? 'fuzzy',
      onRenderStart: rule.onRenderStart,
      onRemove: rule.onRemove,
      translateTitle: rule.translateTitle ?? false,
    };

    this.setting = {
      reflowDebounce: setting.reflowDebounce ?? 300,
      visibleThreshold: setting.visibleThreshold ?? 0.1,
      skipTags: setting.skipTags ?? [
        'style', 'script', 'svg', 'img', 'video', 'audio',
        'textarea', 'input', 'button', 'select', 'option', 'iframe'
      ],
      hostTag: setting.hostTag ?? 'x-kt-trans',
    };

    this.translate = translate;
    this._retranslate = debounce(() => {
      if (this._isUpdating) return;
      this._isUpdating = true;
      try {
        this.unregister();
        this.register();
      } finally {
        this._isUpdating = false;
      }
    }, this.setting.reflowDebounce);
    
    this._patchAttachShadow();
  }

  register(): void {
    console.log('[DomTranslator] Registering');
    this._ensureCssFor(document);
    this._scanAll(document);
    this._observeRoots();
    
    if (this.rule.trigger === 'open') {
      this.targetMap.forEach((_, node) => this._render(node));
    }
    
    if (this.rule.translateTitle) {
      this._translateTitle();
    }
  }

  unregister(): void {
    console.log('[DomTranslator] Unregistering');
    this.io?.disconnect();
    this.mo?.disconnect();
    this._restoreAll();
    this._restoreTitle();
    this.rootSet.clear();
    this.targetMap.clear();
  }

  updateRule(patch: Partial<Rule>): void {
    Object.assign(this.rule, patch);
    this._retranslate();
  }

  toggleStyle(): void {
    const next = this.rule.textStyle === 'fuzzy' ? 'dashline' : 'fuzzy';
    this.rule.textStyle = next;
    this.rootSet.forEach((root) => {
      root.querySelectorAll(this.setting.hostTag).forEach((host) => {
        (host as HTMLElement).setAttribute('data-style', next);
      });
    });
  }

  collectTargets(): Element[] {
    const targets: Element[] = [];
    this.rootSet.forEach(root => {
      const collected = this._collectTargets(root, this.rule.selector);
      targets.push(...collected);
    });
    return targets;
  }

  render(node: Element): void {
    this._render(node);
  }

  // Translate a single element without registering observers or scanning.
  async translateElement(node: Element): Promise<void> {
    // Ensure minimal CSS is present for the current document root.
    this._ensureCssFor(document);
    await this._render(node);
  }

  translateAll(): void {
    console.log('[DomTranslator] Translating all targets');
    this.targetMap.forEach((_, node) => this._render(node));
  }

  private _scanAll(root: Document | ShadowRoot): void {
    this.rootSet.add(root);
    this._ensureCssFor(root);
    
    const targets = this._collectTargets(root, this.rule.selector);
    
    targets.forEach(node => {
      if (!this.targetMap.has(node)) {
        this.targetMap.set(node, {});
        
        if (this.rule.trigger === 'scroll') {
          this._observeVisible(node);
        } else if (this.rule.trigger === 'hover') {
          this._bindHover(node);
        }
        
        if (this.rule.selectStyle) {
          (node as HTMLElement).style.cssText += this.rule.selectStyle;
        }
        if (this.rule.parentStyle && node.parentElement) {
          node.parentElement.style.cssText += this.rule.parentStyle;
        }
      }
    });
    
    root.querySelectorAll('*').forEach(el => {
      if ((el as Element).shadowRoot) {
        this._scanAll((el as Element).shadowRoot!);
      }
    });
  }

  private _collectTargets(root: Document | ShadowRoot, selectorSpec: string): Element[] {
    const nodes: Element[] = [];
    const selectors = selectorSpec.split(';').map(s => s.trim()).filter(Boolean);
    
    selectors.forEach(sel => {
      if (sel.includes('::shadow::')) {
        const [outer, inner] = sel.split('::shadow::').map(s => s.trim());
        root.querySelectorAll(outer).forEach(el => {
          if (el.shadowRoot) {
            el.shadowRoot.querySelectorAll(inner).forEach(n => nodes.push(n));
          }
        });
      } else {
        root.querySelectorAll(sel).forEach(n => nodes.push(n));
      }
    });
    
    const skip = new Set(this.setting.skipTags);
    
    return nodes.filter(n => {
      if (skip.has(n.localName)) return false;
      if (n.matches(this.setting.hostTag) || n.querySelector(this.setting.hostTag)) return false;
      return !nodes.some(m => m !== n && n.contains(m));
    });
  }

  private _observeVisible(node: Element): void {
    if (!this.io) {
      this.io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.io!.unobserve(entry.target);
            this._render(entry.target);
          }
        });
      }, { threshold: this.setting.visibleThreshold });
    }
    this.io.observe(node);
  }

  private _bindHover(node: Element): void {
    const key = this.rule.hoverKey;
    let removed = false;
    
    const onEnter = (ev: Event) => {
      if (removed) return;
      const ok = !key || (ev as MouseEvent)[`${key}Key` as keyof MouseEvent];
      if (ok) {
        removed = true;
        node.removeEventListener('mouseenter', onEnter);
        node.removeEventListener('mouseleave', onLeave);
        this._render(node);
      }
    };
    
    const onLeave = () => {};
    
    node.addEventListener('mouseenter', onEnter);
    node.addEventListener('mouseleave', onLeave);
  }

  private async _render(node: Element): Promise<void> {
    // 清理所有旧的 host，避免重复渲染堆叠
    node.querySelectorAll(this.setting.hostTag).forEach((h) => h.remove());
    
    const cache = this.targetMap.get(node) || {};
    const raw = (node as HTMLElement).innerText?.trim() || '';
    if (!raw) return;
    
    if (this.rule.displayMode === 'replace' && !cache.htmlBackup) {
      cache.htmlBackup = node.innerHTML;
    }
    
    this.rule.onRenderStart?.(node, raw);
    
    const { q, keeps } = this._buildPlaceholders(node);
    const cleanLen = q.replace(/\[(\d+)\]/g, '').trim().length;
    if (cleanLen < this.rule.minLen || cleanLen > this.rule.maxLen) {
      return;
    }
    
    const host = document.createElement(this.setting.hostTag);
    host.setAttribute('data-style', this.rule.textStyle);
    node.appendChild(host);
    
    const transId = Math.random().toString(36).slice(2, 10);
    cache.lastId = transId;
    this.targetMap.set(node, cache);
    
    try {
      const translatedText = await this.translate(q);
      if (!translatedText) {
        host.remove();
        return;
      }
      
      if (this.targetMap.get(node)?.lastId !== transId) {
        host.remove();
        return;
      }
      
      const frag = this._buildFragmentFromTranslated(translatedText, keeps);
      
      if (this.rule.displayMode === 'replace') {
        // 直接替换目标节点内容，避免通过 innerHTML 注入
        (node as HTMLElement).replaceChildren(frag);
        host.remove();
      } else {
        // 覆盖模式渲染到 host
        host.replaceChildren(frag);
      }
    } catch (err) {
      console.warn('[DomTranslator] Translation failed:', err);
      host.remove();
    }
  }

  private _buildPlaceholders(node: Element): { q: string; keeps: string[] } {
    const keeps: string[] = [];
    const keepParts = (this.rule.keepSelector || '').split('::shadow::').map(s => s?.trim());
    const normalizeList = (s?: string) => (s || '').split(';').map(x => x.trim()).filter(Boolean).join(', ');
    const matchSel = normalizeList(keepParts[0]);
    const subSel = normalizeList(keepParts[1]);
    
    let text = '';
    
    node.childNodes.forEach(child => {
      if (child.nodeType === 1) {
        const el = child as Element;
        const hit = (matchSel && el.matches?.(matchSel)) || 
                   (subSel && el.querySelector?.(subSel));
        
        if (hit) {
          if (el.tagName === 'IMG') {
            const img = el as HTMLImageElement;
            img.style.width = `${img.width}px`;
            img.style.height = `${img.height}px`;
          }
          text += `[${keeps.length}]`;
          keeps.push(el.outerHTML);
        } else {
          text += el.textContent ?? '';
        }
      } else {
        text += child.textContent ?? '';
      }
    });
    
    let q = text || (node as HTMLElement).innerText || '';
    
    if (this.rule.terms) {
      const terms = this.rule.terms.split(/\n|;|；/).map(s => s.trim()).filter(Boolean);
      terms.forEach(line => {
        const [pat, rep = ''] = line.split(',').map(s => s?.trim() || '');
        if (!pat) return;

        // Escape regex metacharacters to treat patterns as literals
        const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(escapeRegExp(pat), 'g');
        q = q.replace(re, () => {
          const ph = `[${keeps.length}]`;
          keeps.push(`<i class="kt-term">${rep}</i>`);
          return ph;
        });
      });
    }
    
    if (q.includes('\n')) {
      q = q.replaceAll('\n', ' ');
    }
    
    return { q, keeps };
  }

  private _observeRoots(): void {
    this.mo = new MutationObserver(mutations => {
      if (this._isUpdating) return;
      let needRescan = false;
      for (const mutation of mutations) {
        if (mutation.type !== 'childList' || !mutation.addedNodes?.length) continue;

        let meaningful = false;
        mutation.addedNodes.forEach(n => {
          if (meaningful) return;
          if (n.nodeType !== 1) return; // ignore text/comment
          const el = n as Element;
          if (el.id === 'kt-trans-css') return; // ignore our injected style
          if (el.matches?.(this.setting.hostTag)) return; // ignore our host tag
          if (el.querySelector?.(this.setting.hostTag)) return; // ignore descendants containing our host
          meaningful = true;
        });

        if (meaningful) {
          needRescan = true;
          break;
        }
      }
      if (needRescan) {
        this._retranslate();
      }
    });
    
    this.rootSet.forEach(root => {
      this.mo!.observe(root, { childList: true, subtree: true });
    });
  }

  private _restoreAll(): void {
    this.targetMap.forEach((cache, node) => {
      const host = node.querySelector(this.setting.hostTag);
      if (host) {
        host.remove();
      }
      
      if (this.rule.displayMode === 'replace' && cache.htmlBackup) {
        node.innerHTML = cache.htmlBackup;
      }
      
      this.rule.onRemove?.(node);
    });
  }

  private _patchAttachShadow(): void {
    if (!this._origAttachShadow) {
      this._origAttachShadow = HTMLElement.prototype.attachShadow;
      const self = this;
      
      HTMLElement.prototype.attachShadow = function(init: ShadowRootInit) {
        const root = self._origAttachShadow!.apply(this, [init]);
        self.rootSet.add(root);
        self._ensureCssFor(root);
        self._retranslate();
        return root;
      };
    }
  }

  // 原方法改为仅代理到新的注入逻辑
  private _injectMinimalCssOnce(): void {
    this._ensureCssFor(document);
  }
  
  // 新增：在 Document 与各 ShadowRoot 中各自注入一次样式
  private _ensureCssFor(root: Document | ShadowRoot): void {
    const has =
      (root as Document | ShadowRoot).querySelector?.('style[data-kt-trans-css]') ||
      (root instanceof Document && root.getElementById('kt-trans-css'));
    if (has) return;
    
    const css = `
      ${this.setting.hostTag} {
        display: block;
        margin-top: 0.25em;
        line-height: inherit;
      }
      ${this.setting.hostTag}[data-style="fuzzy"] {
        filter: blur(0.2px);
        opacity: 0.92;
      }
      ${this.setting.hostTag}[data-style="dashline"] {
        border-top: 1px dashed currentColor;
        padding-top: 0.25em;
      }
      .kt-term {
        font-style: normal;
        font-weight: 600;
      }
    `;
    
    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-kt-trans-css', '1');
    
    if (root instanceof Document) {
      style.id = 'kt-trans-css';
      root.head.appendChild(style);
    } else {
      root.appendChild(style);
    }
  }
  
  // 新增：将翻译文本与占位符安全合并为 DOM 片段，避免注入
  private _buildFragmentFromTranslated(text: string, keeps: string[]): DocumentFragment {
    const frag = document.createDocumentFragment();
    const re = /\[(\d+)\]/g;
    let last = 0;
    let m: RegExpExecArray | null;
    
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) {
        frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      }
      const idx = Number(m[1]);
      const html = keeps[idx] ?? '';
      if (html) {
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        frag.appendChild(tpl.content.cloneNode(true));
      } else {
        // 占位符缺失时按普通文本处理，保证可恢复
        frag.appendChild(document.createTextNode(m[0]));
      }
      last = re.lastIndex;
    }
    
    if (last < text.length) {
      frag.appendChild(document.createTextNode(text.slice(last)));
    }
    return frag;
  }

  private async _translateTitle(): Promise<void> {
    if (this._origTitle) return;
    
    this._origTitle = document.title;
    try {
      const translated = await this.translate(this._origTitle);
      if (translated) {
        document.title = `${translated} | ${this._origTitle}`;
      }
    } catch (err) {
      console.warn('[DomTranslator] Title translation failed:', err);
    }
  }

  private _restoreTitle(): void {
    if (this._origTitle != null) {
      document.title = this._origTitle;
      this._origTitle = undefined;
    }
  }
}
