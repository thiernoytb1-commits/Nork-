
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { ChatThread, Message, Role, ModelType } from './types';
import { sendMessageStream } from './services/gemini';
import { SidebarIcon } from './components/Icons';

const LOCAL_STORAGE_KEY = 'gemini-pro-chat-history-v1';

const App: React.FC = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini-3-flash-preview');

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setThreads(parsed);
      if (parsed.length > 0) setActiveThreadId(parsed[0].id);
    } else {
        createNewChat();
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(threads));
    }
  }, [threads]);

  const createNewChat = () => {
    const newThread: ChatThread = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      model: selectedModel,
      updatedAt: Date.now()
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
  };

  const deleteThread = (id: string) => {
    setThreads(prev => {
        const filtered = prev.filter(t => t.id !== id);
        if (activeThreadId === id && filtered.length > 0) {
            setActiveThreadId(filtered[0].id);
        } else if (filtered.length === 0) {
            const newT = {
                id: Date.now().toString(),
                title: 'New Conversation',
                messages: [],
                model: selectedModel,
                updatedAt: Date.now()
            };
            setActiveThreadId(newT.id);
            return [newT];
        }
        return filtered;
    });
  };

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleSendMessage = async (text: string, files: File[], useSearch: boolean) => {
    if (!activeThreadId) return;

    // Convert files to base64
    const fileDataPromises = files.map(async (file) => {
      return new Promise<{ mimeType: string, data: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = (e.target?.result as string).split(',')[1];
          resolve({ mimeType: file.type, data: base64 });
        };
        reader.readAsDataURL(file);
      });
    });

    const attachments = await Promise.all(fileDataPromises);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      parts: [
        { text: text },
        ...attachments.map(a => ({ inlineData: a }))
      ],
      timestamp: Date.now()
    };

    // Update state with user message
    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          messages: [...t.messages, userMessage],
          title: t.messages.length === 0 ? (text.slice(0, 30) || 'Multimodal Chat') : t.title,
          updatedAt: Date.now()
        };
      }
      return t;
    }));

    setIsStreaming(true);

    const modelMessageId = (Date.now() + 1).toString();
    const modelMessage: Message = {
      id: modelMessageId,
      role: Role.MODEL,
      parts: [{ text: '' }],
      timestamp: Date.now()
    };

    // Add empty model message for streaming
    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return { ...t, messages: [...t.messages, modelMessage] };
      }
      return t;
    }));

    let fullResponseText = '';
    try {
      const stream = sendMessageStream(
        selectedModel,
        activeThread?.messages || [],
        text,
        useSearch,
        attachments
      );

      for await (const chunk of stream) {
        fullResponseText += chunk.text;
        setThreads(prev => prev.map(t => {
          if (t.id === activeThreadId) {
            const newMessages = [...t.messages];
            const lastMsgIdx = newMessages.findIndex(m => m.id === modelMessageId);
            if (lastMsgIdx !== -1) {
              newMessages[lastMsgIdx] = { 
                ...newMessages[lastMsgIdx], 
                parts: [{ text: fullResponseText }] 
              };
            }
            return { ...t, messages: newMessages };
          }
          return t;
        }));
      }
    } catch (error) {
      console.error("Stream Error:", error);
      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          const newMessages = [...t.messages];
          const lastMsgIdx = newMessages.findIndex(m => m.id === modelMessageId);
          if (lastMsgIdx !== -1) {
            newMessages[lastMsgIdx] = { 
              ...newMessages[lastMsgIdx], 
              parts: [{ text: "Error: " + (error instanceof Error ? error.message : "Failed to generate response.") }] 
            };
          }
          return { ...t, messages: newMessages };
        }
        return t;
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 font-sans text-zinc-200">
      {/* Sidebar Toggle (Mobile Friendly) */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-3 left-3 z-50 p-2 text-zinc-400 hover:text-white bg-zinc-800/50 backdrop-blur-sm rounded-lg border border-zinc-700 md:hidden"
      >
        <SidebarIcon />
      </button>

      {/* Main Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={setActiveThreadId}
        onNewChat={createNewChat}
        onDeleteThread={deleteThread}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Desktop Sidebar Toggle */}
        <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`hidden md:flex absolute top-4 ${isSidebarOpen ? 'left-4' : 'left-4'} z-40 p-1 text-zinc-500 hover:text-white transition-all`}
            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
            <SidebarIcon />
        </button>

        <ChatArea 
          messages={activeThread?.messages || []} 
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>
    </div>
  );
};

export default App;
