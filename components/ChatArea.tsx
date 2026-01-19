
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, ModelType } from '../types';
import { BotIcon, UserIcon, SendIcon, PaperclipIcon, SearchIcon } from './Icons';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string, files: File[], useSearch: boolean) => void;
  isStreaming: boolean;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, 
  onSendMessage, 
  isStreaming,
  selectedModel,
  onModelChange 
}) => {
  const [input, setInput] = useState('');
  const [useSearch, setUseSearch] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || selectedFiles.length > 0) && !isStreaming) {
      onSendMessage(input, selectedFiles, useSearch);
      setInput('');
      setSelectedFiles([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-[#212121] text-zinc-200">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
            <select 
                value={selectedModel} 
                onChange={(e) => onModelChange(e.target.value as ModelType)}
                className="bg-transparent text-lg font-semibold outline-none cursor-pointer hover:bg-zinc-800 rounded px-2 py-1"
            >
                <option value="gemini-3-flash-preview">Flash 3.0</option>
                <option value="gemini-3-pro-preview">Pro 3.0</option>
            </select>
            <span className="text-zinc-500 text-xs mt-1">Experimental</span>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <BotIcon />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
            <p className="max-w-md text-sm">Upload images, ask complex questions, or search the web with the latest Gemini models.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex gap-4 max-w-4xl mx-auto ${m.role === Role.USER ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                m.role === Role.USER ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}>
                {m.role === Role.USER ? <UserIcon /> : <BotIcon />}
              </div>
              <div className={`flex flex-col gap-2 max-w-[85%] ${m.role === Role.USER ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === Role.USER ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-200'
                }`}>
                  {m.parts.map((part, i) => (
                    <React.Fragment key={i}>
                      {part.text && <span>{part.text}</span>}
                      {part.inlineData && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-zinc-700">
                            <img src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="attachment" className="max-h-60 object-contain" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2 bg-zinc-800 rounded-xl border border-zinc-700">
                {selectedFiles.map((file, i) => (
                    <div key={i} className="relative group/file">
                        <div className="w-14 h-14 bg-zinc-700 rounded-lg flex items-center justify-center text-xs overflow-hidden">
                            {file.type.startsWith('image/') ? (
                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                            ) : (
                                <span>{file.name.split('.').pop()?.toUpperCase()}</span>
                            )}
                        </div>
                        <button 
                            type="button"
                            onClick={() => removeFile(i)}
                            className="absolute -top-1 -right-1 bg-red-500 rounded-full text-white w-4 h-4 flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity"
                        >×</button>
                    </div>
                ))}
            </div>
          )}

          <div className="relative flex items-center bg-zinc-800 rounded-2xl border border-zinc-700 shadow-xl focus-within:border-zinc-500 transition-all p-1">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Attach files"
            >
              <PaperclipIcon />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              onChange={handleFileChange}
              accept="image/*,application/pdf,text/*"
            />
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Gemini..."
              rows={1}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                  }
              }}
              className="w-full bg-transparent border-none outline-none py-3 text-zinc-200 placeholder-zinc-500 resize-none max-h-48"
            />

            <button
                type="button"
                onClick={() => setUseSearch(!useSearch)}
                className={`p-2 mr-1 rounded-lg transition-all ${useSearch ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/50' : 'text-zinc-400 hover:text-zinc-200'}`}
                title="Google Search Grounding"
            >
                <SearchIcon />
            </button>

            <button 
              type="submit"
              disabled={(!input.trim() && selectedFiles.length === 0) || isStreaming}
              className={`p-2 rounded-xl transition-all ${
                input.trim() || selectedFiles.length > 0 ? 'bg-white text-black hover:bg-zinc-200' : 'text-zinc-600 cursor-not-allowed'
              }`}
            >
              <SendIcon />
            </button>
          </div>
          <div className="mt-2 text-[10px] text-center text-zinc-500">
            Gemini can make mistakes. Consider checking important information.
          </div>
        </form>
      </div>
    </main>
  );
};

export default ChatArea;
