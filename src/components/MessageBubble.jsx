import { LanguageSelector } from './LanguageSelector';
import { useState } from 'react';


export function MessageBubble({ message, onSummarize, onTranslate, canSummarize, canTranslate }) {
    const [selectedLanguage, setSelectedLanguage] = useState('es');
    
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          {/* Main message content */}
          <p className="text-gray-800 dark:text-white whitespace-pre-wrap">
            {message.text}
          </p>
          
          {/* Language detection result */}
          {message.detectedLanguage && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {message.confidence}% sure this is {message.languageName}
            </p>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {canSummarize && (
              <button
                onClick={onSummarize}
                disabled={message.isSummarizing}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                aria-label="Summarize text"
              >
                {message.isSummarizing ? 'Summarizing...' : 'Summarize'}
              </button>
            )}
            
            {canTranslate && (
              <div className="flex gap-2">
                <LanguageSelector
                  value={selectedLanguage}
                  onChange={setSelectedLanguage}
                />
                <button
                  onClick={() => onTranslate(message.id, selectedLanguage)}
                  disabled={message.isTranslating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  aria-label="Translate text"
                >
                  {message.isTranslating ? 'Translating...' : 'Translate'}
                </button>
              </div>
            )}
          </div>
          
          {/* Summary result */}
          {message.summary && (
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md border-l-4 border-purple-500">
              <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">Summary</h3>
              <p className="text-gray-800 dark:text-white">{message.summary}</p>
            </div>
          )}
          
          {/* Translation results */}
          {message.translations && Object.entries(message.translations).map(([lang, text]) => {
            const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
            const languageName = displayNames.of(lang);
            
            return (
              <div key={lang} className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border-l-4 border-blue-500">
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                  Translated to {languageName}
                </h3>
                <p className="text-gray-800 dark:text-white">{text}</p>
              </div>
            );
          })}
          
          {/* Error states */}
          {message.summaryError && (
            <div className="mt-2 text-sm text-red-600">
              Failed to summarize. Please try again.
            </div>
          )}
          
          {message.translationError && (
            <div className="mt-2 text-sm text-red-600">
              Failed to translate. Please try again.
            </div>
          )}
        </div>
      </div>
    );
  }