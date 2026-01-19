
import React from 'react';
import { ChatThread } from '../types';
import { PlusIcon, TrashIcon, SidebarIcon } from './Icons';

interface SidebarProps {
  threads: ChatThread[];
  activeThreadId: string;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  onDeleteThread: (id: string) => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  threads, 
  activeThreadId, 
  onSelectThread, 
  onNewChat, 
  onDeleteThread,
  isOpen 
}) => {
  return (
    <aside className={`${isOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-[#171717] h-full flex flex-col border-r border-zinc-800 overflow-hidden`}>
      <div className="p-3">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <PlusIcon />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {threads.length === 0 ? (
          <p className="text-zinc-500 text-xs px-3 py-4 text-center">No recent chats</p>
        ) : (
          threads.sort((a, b) => b.updatedAt - a.updatedAt).map((thread) => (
            <div 
              key={thread.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                activeThreadId === thread.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              onClick={() => onSelectThread(thread.id)}
            >
              <span className="text-sm truncate max-w-[160px]">{thread.title || 'New Conversation'}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteThread(thread.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
              >
                <TrashIcon />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500 text-center">
        Powered by Gemini 3.0
      </div>
    </aside>
  );
};

export default Sidebar;
