// Popup JavaScript for ZeroType extension

class ZeroTypePopup {
  constructor() {
    this.statusIndicator = document.getElementById('status-indicator');
    this.statusText = document.getElementById('status-text');
    this.apiStatus = document.getElementById('api-status');
    this.recordBtn = document.getElementById('record-btn');
    this.settingsBtn = document.getElementById('settings-btn');
    this.helpBtn = document.getElementById('help-btn');
    this.coffeeBtn = document.getElementById('coffee-btn');
    this.privacyNotice = document.getElementById('privacy-notice');
    this.shortcutDisplay = document.getElementById('shortcut-display');
    this.usageCount = document.getElementById('usage-count');
    
    this.setupEventListeners();
    this.updateStatus();
    this.loadUsageStats();
  }

  setupEventListeners() {
    this.recordBtn.addEventListener('click', () => this.toggleRecording());
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.helpBtn.addEventListener('click', () => this.showHelp());
    this.coffeeBtn.addEventListener('click', () => this.openTipJar());
    this.privacyNotice.addEventListener('click', () => this.openPrivacyDisclaimer());
  }

  async updateStatus() {
    try {
      // Check API key configuration and load shortcut
      const { mistralApiKey, customShortcut } = await chrome.storage.sync.get(['mistralApiKey', 'customShortcut']);
      
      // Update shortcut display
      const currentShortcut = customShortcut || 'Ctrl+Space';
      this.shortcutDisplay.textContent = currentShortcut;
      
      if (mistralApiKey) {
        this.apiStatus.innerHTML = '<span class="api-text api-configured">API: Configured ✅</span>';
        this.statusText.textContent = 'Ready to record';
        this.recordBtn.disabled = false;
      } else {
        this.apiStatus.innerHTML = '<span class="api-text api-not-configured">API: Not configured ❌</span>';
        this.statusText.textContent = 'Configure API key';
        this.recordBtn.disabled = true;
      }

      // Check if currently recording (you might want to add this state to background script)
      const isRecording = await this.checkRecordingStatus();
      if (isRecording) {
        this.setRecordingState(true);
      }

    } catch (error) {
      console.error('Error updating status:', error);
      this.statusText.textContent = 'Error checking status';
    }
  }

  async checkRecordingStatus() {
    // This would require implementing a way to check recording state
    // For now, return false
    return false;
  }

  async toggleRecording() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, { action: 'toggleRecording' });
      
      // Update button state (you might want to get actual state from content script)
      this.setRecordingState(!this.recordBtn.classList.contains('recording'));
      
    } catch (error) {
      console.error('Error toggling recording:', error);
      this.showError('Failed to start recording. Make sure you\'re on a webpage.');
    }
  }

  setRecordingState(isRecording) {
    if (isRecording) {
      this.recordBtn.classList.add('recording');
      this.recordBtn.innerHTML = '<span class="btn-icon">⏹️</span><span class="btn-text">Stop Recording</span>';
      this.statusText.textContent = 'Recording...';
      this.statusIndicator.classList.add('recording');
    } else {
      this.recordBtn.classList.remove('recording');
      this.recordBtn.innerHTML = '<span class="btn-icon">🎤</span><span class="btn-text">Start Recording</span>';
      this.statusText.textContent = 'Ready to record';
      this.statusIndicator.classList.remove('recording');
    }
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  async showHelp() {
    // Get the current shortcut
    const { customShortcut } = await chrome.storage.sync.get(['customShortcut']);
    const currentShortcut = customShortcut || 'Ctrl+Space';
    
    const helpText = `ZeroType - Speech to Text Extension

How to use:
1. Focus on any text input field
2. Press ${currentShortcut}
3. Speak clearly
4. Press the shortcut again to stop and transcribe

Make sure to configure your Mistral API key in Settings first!`;
    
    alert(helpText);
  }

  openTipJar() {
    chrome.tabs.create({ url: 'https://coff.ee/zerotype' });
  }

  openPrivacyDisclaimer() {
    // Open options page with anchor to scroll directly to privacy disclaimer
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html#privacy-disclaimer') });
  }

  async loadUsageStats() {
    try {
      const today = new Date().toDateString();
      const { usageStats } = await chrome.storage.local.get(['usageStats']);
      
      if (usageStats && usageStats[today]) {
        this.usageCount.textContent = usageStats[today];
      } else {
        this.usageCount.textContent = '0';
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  }

  showError(message) {
    // Create a temporary error notification in the popup
    const errorDiv = document.createElement('div');
    errorDiv.className = 'popup-error';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ZeroTypePopup();
}); 