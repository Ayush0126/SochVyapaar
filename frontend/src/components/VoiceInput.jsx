import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const VoiceInput = ({ onResult, disabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const finalTranscriptRef = useRef('');
  const recognitionRef = useRef(null);

  const isSupported = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const handleResult = useCallback((text) => {
    if (text && text.trim()) {
      onResult(text.trim());
    }
  }, [onResult]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Clean up any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch(e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    finalTranscriptRef.current = '';
    setTranscript('');

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t + ' ';
        } else {
          interim += t;
        }
      }
      
      if (final.trim()) {
        finalTranscriptRef.current = final.trim();
      }
      
      const display = final + interim;
      setTranscript(display.trim());
      console.log('📝 Transcript:', display.trim(), '| Final:', finalTranscriptRef.current);
    };

    recognition.onerror = (event) => {
      console.error('❌ Speech error:', event.error, event.message);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        alert('Microphone permission denied. Please allow microphone access in your browser settings and try again.');
      } else if (event.error === 'no-speech') {
        alert('No speech was detected. Please try again and speak clearly.');
      } else if (event.error !== 'aborted') {
        alert(`Speech error: ${event.error}. Please try again.`);
      }
    };

    recognition.onend = () => {
      console.log('🔇 Speech recognition ended. Final:', finalTranscriptRef.current);
      setIsListening(false);
      
      const text = finalTranscriptRef.current;
      if (text) {
        handleResult(text);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
      console.log('🎤 Recognition.start() called');
    } catch (e) {
      console.error('Failed to start recognition:', e);
      alert('Could not start voice input. Please check microphone permissions.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      console.log('⏹ Stopping recognition...');
      try {
        recognitionRef.current.stop();
      } catch(e) {
        console.error('Error stopping:', e);
      }
    }
  };

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-700">
          ⚠️ Voice input is not supported in this browser. Please use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200'
            : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
        } text-white disabled:opacity-50`}
      >
        {isListening ? (
          <MicOff className="w-7 h-7" />
        ) : (
          <Mic className="w-7 h-7" />
        )}
        {isListening && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full animate-ping" />
        )}
      </button>

      <p className="text-sm text-gray-500 text-center">
        {isListening ? '🔴 Listening... tap to stop' : '🎤 Tap to speak'}
      </p>

      {transcript && (
        <div className="w-full mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 italic">
          "{transcript}"
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
