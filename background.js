// Background script for ZeroType extension
class ZeroTypeBackground {
  constructor() {
    this.setupCommandListener();
    this.setupMessageListener();
  }

  setupCommandListener() {
    chrome.commands.onCommand.addListener(async (command) => {
      if (command === 'start-recording') {
        // Check if user has set a custom shortcut different from default
        const { customShortcut } = await chrome.storage.sync.get(['customShortcut']);
        
        // If custom shortcut exists and is different from default, ignore Chrome's native shortcut
        if (customShortcut && customShortcut !== 'Ctrl+Space') {
          // Custom shortcut is active, ignore the native Chrome shortcut
          return;
        }
        
        // Only proceed if using default shortcut or no custom shortcut set
        this.toggleRecording();
      }
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'transcribe') {
        this.transcribeAudio(request.audioData, request.mimeType)
          .then(result => sendResponse({ success: true, text: result }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
      }
      
      if (request.action === 'getApiKey') {
        chrome.storage.sync.get(['mistralApiKey'], (result) => {
          sendResponse({ apiKey: result.mistralApiKey || '' });
        });
        return true;
      }
    });
  }

  async toggleRecording() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, { action: 'toggleRecording' });
    } catch (error) {
      console.error('Error toggling recording:', error);
    }
  }

  async transcribeAudio(audioData, mimeType = 'audio/webm') {
    try {
      // Get API key from storage
      const { mistralApiKey } = await chrome.storage.sync.get(['mistralApiKey']);
      
      if (!mistralApiKey) {
        throw new Error('Mistral API key not configured. Please set it in extension options.');
      }

      // console.log('🎤 === MISTRAL API REQUEST DEBUG ===');
      // console.log('📊 Raw Audio Data Details:', {
      //   audioDataType: audioData.constructor.name,
      //   audioDataLength: audioData.length,
      //   mimeType: mimeType,
      //   firstFewBytes: audioData.slice(0, 10)
      // });
      
      // Convert regular array back to Uint8Array and then ArrayBuffer
      const audioUint8Array = new Uint8Array(audioData);
      const audioBuffer = audioUint8Array.buffer;
      
      // Create blob from array buffer
      const audioBlob = new Blob([audioBuffer], { type: mimeType });
      
      // console.log('📊 Processed Audio Data Details:', {
      //   originalArrayLength: audioData.length,
      //   uint8ArrayLength: audioUint8Array.length,
      //   bufferByteLength: audioBuffer.byteLength,
      //   blobSize: audioBlob.size,
      //   mimeType: mimeType
      // });
      
      // WAV header validation (commented out for production)
      // if (mimeType.includes('wav')) {
      //   const firstBytes = audioUint8Array.slice(0, 44);
      //   const riffHeader = String.fromCharCode(...firstBytes.slice(0, 4));
      //   const waveHeader = String.fromCharCode(...firstBytes.slice(8, 12));
      //   const fmtHeader = String.fromCharCode(...firstBytes.slice(12, 16));
      //   
      //   console.log('🔊 WAV Header Analysis:', {
      //     riff: riffHeader,
      //     wave: waveHeader,
      //     fmt: fmtHeader,
      //     fileSize: new DataView(firstBytes.buffer).getUint32(4, true),
      //     audioFormat: new DataView(firstBytes.buffer).getUint16(20, true),
      //     channels: new DataView(firstBytes.buffer).getUint16(22, true),
      //     sampleRate: new DataView(firstBytes.buffer).getUint32(24, true),
      //     bitsPerSample: new DataView(firstBytes.buffer).getUint16(34, true),
      //     firstBytesHex: Array.from(firstBytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ')
      //   });
      // }
      
      // Create form data
      const formData = new FormData();
      formData.append('model', 'voxtral-mini-2507');
      
      // Set correct filename and ensure proper format
      let filename;
      if (mimeType.includes('wav')) {
        filename = 'audio.wav';
      } else if (mimeType.includes('mp3')) {
        filename = 'audio.mp3';
      } else {
        // Default to wav for other formats
        filename = 'audio.wav';
        // console.log('⚠️ Unknown format, defaulting to WAV filename');
      }
      
      formData.append('file', audioBlob, filename);
      formData.append('response_format', 'text');

      // console.log('📤 FormData Details:', {
      //   filename: filename,
      //   model: 'voxtral-mini-2507',
      //   responseFormat: 'text',
      //   fileBlob: {
      //     size: audioBlob.size,
      //     type: audioBlob.type
      //   }
      // });

      // console.log('🌐 Making API request to Mistral API...');
      
      const requestStartTime = Date.now();

      // Make API request
      const response = await fetch('https://api.mistral.ai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mistralApiKey}`
        },
        body: formData
      });

      const requestDuration = Date.now() - requestStartTime;
      
      // console.log('📥 API Response Details:', {
      //   status: response.status,
      //   statusText: response.statusText,
      //   ok: response.ok,
      //   duration: `${requestDuration}ms`,
      //   headers: Object.fromEntries(response.headers.entries()),
      //   url: response.url
      // });

      if (!response.ok) {
        const errorText = await response.text();
        let errorDetails;
        
        try {
          errorDetails = JSON.parse(errorText);
          console.error('Mistral API Error:', errorDetails.message || errorText);
        } catch (parseError) {
          console.error('Mistral API Error:', errorText);
        }
        
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const rawResponse = await response.text();
      
      // Parse the response - Mistral returns JSON even when we request text format
      let transcription;
      try {
        const jsonResponse = JSON.parse(rawResponse);
        transcription = jsonResponse.text || rawResponse;
      } catch (parseError) {
        // If it's not JSON, use as-is
        transcription = rawResponse;
      }
      
      // Update usage statistics
      await this.updateUsageStats();
      
      return transcription.trim();

    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  async updateUsageStats() {
    try {
      const today = new Date().toDateString();
      const { usageStats } = await chrome.storage.local.get(['usageStats']);
      const stats = usageStats || {};
      
      stats[today] = (stats[today] || 0) + 1;
      
      // Keep only last 30 days of stats
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      for (const date in stats) {
        if (new Date(date) < thirtyDaysAgo) {
          delete stats[date];
        }
      }
      
      await chrome.storage.local.set({ usageStats: stats });
    } catch (error) {
      console.error('Error updating usage stats:', error);
    }
  }
}

// Initialize background script
try {
  // console.log('🚀 ZeroType Background Script Starting...');
  new ZeroTypeBackground();
  // console.log('✅ ZeroType Background Script Initialized Successfully');
} catch (error) {
  console.error('❌ ZeroType Background Script Failed to Initialize:', error);
} 