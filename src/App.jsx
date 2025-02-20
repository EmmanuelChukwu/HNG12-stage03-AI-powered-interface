import React, { useState, useEffect, useRef } from 'react';
import './App.css'
import { MessageBubble } from './components/MessageBubble';
import { SendButton } from './components/SendButton';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isDetectorReady, setIsDetectorReady] = useState(false);
  const [isTranslatorReady, setIsTranslatorReady] = useState(false);
  const [isSummarizerReady, setIsSummarizerReady] = useState(false);
  const [detector, setDetector] = useState(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  
  // Initialize AI APIs
  useEffect(() => {
    const initializeAI = async () => {
      // Check if AI APIs are supported
      if (!('ai' in window)) {
        setError('Your browser doesn\'t support Chrome AI APIs. Please use Chrome and join the Early Preview Program.');
        return;
      }
      
      try {
        // Initialize Language Detector
        if ('languageDetector' in window.ai) {
          const detectorInstance = await window.ai.languageDetector.create();
          setDetector(detectorInstance);
          setIsDetectorReady(true);
        }
        
        // Check if Translator is available
        if ('translator' in window.ai) {
          setIsTranslatorReady(true);
        }
        
        // Check if Summarizer is available
        if ('summarizer' in window.ai) {
          setIsSummarizerReady(true);
        }
      } catch (err) {
        setError(`Error initializing AI APIs: ${err.message}`);
        console.error('AI API initialization error:', err);
      }
    };
    
    initializeAI();
  }, []);
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    try {
      const newMessage = {
        id: Date.now(),
        text: inputText.trim(),
        timestamp: new Date().toISOString(),
        isProcessing: true
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      
      // Detect language if detector is ready
      if (isDetectorReady && detector) {
        const [detectionResult] = await detector.detect(newMessage.text);
        const { detectedLanguage, confidence } = detectionResult;
        
        // Format the language name for display
        const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
        const languageName = displayNames.of(detectedLanguage);
        
        // Update the message with detection results
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? {
            ...msg,
            isProcessing: false,
            detectedLanguage,
            languageName,
            confidence: (confidence * 100).toFixed(1)
          } : msg
        ));
      } else {
        // If detector not ready, just mark as processed
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? {
            ...msg,
            isProcessing: false
          } : msg
        ));
      }
    } catch (err) {
      setError(`Error processing message: ${err.message}`);
      console.error('Message processing error:', err);
      
      // Update message to show error state
      setMessages(prev => prev.map(msg => 
        msg.id === Date.now() ? {
          ...msg,
          isProcessing: false,
          hasError: true
        } : msg
      ));
    }
  };
  
  // Handle text summarization
  const options = {
    sharedContext: 'This is an example of text summarization using Chrome AI APIs.',
    type: 'key-points',
    format: 'plain-text',
    length: 'medium',
  };
  const handleSummarize = async (messageId) => {
    try {
      // Find the message to summarize
      const messageToSummarize = messages.find(msg => msg.id === messageId);
      if (!messageToSummarize) return;
      
      // Update message to show summarizing state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? {
          ...msg,
          isSummarizing: true
        } : msg
      ));
      
      // Create summarizer and summarize text
      const summarizer = await window.ai.summarizer.create(options);
      const summary = await summarizer.summarize(messageToSummarize.text);
      
      // Update message with summary
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? {
          ...msg,
          isSummarizing: false,
          summary
        } : msg
      ));
    } catch (err) {
      setError(`Error summarizing text: ${err.message}`);
      console.error('Summarization error:', err);
      
      // Update message to show error state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? {
          ...msg,
          isSummarizing: false,
          summaryError: true
        } : msg
      ));
    }
  };
  
  // Handle text translation
  const handleTranslate = async (messageId, targetLanguage) => {
    try {
      // Find the message to translate
      const messageToTranslate = messages.find(msg => msg.id === messageId);
      if (!messageToTranslate) return;
      
      // Update message to show translating state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? {
          ...msg,
          isTranslating: true,
          targetLanguage
        } : msg
      ));
      
      // Determine source language
      const sourceLanguage = messageToTranslate.detectedLanguage || 'en';
      
      // Create translator and translate text
      const translator = await window.ai.translator.create({
        sourceLanguage,
        targetLanguage
      });
      
      const translation = await translator.translate(messageToTranslate.text);
      
      // Update message with translation
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? {
          ...msg,
          isTranslating: false,
          translations: {
            ...(msg.translations || {}),
            [targetLanguage]: translation
          }
        } : msg
      ));
    } catch (err) {
      setError(`Error translating text: ${err.message}`);
      console.error('Translation error:', err);
      
      // Update message to show error state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? {
          ...msg,
          isTranslating: false,
          translationError: true
        } : msg
      ));
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="flex justify-center bg-white dark:bg-gray-800 shadow py-4 px-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          AI-Powered Text Processor
        </h1>
      </header>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 mx-6 mt-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">
              Enter some text to start processing
            </p>
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              onSummarize={() => handleSummarize(message.id)}
              onTranslate={handleTranslate}
              canSummarize={isSummarizerReady && 
                message.detectedLanguage === 'en' && 
                message.text.length > 150 &&
                !message.summary}
              canTranslate={isTranslatorReady}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </main>
      
      <footer className="container mx-auto max-w-3xl bg-white dark:bg-gray-800 shadow-md py-4 px-6">
        <div className="flex items-center space-x-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your text here..."
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows="3"
            aria-label="Input text"
          />
          <SendButton onClick={handleSendMessage} />
        </div>
      </footer>
    </div>
  );
}





