// Content script for ZeroType extension
class ZeroTypeContent {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingOverlay = null;
    this.focusedElement = null;
    this.targetElement = null;
    
    this.setupMessageListener();
    this.trackFocusedElement();
    this.createRecordingOverlay();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleRecording') {
        this.toggleRecording();
      }
    });
  }

  trackFocusedElement() {
    // Track focused input elements
    document.addEventListener('focusin', (event) => {
      const element = event.target;
      if (this.isTextInput(element)) {
        this.focusedElement = element;
      }
    });

    document.addEventListener('focusout', () => {
      this.focusedElement = null;
    });
  }

  isTextInput(element) {
    const tagName = element.tagName.toLowerCase();
    const inputTypes = ['text', 'email', 'password', 'search', 'tel', 'url'];
    
    return (
      tagName === 'textarea' ||
      tagName === 'input' && inputTypes.includes(element.type) ||
      element.contentEditable === 'true'
    );
  }

  createRecordingOverlay() {
    this.recordingOverlay = document.createElement('div');
    this.recordingOverlay.id = 'zerotype-recording-overlay';
    this.recordingOverlay.innerHTML = `
      <div class="zerotype-modal">
        <div class="zerotype-icon">🎤</div>
        <div class="zerotype-status">Recording...</div>
        <div class="zerotype-subtitle">Speak now, press Ctrl+Space to stop</div>
        <button class="zerotype-stop-btn">Stop Recording</button>
      </div>
    `;
    
    this.recordingOverlay.querySelector('.zerotype-stop-btn').addEventListener('click', () => {
      this.stopRecording();
    });
    
    document.body.appendChild(this.recordingOverlay);
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
      // Check if there's a focused text input
      if (!this.focusedElement) {
        this.showNotification('Please focus on a text input field first', 'warning');
        return;
      }

      // Store the focused element reference more robustly
      this.targetElement = this.focusedElement;

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
    // Use targetElement (stored during recording start) as fallback if focusedElement is lost
    const element = this.focusedElement || this.targetElement;

    if (!element) {
      this.showNotification('No text field available. Please click on a text input and try again.', 'warning');
      return;
    }

    if (!text) {
      this.showNotification('No text was transcribed to insert.', 'warning');
      return;
    }
    
    try {
      if (element.contentEditable === 'true') {
        // Handle contentEditable elements
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          range.collapse(false);
        } else {
          element.textContent += text;
        }
      } else {
        // Handle input and textarea elements
        const start = element.selectionStart || 0;
        const end = element.selectionEnd || 0;
        const currentValue = element.value || '';
        
        element.value = currentValue.substring(0, start) + text + currentValue.substring(end);
        element.selectionStart = element.selectionEnd = start + text.length;
        
        // Trigger input event for frameworks like React
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // Focus back on the element and update our tracking
      element.focus();
      this.focusedElement = element; // Update the focus tracking
      
    } catch (error) {
      console.error('Error during text insertion:', error);
      this.showNotification('Error inserting text into field', 'error');
    }
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
}

// Initialize content script
new ZeroTypeContent(); 