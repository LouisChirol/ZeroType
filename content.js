// Content script for ZeroType extension
class ZeroTypeContent {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingOverlay = null;
    this.focusedElement = null;
    this.targetElement = null;
    this.lastFocusedInput = null; // Remember last text input even when focus is lost
    this.customShortcut = 'Ctrl+Space'; // Default shortcut
    
    this.setupMessageListener();
    this.trackFocusedElement();
    this.setupCustomShortcuts();
    this.loadCustomShortcut().then(() => {
      // Create overlay after shortcut is loaded so it shows correctly
      this.createRecordingOverlay();
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleRecording') {
        this.toggleRecording();
      } else if (request.action === 'updateShortcut') {
        this.customShortcut = request.shortcut || 'Ctrl+Space';
        this.updateOverlayShortcut();
      }
    });
  }

  trackFocusedElement() {
    // Track focused input elements
    document.addEventListener('focusin', (event) => {
      const element = event.target;
      if (this.isTextInput(element)) {
        this.focusedElement = element;
        this.lastFocusedInput = element; // Always remember the last text input
      }
    });

    document.addEventListener('focusout', () => {
      // Don't clear lastFocusedInput - keep it for popup button usage
      this.focusedElement = null;
    });
  }

  isTextInput(element) {
    const tagName = element.tagName.toLowerCase();
    const inputTypes = ['text', 'email', 'password', 'search', 'tel', 'url'];
    
    // Standard input detection
    if (tagName === 'textarea' || 
        (tagName === 'input' && inputTypes.includes(element.type)) ||
        element.contentEditable === 'true' || 
        element.isContentEditable) {
      return true;
    }
    
    // Modern web app patterns
    if (element.getAttribute('role') === 'textbox' ||
        element.getAttribute('aria-multiline') === 'true' ||
        element.classList.contains('input') ||
        element.hasAttribute('data-testid') && element.getAttribute('data-testid').includes('input') ||
        element.hasAttribute('data-testid') && element.getAttribute('data-testid').includes('text')) {
      return true;
    }
    
    // Check for nested input elements (common in component frameworks)
    if (element.querySelector('input, textarea, [contenteditable="true"], [role="textbox"]')) {
      return true;
    }
    
    return false;
  }

    createRecordingOverlay() {
    this.recordingOverlay = document.createElement('div');
    this.recordingOverlay.id = 'zerotype-recording-overlay';
    this.recordingOverlay.innerHTML = `
      <div class="zerotype-modal">
        <div class="zerotype-icon">🎤</div>
        <div class="zerotype-status">Recording...</div>
        <div class="zerotype-subtitle">Speak now, press <span id="overlay-shortcut">${this.customShortcut}</span> to stop</div>
        <button class="zerotype-stop-btn">Stop Recording</button>
      </div>
    `;
    
    this.recordingOverlay.querySelector('.zerotype-stop-btn').addEventListener('click', () => {
      this.stopRecording();
    });

    document.body.appendChild(this.recordingOverlay);
  }

  updateOverlayShortcut() {
    const overlayShortcut = document.getElementById('overlay-shortcut');
    if (overlayShortcut) {
      overlayShortcut.textContent = this.customShortcut;
    }
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      // Find the best available text input using multiple strategies
      const targetInput = this.findBestTargetInput();
      
      if (!targetInput) {
        this.showNotification('Please focus on a text input field first', 'warning');
        return;
      }

      // Store the target element reference
      this.targetElement = targetInput;
      this.focusedElement = targetInput; // Update current focus tracking
      
      // Provide feedback if we're using a remembered input (for popup button usage)
      if (targetInput === this.lastFocusedInput && targetInput !== document.activeElement) {
        // Briefly show that we found the remembered input
        setTimeout(() => {
          this.showNotification('Using remembered input field', 'info');
        }, 100);
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      this.audioChunks = [];
      
      // Try to use the most compatible format available
      let mimeType;
      const preferredFormats = [
        'audio/wav',
        'audio/webm;codecs=pcm', 
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];
      
      for (const format of preferredFormats) {
        if (MediaRecorder.isTypeSupported(format)) {
          mimeType = format;
          break;
        }
      }
      
      // Fallback
      if (!mimeType) {
        mimeType = 'audio/webm;codecs=opus';
      }
      
      // console.log('🎙️ === AUDIO RECORDING DEBUG ===');
      // console.log('📋 Supported Formats Check:', preferredFormats.map(f => ({
      //   format: f,
      //   supported: MediaRecorder.isTypeSupported(f)
      // })));
      // console.log('✅ Selected MIME Type:', mimeType);
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processRecording();
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.showRecordingOverlay();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      this.showNotification('Failed to start recording. Please check microphone permissions.', 'error');
    }
  }

  stopRecording() {
    if (this.isRecording && this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.hideRecordingOverlay();
    }
  }

  async processRecording() {
    try {
      this.showNotification('Processing audio...', 'info');
      
      // Create blob from audio chunks  
      const originalType = this.mediaRecorder.mimeType;
      const audioBlob = new Blob(this.audioChunks, { type: originalType });
      
      // console.log('🎵 === AUDIO PROCESSING DEBUG ===');
      // console.log('📦 Original Audio Blob:', {
      //   size: audioBlob.size,
      //   type: audioBlob.type,
      //   chunks: this.audioChunks.length,
      //   chunkSizes: this.audioChunks.map(chunk => chunk.size)
      // });
      
      let audioData, mimeType;
      
      // If we have WAV format, use it directly
      if (originalType.includes('wav')) {
        audioData = await audioBlob.arrayBuffer();
        mimeType = 'audio/wav';
        // console.log('Using direct WAV format');
      } else {
        // Convert to WAV format (required by Mistral API)
        // console.log('Converting to WAV format...');
        try {
          audioData = await this.convertToWav(audioBlob);
          mimeType = 'audio/wav';
          // console.log('WAV conversion successful, size:', audioData.byteLength);
        } catch (conversionError) {
          console.error('WAV conversion failed:', conversionError);
          // Fallback: try to send original format and let API handle it
          audioData = await audioBlob.arrayBuffer();
          mimeType = originalType;
        }
      }
      
      // Convert ArrayBuffer to transferable format for Chrome messaging
      const audioArray = new Uint8Array(audioData);
      
      // Send to background script for transcription
      const response = await chrome.runtime.sendMessage({
        action: 'transcribe',
        audioData: Array.from(audioArray), // Convert to regular array for transfer
        mimeType: mimeType
      });

      if (response.success) {
        this.insertText(response.text);
        this.showNotification('Text inserted successfully!', 'success');
      } else {
        this.showNotification(`Transcription failed: ${response.error}`, 'error');
      }
      
    } catch (error) {
      console.error('Error processing recording:', error);
      this.showNotification('Failed to process recording', 'error');
    }
  }

  async convertToWav(audioBlob) {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to WAV
      const wavArrayBuffer = this.audioBufferToWav(audioBuffer);
      
      return wavArrayBuffer;
    } catch (error) {
      console.error('Error converting audio to WAV:', error);
      throw new Error('Failed to convert audio format');
    }
  }

  audioBufferToWav(buffer) {
    const numberOfChannels = Math.min(buffer.numberOfChannels, 2); // Limit to stereo
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = 2;
    const dataLength = length * numberOfChannels * bytesPerSample;
    
    const arrayBuffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(arrayBuffer);
    
    // Helper function to write strings
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // WAV header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (PCM)
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true); // ByteRate
    view.setUint16(32, numberOfChannels * bytesPerSample, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Convert and write audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        let sample = buffer.getChannelData(channel)[i];
        
        // Clamp to [-1, 1] and convert to 16-bit integer
        sample = Math.max(-1, Math.min(1, sample));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }
    
          // console.log('🔄 WAV Conversion Complete:', {
      //   inputChannels: buffer.numberOfChannels,
      //   outputChannels: numberOfChannels,
      //   sampleRate: sampleRate,
      //   lengthSamples: length,
      //   durationSeconds: (length / sampleRate).toFixed(2),
      //   outputSizeBytes: arrayBuffer.byteLength,
      //   outputSizeKB: (arrayBuffer.byteLength / 1024).toFixed(2)
      // });
    
    return arrayBuffer;
  }

  insertText(text) {
    // Find the best target using our smart detection
    const element = this.findBestTargetInput() || this.targetElement;

    if (!element) {
      this.showNotification('No text field available. Please click on a text input and try again.', 'warning');
      return;
    }

    if (!text) {
      this.showNotification('No text was transcribed to insert.', 'warning');
      return;
    }
    
    try {
      // Enhanced text insertion with multiple strategies
      const success = this.tryInsertText(element, text);
      
      if (success) {
        // Update focus tracking on successful insertion and ensure element is focused
        element.focus();
        this.focusedElement = element;
        this.lastFocusedInput = element; // Update last focused for future use
      } else {
        // Fallback: try to find alternative input elements
        const alternativeElement = this.findAlternativeInput(element);
        if (alternativeElement) {
          const fallbackSuccess = this.tryInsertText(alternativeElement, text);
          if (fallbackSuccess) {
            alternativeElement.focus();
            this.focusedElement = alternativeElement;
          }
        } else {
          this.showNotification('Could not insert text - complex input field detected', 'warning');
        }
      }
      
    } catch (error) {
      console.error('Error during text insertion:', error);
      this.showNotification('Error inserting text into field', 'error');
    }
  }

  tryInsertText(element, text) {
    try {
      // Strategy 1: Handle contentEditable elements (WhatsApp, Messenger, etc.)
      if (element.contentEditable === 'true' || element.isContentEditable) {
        return this.insertIntoContentEditable(element, text);
      }
      
      // Strategy 2: Handle regular input/textarea elements
      if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
        return this.insertIntoInputElement(element, text);
      }
      
      // Strategy 3: Look for nested input elements (some apps wrap inputs)
      const nestedInput = element.querySelector('input, textarea, [contenteditable="true"]');
      if (nestedInput) {
        return this.tryInsertText(nestedInput, text);
      }
      
      return false;
    } catch (error) {
      console.error('Text insertion strategy failed:', error);
      return false;
    }
  }

  insertIntoContentEditable(element, text) {
    // Focus the element first
    element.focus();
    
    // Strategy A: Use document.execCommand (deprecated but still works in many cases)
    if (document.execCommand) {
      try {
        const success = document.execCommand('insertText', false, text);
        if (success) {
          // Only dispatch minimal events for execCommand since it handles most of the work
          this.dispatchMinimalEvents(element);
          return true;
        }
      } catch (e) {
        console.log('execCommand failed, trying alternative methods');
      }
    }
    
    // Strategy B: Manual selection and range manipulation
    try {
      const selection = window.getSelection();
      let range;
      
      if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      } else {
        range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      // Insert text
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Dispatch events for manual insertion
      this.dispatchInputEvents(element);
      return true;
      
    } catch (e) {
      console.error('Range manipulation failed:', e);
    }
    
    // Strategy C: Direct content manipulation (last resort)
    try {
      const currentContent = element.innerHTML || element.textContent || '';
      element.innerHTML = currentContent + text;
      this.dispatchInputEvents(element);
      return true;
    } catch (e) {
      console.error('Direct content manipulation failed:', e);
    }
    
    return false;
  }

  insertIntoInputElement(element, text) {
    // Focus the element
    element.focus();
    
    // Store current state
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    const currentValue = element.value || '';
    
    // Dispatch beforeinput event
    this.dispatchBeforeInputEvent(element, text);
    
    // Insert text
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    
    // Use React-compatible value setting
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value') || 
                       Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value');
    
    if (valueSetter && valueSetter.set) {
      valueSetter.set.call(element, newValue);
    } else {
      element.value = newValue;
    }
    
    // Set cursor position
    const newCursorPos = start + text.length;
    element.selectionStart = newCursorPos;
    element.selectionEnd = newCursorPos;
    
    // Dispatch comprehensive events
    this.dispatchInputEvents(element);
    
    return true;
  }

  dispatchBeforeInputEvent(element, text) {
    try {
      const beforeInputEvent = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text
      });
      element.dispatchEvent(beforeInputEvent);
    } catch (e) {
      // Fallback for browsers that don't support InputEvent
      console.log('beforeinput event not supported');
    }
  }

  dispatchMinimalEvents(element) {
    // Minimal events for when execCommand already handled the insertion
    try {
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {
      console.log('Could not dispatch minimal events');
    }
  }

  dispatchInputEvents(element) {
    // Dispatch multiple events to ensure compatibility with different frameworks
    const events = [
      { name: 'keydown', event: KeyboardEvent, props: { bubbles: true, key: 'Unidentified' } },
      { name: 'keypress', event: KeyboardEvent, props: { bubbles: true, key: 'Unidentified' } },
      { name: 'input', event: InputEvent, props: { bubbles: true, inputType: 'insertText' } },
      { name: 'keyup', event: KeyboardEvent, props: { bubbles: true, key: 'Unidentified' } },
      { name: 'change', event: Event, props: { bubbles: true } }
    ];
    
    events.forEach(({ name, event: EventConstructor, props }) => {
      try {
        let evt;
        if (EventConstructor === InputEvent) {
          evt = new InputEvent(name, props);
        } else if (EventConstructor === KeyboardEvent) {
          evt = new KeyboardEvent(name, props);
        } else {
          evt = new Event(name, props);
        }
        element.dispatchEvent(evt);
      } catch (e) {
        // Fallback to basic Event
        const basicEvent = new Event(name, { bubbles: true });
        element.dispatchEvent(basicEvent);
      }
    });
    
    // Additional React-specific events (but avoid paste events that might cause duplication)
    this.dispatchReactEvents(element);
  }

  dispatchReactEvents(element) {
    // React often listens to these events, but avoid paste events that can cause duplication
    
    // Force React to update by triggering potential state changes (with shorter delay)
    setTimeout(() => {
      try {
        element.focus();
        // Briefly blur and refocus to trigger React state updates without causing duplication
        element.blur();
        element.focus();
      } catch (e) {
        console.log('Could not perform focus cycling');
      }
    }, 5);
  }

  findBestTargetInput() {
    // Strategy 1: Currently focused element (highest priority)
    if (this.focusedElement && this.isTextInput(this.focusedElement)) {
      return this.focusedElement;
    }
    
    // Strategy 2: Last focused input (for popup button usage)
    if (this.lastFocusedInput && this.isTextInput(this.lastFocusedInput)) {
      // Verify the element is still in DOM and visible
      if (document.contains(this.lastFocusedInput) && this.isElementVisible(this.lastFocusedInput)) {
        return this.lastFocusedInput;
      }
    }
    
    // Strategy 3: Find currently active/focused element even if we missed it
    const activeElement = document.activeElement;
    if (activeElement && this.isTextInput(activeElement)) {
      return activeElement;
    }
    
    // Strategy 4: Smart detection - find likely target inputs
    const smartTarget = this.findSmartTargetInput();
    if (smartTarget) {
      return smartTarget;
    }
    
    return null;
  }

  findSmartTargetInput() {
    // Look for inputs that are likely targets (visible, not disabled, etc.)
    const selectors = [
      'input[type="text"]:not([disabled]):not([readonly])',
      'textarea:not([disabled]):not([readonly])', 
      '[contenteditable="true"]:not([disabled])',
      '[role="textbox"]:not([disabled])',
      'input[type="search"]:not([disabled]):not([readonly])',
      'input[type="email"]:not([disabled]):not([readonly])'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (this.isElementVisible(element) && this.isLikelyTargetInput(element)) {
          return element;
        }
      }
    }
    
    return null;
  }

  isElementVisible(element) {
    if (!element || !document.contains(element)) return false;
    
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      rect.width > 0 && 
      rect.height > 0 && 
      style.display !== 'none' && 
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  isLikelyTargetInput(element) {
    // Prioritize inputs that are likely to be message/content fields
    const rect = element.getBoundingClientRect();
    
    // Prefer larger inputs (more likely to be content fields)
    const isReasonableSize = rect.width > 100 && rect.height > 20;
    
    // Check for common patterns in classes/ids that suggest message/content inputs
    const text = (element.className + ' ' + element.id + ' ' + (element.placeholder || '')).toLowerCase();
    const isContentField = /message|comment|post|note|text|content|compose|write|input|search/i.test(text);
    
    // Prefer inputs that are in the center area of the viewport
    const isInGoodPosition = rect.top > 50 && rect.bottom < window.innerHeight - 50;
    
    return isReasonableSize && (isContentField || isInGoodPosition);
  }

  findAlternativeInput(originalElement) {
    // Look for alternative input elements nearby
    const selectors = [
      'input[type="text"]',
      'textarea', 
      '[contenteditable="true"]',
      '[role="textbox"]',
      '.input',
      '[data-testid*="input"]',
      '[data-testid*="text"]'
    ];
    
    // Search in parent containers
    let container = originalElement.parentElement;
    while (container && container !== document.body) {
      for (const selector of selectors) {
        const found = container.querySelector(selector);
        if (found && found !== originalElement && this.isTextInput(found)) {
          return found;
        }
      }
      container = container.parentElement;
    }
    
    return null;
  }

  showRecordingOverlay() {
    this.recordingOverlay.style.display = 'flex';
  }

  hideRecordingOverlay() {
    this.recordingOverlay.style.display = 'none';
  }

  showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.zerotype-notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `zerotype-notification zerotype-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  // Custom shortcut handling
  setupCustomShortcuts() {
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  async loadCustomShortcut() {
    try {
      const result = await chrome.storage.sync.get(['customShortcut']);
      if (result.customShortcut) {
        this.customShortcut = result.customShortcut;
      }
    } catch (error) {
      console.log('Could not load custom shortcut:', error);
    }
  }

  handleKeydown(e) {
    // Don't trigger in input fields unless they're our target
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (!this.isTextInput(e.target)) return;
    }

    // Build the current key combination
    const keys = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Cmd');
    
    let mainKey = e.key;
    if (e.key === ' ') mainKey = 'Space';
    else if (e.key.length === 1) mainKey = e.key.toUpperCase();
    
    keys.push(mainKey);
    const currentShortcut = keys.join('+');
    
    // Check if it matches our custom shortcut
    if (currentShortcut === this.customShortcut) {
      e.preventDefault();
      this.toggleRecording();
    }
  }
}

// Initialize content script
new ZeroTypeContent(); 