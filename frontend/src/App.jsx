import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const App = () => {
  // Initialize messages from localStorage or default
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chat_history');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: "Hello! I'm your AI assistant. How can I help you today?", sender: 'bot' }
    ];
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Persistence: Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = { id: Date.now(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: inputText
      });
      
      const botMessage = { id: Date.now() + 1, text: response.data.responseText, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error fetching chat response:', error);
      // Use the specific error message from the backend if available
      const errorText = error.response?.data?.responseText || "Oops! Something went wrong. Please check your backend and API key.";
      const errorMessage = { id: Date.now() + 2, text: errorText, sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    const resetMessage = { id: Date.now(), text: "Hello! I'm your AI assistant. How can I help you today?", sender: 'bot' };
    setMessages([resetMessage]);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Simple toast-like feedback could go here
  };

  return (
    <div className="w-full max-w-2xl h-[85vh] flex flex-col glass rounded-3xl overflow-hidden shadow-2xl shadow-neon-blue/20">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-neon-green rounded-full shadow-[0_0_10px_#39ff14]"></div>
          <h1 className="text-xl font-bold tracking-tight text-white/90">AI Assistant</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={clearChat}
            className="text-[10px] text-slate-400 font-medium tracking-widest uppercase hover:text-red-400 transition-colors cursor-pointer"
            title="Clear Conversation"
          >
            Clear Chat
          </button>
          <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">NeoChat v1.1</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} group message-appear`}
          >
            <div
              className={`relative max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-lg ${
                msg.sender === 'user'
                  ? 'bg-neon-green/10 text-neon-green border border-neon-green/30 rounded-tr-none'
                  : 'bg-neon-blue/10 text-neon-blue border border-neon-blue/30 rounded-tl-none'
              }`}
            >
              {msg.sender === 'bot' ? (
                <div className="prose prose-invert prose-xs max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                msg.text
              )}
              
              {/* Copy Button for Bot Messages */}
              {msg.sender === 'bot' && (
                <button 
                  onClick={() => copyToClipboard(msg.text)}
                  className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-neon-blue opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Copy to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start message-appear">
            <div className="bg-neon-blue/10 text-neon-blue border border-neon-blue/30 px-5 py-3 rounded-2xl rounded-tl-none flex items-center gap-1">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask me something smart..."
          className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 transition-all text-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue/30 rounded-xl px-6 py-3 font-semibold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default App;
