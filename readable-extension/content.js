// ─── Readable Content Script ──────────────────────────────────────────────────
// Runs on all matching pages in the page's own context.
// Bridges messages from the background service worker into the page via
// localStorage + a custom DOM event (which React can listen to on localhost).
// Also handles the injection of the Grammarly-style Sidebar.

let sidebarContainer = null;
let floatingWidget = null;

// Initialize the floating widget when the script loads
initFloatingWidget();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_SIDEBAR") {
    toggleSidebar();
    return;
  }

  // Legacy localhost payload injection
  if (message.type === "READABLE_PAYLOAD") {
    // Write to localStorage so React can read it on mount
    localStorage.setItem("readablePayload", JSON.stringify(message.payload));
    // Also fire a custom event in case the React page is already mounted
    window.dispatchEvent(
      new CustomEvent("readable-payload", { detail: message.payload })
    );
  }
});

function initFloatingWidget() {
  if (floatingWidget) return;

  floatingWidget = document.createElement('div');
  const shadow = floatingWidget.attachShadow({ mode: 'open' });
  
  floatingWidget.style.position = 'fixed';
  floatingWidget.style.bottom = '30px';
  floatingWidget.style.right = '30px';
  floatingWidget.style.zIndex = '2147483645'; // Just under the sidebar overlay
  floatingWidget.style.width = '56px';
  floatingWidget.style.height = '56px';

  shadow.innerHTML = `
    <style>
      .widget {
        width: 100%;
        height: 100%;
        background: #0ea5e9;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        transition: transform 0.2s, box-shadow 0.2s;
        user-select: none;
      }
      .widget:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(14, 165, 233, 0.5);
      }
      .widget:active {
        cursor: grabbing;
        transform: scale(0.95);
      }
    </style>
    <div class="widget" title="Open Readable">📖</div>
  `;

  document.documentElement.appendChild(floatingWidget);

  // Dragging Logic
  let isDragging = false;
  let hasMoved = false; // To distinguish click from drag
  let startX, startY, initialX, initialY;

  const widgetEl = shadow.querySelector('.widget');

  const onMouseMove = (e) => {
    if (!isDragging) return;
    hasMoved = true;
    
    // Calculate new position
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    // Keep within viewport bounds
    let newX = initialX + dx;
    let newY = initialY + dy;
    
    const maxX = window.innerWidth - 56;
    const maxY = window.innerHeight - 56;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    // Apply position (convert from right/bottom to left/top for easier dragging)
    floatingWidget.style.right = 'auto';
    floatingWidget.style.bottom = 'auto';
    floatingWidget.style.left = \`\${newX}px\`;
    floatingWidget.style.top = \`\${newY}px\`;
  };

  const onMouseUp = (e) => {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    // If it was just a click (didn't move), toggle the sidebar
    if (!hasMoved) {
      toggleSidebar();
    }
  };

  widgetEl.addEventListener('mousedown', (e) => {
    isDragging = true;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    
    // Get current computed position
    const rect = floatingWidget.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
    
    // Setup global listeners so dragging works even if mouse leaves the widget
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    // Prevent default to avoid text selection while dragging
    e.preventDefault();
  });
}

function toggleSidebar() {
  if (sidebarContainer) {
    sidebarContainer.style.transform = 'translateX(100%)';
    setTimeout(() => {
      sidebarContainer.remove();
      sidebarContainer = null;
    }, 300); // Wait for exit animation
    return;
  }

  sidebarContainer = document.createElement('div');
  // Use Shadow DOM to protect our styles from the host page's CSS
  const shadow = sidebarContainer.attachShadow({ mode: 'open' });
  
  // Set inline styles on the container itself
  sidebarContainer.style.position = 'fixed';
  sidebarContainer.style.top = '0';
  sidebarContainer.style.right = '0';
  sidebarContainer.style.width = '450px';
  sidebarContainer.style.height = '100vh';
  sidebarContainer.style.zIndex = '2147483647'; // Max z-index
  sidebarContainer.style.transform = 'translateX(100%)'; // Start off-screen
  sidebarContainer.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
  sidebarContainer.style.pointerEvents = 'none'; // Container shouldn't block clicks when transparent
  
  shadow.innerHTML = `
    <style>
      :host {
        display: block;
        width: 100%;
        height: 100%;
        pointer-events: auto; /* Re-enable pointer events inside shadow DOM */
      }
      .sidebar {
        width: 100%;
        height: 100%;
        background: #ffffff;
        box-shadow: -20px 0 50px rgba(15, 23, 42, 0.15);
        font-family: 'Outfit', system-ui, -apple-system, sans-serif;
        display: flex;
        flex-direction: column;
        border-left: 1px solid rgba(0,0,0,0.05);
      }
      .header {
        background: linear-gradient(to right, #f8fafc, #ffffff);
        padding: 32px;
        border-bottom: 2px solid #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .title-group {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .logo {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #0ea5e9, #6366f1);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
      }
      .title {
        font-size: 1.5rem;
        font-weight: 900;
        color: #0f172a;
        margin: 0;
        letter-spacing: -0.02em;
      }
      .close-btn {
        background: #f1f5f9;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: #64748b;
        border-radius: 12px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.2s;
      }
      .close-btn:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
      
      .content {
        padding: 32px;
        flex-grow: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .card {
        background: #ffffff;
        border: 2px solid #f1f5f9;
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        transition: 0.3s;
      }
      .card:hover { border-color: #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
      
      .card-title {
        font-size: 0.8rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #94a3b8;
        margin: 0 0 20px 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .card-title::before {
        content: ''; width: 4px; height: 12px; background: #0ea5e9; border-radius: 2px;
      }
      
      .setting-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        border-bottom: 1px solid #f8fafc;
      }
      .setting-row:last-child { border-bottom: none; padding-bottom: 0; }
      .setting-info { display: flex; flex-direction: column; }
      .setting-label { font-weight: 800; color: #1e293b; font-size: 1.05rem; }
      .setting-desc { font-size: 0.8rem; color: #64748b; font-weight: 500; }
      
      .toggle {
        width: 52px; height: 28px; background: #e2e8f0; border-radius: 14px;
        position: relative; cursor: pointer; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .toggle.active { background: #0ea5e9; }
      .toggle::after {
        content: ''; position: absolute; top: 3px; left: 3px;
        width: 22px; height: 22px; background: white; border-radius: 50%;
        transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .toggle.active::after { transform: translateX(24px); }
      
      .color-picker {
        display: flex; gap: 16px; margin-top: 12px;
      }
      .color-swatch {
        width: 44px; height: 44px; border-radius: 14px; border: 3px solid #f1f5f9; 
        cursor: pointer; transition: 0.2s transform, 0.2s border-color;
      }
      .color-swatch:hover { transform: scale(1.1); }
      .color-swatch.active { border-color: #0ea5e9; transform: scale(1.1); }
      
      .action-btn {
        width: 100%; padding: 20px; background: #0ea5e9; color: white;
        border: none; border-radius: 20px; font-weight: 900; font-size: 1.1rem;
        cursor: pointer; box-shadow: 0 6px 0 0 #0284c7; transition: 0.1s;
        margin-top: auto;
        display: flex; align-items: center; justify-content: center; gap: 12px;
      }
      .action-btn:active { transform: translateY(4px); box-shadow: 0 0 0 0 #0284c7; }
      .action-btn:hover { background: #0284c7; }

      @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    </style>
    <div class="sidebar">
      <div class="header">
        <div class="title-group">
          <div class="logo">📖</div>
          <h2 class="title">Readable</h2>
        </div>
        <button class="close-btn">&times;</button>
      </div>
      <div class="content">
        <div class="card">
          <h3 class="card-title">Magic Interventions</h3>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Bionic Reading</span>
              <span class="setting-desc">Bold fixation points for focus</span>
            </div>
            <div class="toggle" data-feature="bionic"></div>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Line Focus Ruler</span>
              <span class="setting-desc">Highlight the current line</span>
            </div>
            <div class="toggle" data-feature="ruler"></div>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Syllable Splitter</span>
              <span class="setting-desc">Break words into chunks</span>
            </div>
            <div class="toggle" data-feature="syllables"></div>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Eye Tracking</span>
              <span class="setting-desc">A magical guide for your focus</span>
            </div>
            <div class="toggle" data-feature="pointer"></div>
          </div>
        </div>
        
        <div class="card">
          <h3 class="card-title">Eye-Friendly Overlays</h3>
          <div class="color-picker">
            <div class="color-swatch active" style="background: #ffffff;" data-color="transparent" title="None"></div>
            <div class="color-swatch" style="background: #fef9c3;" data-color="rgba(254, 249, 195, 0.25)" title="Cream"></div>
            <div class="color-swatch" style="background: #dcfce7;" data-color="rgba(220, 252, 231, 0.25)" title="Mint"></div>
            <div class="color-swatch" style="background: #fee2e2;" data-color="rgba(254, 226, 226, 0.25)" title="Rose"></div>
            <div class="color-swatch" style="background: #e0f2fe;" data-color="rgba(224, 242, 254, 0.25)" title="Sky"></div>
          </div>
        </div>

        <button class="action-btn">
          <span>✨</span> Analyze Complexity
        </button>
      </div>
    </div>
  `;

  
  document.documentElement.appendChild(sidebarContainer);

  // Trigger animation after adding to DOM
  requestAnimationFrame(() => {
    sidebarContainer.style.transform = 'translateX(0)';
  });

  // Feature State
  const features = {
    bionic: false,
    ruler: false,
    syllables: false,
    pointer: false,
    color: 'transparent'
  };

  // 1. Bionic Reading Logic
  const bionicStore = new Map();
  function toggleBionic(active) {
    if (active) {
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      const nodesToProcess = [];
      while (node = walk.nextNode()) {
        const parent = node.parentElement;
        if (!parent) continue;
        const tag = parent.tagName;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'].includes(tag)) continue;
        if (parent.closest('[shadowroot], .sidebar, .widget')) continue;
        if (node.nodeValue.trim().length < 2) continue;
        nodesToProcess.push(node);
      }

      nodesToProcess.forEach(node => {
        const text = node.nodeValue;
        const span = document.createElement('span');
        span.className = 'readable-bionic-wrapper';
        span.style.pointerEvents = 'none';
        
        span.innerHTML = text.replace(/([a-zA-Z0-9]+)/g, (match) => {
          const len = match.length;
          const boldLen = len <= 3 ? 1 : Math.ceil(len / 2);
          return `<b style="font-weight: 800; color: inherit;">${match.slice(0, boldLen)}</b>${match.slice(boldLen)}`;
        });
        
        bionicStore.set(span, node.cloneNode());
        node.parentNode.replaceChild(span, node);
      });
    } else {
      const wrappers = document.querySelectorAll('.readable-bionic-wrapper');
      wrappers.forEach(span => {
        const original = bionicStore.get(span);
        if (original) span.parentNode.replaceChild(original, span);
      });
      bionicStore.clear();
    }
  }

  // 2. Line Focus Ruler Logic
  let rulerEl = null;
  function toggleRuler(active) {
    if (active) {
      rulerEl = document.createElement('div');
      rulerEl.className = 'readable-ruler';
      rulerEl.style.cssText = `
        position: fixed; left: 0; width: 100%; height: 32px;
        background: rgba(14, 165, 233, 0.15); border-top: 2px solid #0ea5e9;
        border-bottom: 2px solid #0ea5e9; pointer-events: none;
        z-index: 2147483644; box-shadow: 0 0 0 100vh rgba(15, 23, 42, 0.4);
        display: none; transition: top 0.05s ease-out;
      `;
      document.documentElement.appendChild(rulerEl);
      const move = (e) => {
        rulerEl.style.display = 'block';
        rulerEl.style.top = (e.clientY - 16) + 'px';
      };
      document.addEventListener('mousemove', move);
      rulerEl._move = move;
    } else if (rulerEl) {
      document.removeEventListener('mousemove', rulerEl._move);
      rulerEl.remove();
      rulerEl = null;
    }
  }

  // 3. Syllable Splitter (Simple Regex Heuristic)
  const syllableStore = new Map();
  function toggleSyllables(active) {
    if (active) {
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      const nodes = [];
      while(node = walk.nextNode()) {
        const tag = node.parentElement.tagName;
        if (['SCRIPT', 'STYLE', 'B', 'SPAN'].includes(tag)) continue;
        if (node.parentElement.closest('.sidebar, .widget')) continue;
        nodes.push(node);
      }
      nodes.forEach(node => {
        const text = node.nodeValue;
        const span = document.createElement('span');
        span.className = 'readable-syllable-wrapper';
        // Basic syllable splitting regex
        span.innerHTML = text.replace(/([a-z]{3,})/gi, (word) => {
          return word.replace(/([^aeiouy]*[aeiouy]+(?:[^aeiouy]*|(?![aeiouy])))/gi, '$1·').replace(/·$/, '');
        });
        syllableStore.set(span, node.cloneNode());
        node.parentNode.replaceChild(span, node);
      });
    } else {
      const wrappers = document.querySelectorAll('.readable-syllable-wrapper');
      wrappers.forEach(span => {
        const original = syllableStore.get(span);
        if (original) span.parentNode.replaceChild(original, span);
      });
      syllableStore.clear();
    }
  }

  // 4. Eye Pointer Logic (Magnetic Highlighting)
  let pointerEl = null;
  
  function togglePointer(active) {
    if (active) {
      pointerEl = document.createElement('div');
      pointerEl.style.cssText = `
        position: fixed; width: 30px; height: 30px;
        background: radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, transparent 70%);
        border: 2px solid rgba(14, 165, 233, 0.8); border-radius: 50%;
        pointer-events: none; z-index: 2147483647; transition: transform 0.1s ease-out, background 0.2s;
        box-shadow: 0 0 15px rgba(14, 165, 233, 0.5); display: none;
      `;
      document.documentElement.appendChild(pointerEl);

      const move = (e) => {
        pointerEl.style.display = 'block';
        pointerEl.style.left = (e.clientX - 15) + 'px';
        pointerEl.style.top = (e.clientY - 15) + 'px';

        // Find word under cursor for "Magnetic" feel
        const range = document.caretRangeFromPoint(e.clientX, e.clientY);
        if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
          const rects = range.getClientRects();
          if (rects.length > 0) {
            pointerEl.style.transform = `scale(1.8)`;
            pointerEl.style.background = `radial-gradient(circle, rgba(14, 165, 233, 0.7) 0%, transparent 70%)`;
          } else {
            pointerEl.style.transform = `scale(1)`;
            pointerEl.style.background = `radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, transparent 70%)`;
          }
        } else {
          pointerEl.style.transform = `scale(1)`;
          pointerEl.style.background = `radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, transparent 70%)`;
        }
      };

      document.addEventListener('mousemove', move);
      pointerEl._move = move;
    } else if (pointerEl) {
      document.removeEventListener('mousemove', pointerEl._move);
      pointerEl.remove();
      pointerEl = null;
    }
  }

  // Event Listeners
  shadow.querySelector('.close-btn').addEventListener('click', () => toggleSidebar());
  
  // Toggles
  const toggles = shadow.querySelectorAll('.toggle');
  toggles.forEach(t => {
    t.addEventListener('click', () => {
      t.classList.toggle('active');
      const feature = t.getAttribute('data-feature');
      const isActive = t.classList.contains('active');
      
      if (feature === 'bionic') toggleBionic(isActive);
      if (feature === 'ruler') toggleRuler(isActive);
      if (feature === 'syllables') toggleSyllables(isActive);
      if (feature === 'pointer') togglePointer(isActive);
    });
  });

  // Color Overlay Logic
  let activeOverlay = null;
  const swatches = shadow.querySelectorAll('.color-swatch');
  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      swatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      
      const color = swatch.getAttribute('data-color');
      
      // Clean up old overlay
      if (activeOverlay) {
        activeOverlay.remove();
        activeOverlay = null;
      }
      
      // Apply new overlay if not transparent
      if (color !== 'transparent') {
        activeOverlay = document.createElement('div');
        activeOverlay.style.position = 'fixed';
        activeOverlay.style.top = '0';
        activeOverlay.style.left = '0';
        activeOverlay.style.width = '100vw';
        activeOverlay.style.height = '100vh';
        activeOverlay.style.backgroundColor = color;
        activeOverlay.style.pointerEvents = 'none'; // Clicks pass through
        activeOverlay.style.zIndex = '2147483646'; // Just under the sidebar
        document.documentElement.appendChild(activeOverlay);
      }
    });
  });

  // Analyze Page Button
  shadow.querySelector('.action-btn').addEventListener('click', async () => {
    const btn = shadow.querySelector('.action-btn');
    btn.innerText = "Analyzing Complexity...";
    btn.style.background = "#64748b";

    const text = document.body.innerText.slice(0, 2000);
    
    // Simulate AI analysis for immediate "magic" feel
    setTimeout(() => {
      const words = text.split(/\s+/).length;
      const difficult = text.match(/[a-z]{9,}/gi)?.length || 0;
      const complexity = Math.min(100, Math.round((difficult / words) * 500));
      
      const resultCard = document.createElement('div');
      resultCard.style.cssText = `
        background: #f0f9ff; border: 2px solid #bae6fd; border-radius: 12px;
        padding: 16px; margin-top: 16px; animation: slideIn 0.3s ease-out;
      `;
      resultCard.innerHTML = `
        <h4 style="margin: 0 0 8px 0; color: #0369a1; font-size: 0.9rem;">Analysis Result</h4>
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700;">
          <span>Complexity Score</span>
          <span style="color: ${complexity > 20 ? '#e11d48' : '#059669'}">${complexity}%</span>
        </div>
        <div style="height: 6px; background: #e2e8f0; border-radius: 3px; margin-top: 8px;">
          <div style="height: 100%; width: ${complexity}%; background: #0ea5e9; border-radius: 3px;"></div>
        </div>
        <p style="font-size: 0.75rem; color: #64748b; margin-top: 12px; line-height: 1.4;">
          This page contains many complex words. We recommend using <b>Bionic Reading</b> or opening in <b>Readable Hub</b> for better focus.
        </p>
      `;
      
      const style = document.createElement('style');
      style.textContent = '@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }';
      shadow.appendChild(style);
      
      btn.parentNode.insertBefore(resultCard, btn.nextSibling);
      btn.innerText = "Analysis Complete! ✅";
      btn.style.background = "#059669";
    }, 1200);
  });
}

