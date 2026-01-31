import React, { useState, useEffect, useRef } from 'react';
import { learningService } from '../services/learningService';
import { useAuth } from '../../../context/AuthContext';
import { useLocation } from 'react-router-dom';

const AIChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const { user } = useAuth();
    const location = useLocation();

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: 'init',
                    sender: 'ai',
                    text: `Hi ${user?.name ? user.name.split(' ')[0] : 'there'}! I'm your ResortWala Assistant. How can I help you grow your business today?`,
                    timestamp: new Date()
                }
            ]);
        }
    }, [user]);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isTyping]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = {
            id: Date.now(),
            sender: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            // Context builder
            const context = {
                page_route: location.pathname,
                vendor_id: user?.id,
                business_name: user?.business_name
            };

            const response = await learningService.sendAIMessage(
                'session_' + user.id,
                userMessage.text,
                context
            );

            const aiMessage = {
                id: Date.now() + 1,
                sender: 'ai',
                text: response?.message || response?.reply || "I'm sorry, I couldn't process that right now.",
                actions: response?.suggested_actions || [],
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'ai',
                text: "I'm having trouble connecting right now. Please try again later.",
                isError: true,
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleActionClick = (action) => {
        if (action.action === 'navigate') {
            window.location.href = '/vendor' + action.payload;
        }
        setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'user',
            text: action.label,
            timestamp: new Date()
        }]);
    };

    const formatTime = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }).format(date);
    };

    return (
        <div className="font-sans antialiased text-gray-900">
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    id="ai-chat-trigger"
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-[9990] bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 group ring-4 ring-blue-100"
                >
                    <span className="text-2xl">🤖</span>
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-semibold">
                        Ask AI Assistant
                    </span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-[9999] w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slide-up h-[80vh] max-h-[600px] ring-1 ring-black/5">
                    {/* Header */}
                    <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-xl backdrop-blur-sm border border-white/20">🤖</div>
                            <div>
                                <h3 className="font-bold text-sm tracking-wide">ResortWala AI</h3>
                                <p className="text-xs text-blue-100 font-medium">Always here to help</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors text-white"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50 scroll-smooth">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`
                                        max-w-[85%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed shadow-sm relative
                                        ${msg.sender === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                                        }
                                        ${msg.isError ? 'bg-red-50 border-red-200 text-red-800' : ''}
                                    `}
                                >
                                    <p className="whitespace-pre-wrap font-medium">{msg.text}</p>

                                    {/* Suggested Actions */}
                                    {msg.actions && msg.actions.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {msg.actions.map((action, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleActionClick(action)}
                                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded-full transition-colors border border-blue-200 font-semibold"
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1.5 px-1 font-medium select-none">
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-2" />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type request like 'Show payment reports'..."
                            className="flex-1 bg-gray-100 text-gray-900 border-0 rounded-xl px-4 py-3 text-sm font-medium placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className={`p-3 rounded-xl bg-blue-600 text-white transition-all ${!input.trim() || isTyping
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-blue-700 shadow-lg hover:shadow-blue-200 active:scale-95'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AIChatWidget;
