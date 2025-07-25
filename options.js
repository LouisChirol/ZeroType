// Options page JavaScript for ZeroType extension

class ZeroTypeOptions {
  constructor() {
    this.apiKeyInput = document.getElementById('api-key');
    this.saveBtn = document.getElementById('save-btn');
    this.testBtn = document.getElementById('test-btn');
    this.status = document.getElementById('status');
    
    this.setupEventListeners();
    this.loadSettings();
  }

  setupEventListeners() {
    this.saveBtn.addEventListener('click', () => this.saveSettings());
    this.testBtn.addEventListener('click', () => this.testApiKey());
    
    // Save on Enter key
    this.apiKeyInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveSettings();
      }
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['mistralApiKey']);
      if (result.mistralApiKey) {
        this.apiKeyInput.value = result.mistralApiKey;
      }
    } catch (error) {
      this.showStatus('Error loading settings', 'error');
    }
  }

  async saveSettings() {
    const apiKey = this.apiKeyInput.value.trim();
    
    if (!apiKey) {
      this.showStatus('Please enter an API key', 'error');
      return;
    }

    // Basic validation - Mistral API keys typically start with specific prefixes
    if (!apiKey.match(/^(mr-|mistral)[a-zA-Z0-9\-_]+$/)) {
      this.showStatus('Invalid API key format. Please check your key.', 'warning');
    }

    try {
      await chrome.storage.sync.set({ mistralApiKey: apiKey });
      this.showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      this.showStatus('Error saving settings', 'error');
    }
  }

  async testApiKey() {
    const apiKey = this.apiKeyInput.value.trim();
    
    if (!apiKey) {
      this.showStatus('Please enter an API key first', 'error');
      return;
    }

    this.showStatus('Testing API key...', 'info');
    this.testBtn.disabled = true;

    try {
      // Create a small test audio blob (silence)
      const testAudioBlob = await this.createTestAudio();
      
      // Test the API
      const formData = new FormData();
      formData.append('model', 'voxtral-mini-2507');
      formData.append('file', testAudioBlob, 'test.webm');
      formData.append('response_format', 'text');

      const response = await fetch('https://api.mistral.ai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (response.ok) {
        this.showStatus('API key is valid! ✅', 'success');
      } else {
        const errorText = await response.text();
        this.showStatus(`API key test failed: ${response.status} - ${errorText}`, 'error');
      }

    } catch (error) {
      this.showStatus(`API test error: ${error.message}`, 'error');
    } finally {
      this.testBtn.disabled = false;
    }
  }

  async createTestAudio() {
    // Create a minimal test audio blob using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const length = audioContext.sampleRate * 0.1; // 0.1 seconds
    const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    
    // Fill with minimal noise
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() - 0.5) * 0.001;
    }

    // Convert AudioBuffer to WAV blob
    const wav = this.audioBufferToWav(buffer);
    return new Blob([wav], { type: 'audio/wav' });
  }

  audioBufferToWav(buffer) {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    const sampleRate = buffer.sampleRate;
    
    // Write WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Write audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return arrayBuffer;
  }

  showStatus(message, type = 'info') {
    this.status.textContent = message;
    this.status.className = `status status-${type}`;
    
    // Clear status after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        this.status.textContent = '';
        this.status.className = 'status';
      }, 5000);
    }
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ZeroTypeOptions();
}); 