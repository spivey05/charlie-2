import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  MessageCircle, 
  Loader2, 
  Minimize2, 
  Maximize2,
  HelpCircle,
  Video,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../DataContext';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant() {
  const { currentUser, onlineClasses, schedule, users, resources, learningModel, currentView, setCurrentView, isAIAssistantOpen: isOpen, setIsAIAssistantOpen: setIsOpen } = useData();
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `Hello ${currentUser?.name || 'there'}! I'm your Charlie 2 AI Assistant. How can I help you with your online classes or dashboard today?` 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      // Context for the AI
      const liveClass = onlineClasses.find(c => c.isLive);
      const nextClass = onlineClasses.find(c => !c.isLive && !c.isCompleted);
      const onlineCount = users.filter(u => u.hasReported).length;
      const recentResources = resources.slice(0, 5).map(r => `${r.title} (${r.type})`).join(', ');
      const currentGoals = schedule.slice(0, 3).map(s => s.title).join(', ');
      const modelPhases = learningModel.map(m => `${m.phase}: ${m.desc}`).join(' | ');

      const systemInstruction = `
        You are the Charlie 2 Learning Hub AI Assistant. 
        Your goal is to help users navigate the platform, access online classes, and most importantly, HELP THEM LEARN NEW IDEAS.
        
        Current Context:
        - User: ${currentUser?.name} (Role: ${currentUser?.role})
        - Current View: ${currentView}
        - Live Class: ${liveClass ? `${liveClass.title} (Link: ${liveClass.meetLink || 'Not set yet'})` : 'None'}
        - Next Scheduled Class: ${nextClass ? `${nextClass.title} at ${new Date(nextClass.startTime).toLocaleString()}` : 'None'}
        - Members Online: ${onlineCount}
        - Recent Resources: ${recentResources || 'None available yet'}
        - Active Goals: ${currentGoals || 'None set'}
        - Learning Model: ${modelPhases}
        
        ${currentView === 'online-class' && liveClass ? `
        SPECIAL ONLINE CLASS CONTEXT:
        The user is currently in the Online Class view for "${liveClass.title}".
        - Topic: ${liveClass.title}
        - Goal: Help the user master this topic by connecting it to our Learning Model: ${modelPhases}.
        - Resources: Suggest these specific resources if they relate to the topic: ${recentResources}.
        - Strategy: Explain how the current class fits into the "${learningModel.find(m => m.phase.toLowerCase().includes('active'))?.phase || 'active'}" phase of our model.
        ` : ''}

        Platform Features:
        - Online Classes: Embedded Google Meet. Leaders start them, members join.
        - Dashboard: Shows attendance, participation, mission, and learning model.
        - Privacy: Member emails and registration numbers are hidden from other members.
        
        Instructions:
        - Be helpful, professional, and encouraging.
        - ACT AS A TUTOR: When users ask questions about learning materials, explain concepts clearly.
        - If in an Online Class: Prioritize explaining the topic "${liveClass?.title || 'the current class'}". 
        - Resource Suggestion: Always look at the "Recent Resources" list (${recentResources}) and suggest the most relevant ones.
        - Learning Model Connection: Explicitly mention how the user's question or the class topic relates to one of the Learning Model phases: ${modelPhases}.
        - Help members learn new ideas by connecting their questions to the "Learning Model" phases.
        - If a user asks how to join a class, explain that they should go to the "Online Class" tab and click "Join Class" if it's live.
        - Keep responses concise but informative.
        - Use Markdown for formatting.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: messages.concat({ role: 'user', content: userMessage }).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction
        }
      });

      const aiResponse = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having some trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '64px' : '500px',
              width: '380px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-4 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Charlie 2 Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-medium text-indigo-100 uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50"
                >
                  {messages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm">
                        <Loader2 size={18} className="animate-spin text-indigo-600" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="px-4 py-2 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2 overflow-x-auto no-scrollbar">
                  {currentView === 'online-class' && (
                    <button 
                      onClick={() => setInput('Can you help me understand the learning materials for this class?')}
                      className="whitespace-nowrap px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all border border-emerald-100/50 dark:border-emerald-500/20 flex items-center gap-1"
                    >
                      <Video size={10} /> Class Help
                    </button>
                  )}
                  <button 
                    onClick={() => setInput('Teach me something new about our learning model.')}
                    className="whitespace-nowrap px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all border border-indigo-100/50 dark:border-indigo-500/20 flex items-center gap-1"
                  >
                    <Sparkles size={10} /> Learn New Idea
                  </button>
                  <button 
                    onClick={() => setInput('How do I join a class?')}
                    className="whitespace-nowrap px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20"
                  >
                    Join Class?
                  </button>
                  <button 
                    onClick={() => setInput('What is the mission?')}
                    className="whitespace-nowrap px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20"
                  >
                    Our Mission?
                  </button>
                  <button 
                    onClick={() => setInput('Technical help')}
                    className="whitespace-nowrap px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20"
                  >
                    Tech Support?
                  </button>
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${
          isOpen ? 'bg-rose-500 text-white rotate-90' : 'bg-indigo-600 text-white'
        }`}
      >
        {isOpen ? <X size={28} /> : <Sparkles size={28} />}
      </motion.button>
    </div>
  );
}
