import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Monitor, 
  MessageSquare, 
  Smile, 
  PhoneOff, 
  Users,
  Send,
  Heart,
  ThumbsUp,
  Hand,
  Calendar,
  Layout,
  Edit3,
  ScreenShare,
  Maximize2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { useData } from '../DataContext';
import { motion, AnimatePresence } from 'motion/react';
import Whiteboard from '../components/Whiteboard';

const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default function OnlineClassView() {
  const { users, currentUser, onlineClasses, endClass, startClass, onlineUserIds, setCurrentView, setIsAIAssistantOpen, notify } = useData();
  
  const liveClass = onlineClasses.find(c => c.isLive);
  const scheduledClass = onlineClasses.find(c => !c.isLive && !c.isCompleted);
  const activeClass = liveClass || scheduledClass;
  const isLeader = currentUser?.role === 'Group Leader' || currentUser?.role === 'Assistant Leader';

  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [chatMessage, setChatMessage] = useState('');
  const [reactions, setReactions] = useState<{ id: number; type: string; userId: string }[]>([]);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isChatDisabled, setIsChatDisabled] = useState(activeClass?.chatDisabled || false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [meetLinkInput, setMeetLinkInput] = useState('');
  const [messages, setMessages] = useState<{ id: string; author: string; content: string; timestamp: string; userId: string }[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeClass) {
      setIsChatDisabled(activeClass.chatDisabled || false);
    }
  }, [activeClass?.id, activeClass?.chatDisabled]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        notify('error', 'Could not access camera or microphone. Please check permissions.');
      }
    };

    if (activeClass?.isLive && !isWhiteboardOpen) {
      startCamera();
    }

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      setLocalStream(null);
    };
  }, [activeClass?.isLive, isWhiteboardOpen]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });
    }
    if (videoRef.current && localStream && !isVideoOff) {
      videoRef.current.srcObject = localStream;
    }
  }, [isVideoOff, localStream]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  useEffect(() => {
    if (!activeClass || !currentUser) return;

    // Mock chat messages for demonstration
    if (messages.length === 0) {
      setMessages([
        { id: '1', author: 'System', content: `Welcome to ${activeClass.title}!`, timestamp: new Date().toISOString(), userId: 'system' }
      ]);
    }
  }, [activeClass?.id, currentUser?.id]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeClass || !currentUser) return;

    const msg = {
      id: Date.now().toString(),
      author: currentUser.name,
      content: chatMessage,
      timestamp: new Date().toISOString(),
      userId: currentUser.id
    };

    setMessages(prev => [...prev, msg]);
    setChatMessage('');
  };

  const sendReaction = (type: string) => {
    if (!activeClass || !currentUser) return;

    const reaction = {
      id: Date.now(),
      type,
      userId: currentUser.id
    };

    setReactions(prev => [...prev, reaction]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);
  };

  const toggleChat = () => {
    if (!activeClass || !isLeader) return;
    const newStatus = !isChatDisabled;
    setIsChatDisabled(newStatus);
    notify('info', `Class chat ${newStatus ? 'disabled' : 'enabled'}`);
  };

  const startClassWithMeet = () => {
    if (!activeClass || !isLeader) return;
    
    // Generate a random-ish meet link if none provided
    // Format: xxx-xxxx-xxx
    const generateRandomMeetId = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const part = (len: number) => Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      return `${part(3)}-${part(4)}-${part(3)}`;
    };

    const finalLink = meetLinkInput.trim() || `https://meet.google.com/${generateRandomMeetId()}`;
    
    startClass(activeClass.id, finalLink);
  };

  if (!activeClass) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 mb-6">
          <Video size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No Active Classes</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
          There are currently no live or scheduled online classes. Check the Weekly Schedule to see when the next session is.
        </p>
        <button 
          onClick={() => setCurrentView('schedule')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all"
        >
          View Schedule
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative">
      {!activeClass.isLive && (
        <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-500 mb-6">
            <Calendar size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">{activeClass.title}</h3>
          <p className="text-slate-400 max-w-md mb-8">
            This class is scheduled to start on {new Date(activeClass.startTime).toLocaleString()}. 
            Please wait for the Group Leader to start the session.
          </p>
          {!activeClass.isLive && !isLeader && (
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <button 
                onClick={() => {}}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <Video size={20} />
                Join Class
              </button>
            </div>
          )}
          {isLeader && !activeClass.isLive && (
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <div className="flex flex-col gap-2 text-left">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Google Meet Link (Optional)</label>
                <input 
                  type="text"
                  value={meetLinkInput}
                  onChange={(e) => setMeetLinkInput(e.target.value)}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <button 
                onClick={startClassWithMeet}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <Video size={20} />
                Start Class with Google Meet
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {isWhiteboardOpen ? (
            <motion.div 
              key="whiteboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full min-h-[500px]"
            >
              <Whiteboard 
                classId={activeClass.id} 
                isLeader={isLeader} 
              />
            </motion.div>
          ) : (
            <motion.div 
              key="meet-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col"
            >
              {activeClass.isLive ? (
                <div className="flex-1 flex flex-col gap-6">
                  {/* Hero Join Section */}
                  <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-500 mb-6">
                      <Globe size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Google Meet Session is Live</h2>
                    <p className="text-slate-400 max-w-md mb-8">
                      The Group Leader has started the session on Google Meet. Check your audio and video below before joining the external call.
                    </p>

                    {/* Video Preview Section */}
                    <div className="relative w-full max-w-lg aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 mb-8 group shadow-2xl">
                      {isVideoOff ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 backdrop-blur-sm">
                          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4 border border-slate-700 shadow-inner">
                            <VideoOff size={40} />
                          </div>
                          <p className="text-sm font-bold uppercase tracking-widest opacity-50">Camera is off</p>
                        </div>
                      ) : (
                        <video 
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      )}
                      
                      {/* Preview Controls Overlay */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <button 
                          onClick={() => setIsMuted(!isMuted)}
                          className={`p-3 rounded-xl transition-all ${isMuted ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                        >
                          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <button 
                          onClick={() => setIsVideoOff(!isVideoOff)}
                          className={`p-3 rounded-xl transition-all ${isVideoOff ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                          title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                        >
                          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                        </button>
                      </div>

                      {/* Status Indicators */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        {isMuted && (
                          <div className="px-3 py-1 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                            Muted
                          </div>
                        )}
                        {isVideoOff && (
                          <div className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-700 shadow-lg">
                            Video Off
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                      <a 
                        href={activeClass.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 text-lg"
                      >
                        <ExternalLink size={24} />
                        Join Google Meet
                      </a>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-700 w-full flex items-center justify-center gap-4">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                          {getInitials(users.find(u => u.name === activeClass.scheduledBy)?.name)}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Host / Leader</p>
                          <p className="text-sm font-bold text-slate-300">{activeClass.scheduledBy}</p>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-slate-700" />
                      <div className="flex items-center gap-3 text-left">
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
                          <p className="text-sm font-bold text-emerald-400">External Session</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Participant Grid */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Users size={16} />
                        Live Participants ({activeClass.participants.length})
                      </h3>
                    </div>
                    
                    {/* Responsive Dynamic Grid */}
                    <div className={`grid gap-4 ${
                      activeClass.participants.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
                      activeClass.participants.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                      activeClass.participants.length <= 4 ? 'grid-cols-2' :
                      activeClass.participants.length <= 6 ? 'grid-cols-2 md:grid-cols-3' :
                      activeClass.participants.length <= 9 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3' :
                      'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                    }`}>
                      {activeClass.participants.map(pId => {
                        const participant = users.find(u => u.id === pId);
                        const isOnline = onlineUserIds.includes(pId) || participant?.hasReported;
                        const isLeader = participant?.role === 'Group Leader' || participant?.role === 'Assistant Leader';
                        
                        return (
                          <motion.div 
                            key={pId}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col items-center text-center gap-3 aspect-video justify-center relative overflow-hidden group hover:border-indigo-500/50 transition-colors shadow-lg"
                          >
                            <div className="relative z-10">
                              {participant?.profilePicture || participant?.avatar ? (
                                <img 
                                  src={participant.profilePicture || participant.avatar} 
                                  alt={participant.name} 
                                  referrerPolicy="no-referrer"
                                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-slate-700 shadow-xl group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-300 shadow-xl group-hover:scale-105 transition-transform">
                                  {getInitials(participant?.name)}
                                </div>
                              )}
                              {isOnline && (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-slate-800 rounded-full shadow-lg" />
                              )}
                            </div>

                            {/* Info Overlay */}
                            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end justify-between">
                              <div className="text-left">
                                <p className="text-xs font-bold text-white truncate max-w-[120px] flex items-center gap-1.5">
                                  {participant?.name || 'User'}
                                  {isLeader && <ShieldCheck size={12} className="text-indigo-400" />}
                                </p>
                                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">{participant?.role || 'Member'}</p>
                              </div>
                              {isOnline && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 rounded-md">
                                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-[8px] font-bold text-emerald-400 uppercase">Live</span>
                                </div>
                              )}
                            </div>

                            {/* Background Blur Effect */}
                            <div className="absolute inset-0 bg-slate-800/20 group-hover:bg-transparent transition-colors" />
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-24 h-24 bg-indigo-600/10 rounded-full flex items-center justify-center text-indigo-500 mb-6">
                    <Video size={48} />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">Class is Live</h2>
                  <p className="text-slate-400 max-w-lg mb-8 text-lg">
                    Waiting for the leader to provide the Google Meet link...
                  </p>
                </div>
              )}

              {isLeader && activeClass.isLive && (
                <div className="mt-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-between gap-4">
                  <div className="flex-1 flex items-center gap-3">
                    <div className="p-2 bg-indigo-600/20 rounded-lg text-indigo-400">
                      <Video size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Meet Link</p>
                      <p className="text-sm text-slate-300 font-mono truncate">{activeClass.meetLink || 'None set'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={meetLinkInput}
                      onChange={(e) => setMeetLinkInput(e.target.value)}
                      placeholder="New Google Meet link..."
                      className="w-48 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <button 
                      onClick={startClassWithMeet}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
                    >
                      Update
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Reactions */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {reactions.map(r => (
              <motion.div
                key={r.id}
                initial={{ y: '100%', opacity: 0, x: Math.random() * 100 - 50 }}
                animate={{ y: '-100%', opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute bottom-20 left-1/2 text-4xl"
              >
                {r.type === 'heart' && '❤️'}
                {r.type === 'thumbsup' && '👍'}
                {r.type === 'hand' && '✋'}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Sidebar (Chat/Participants) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            className="absolute top-4 right-4 bottom-24 w-80 bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl flex flex-col z-40"
          >
            <div className="flex border-b border-slate-700">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'chat' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Chat
              </button>
              <button 
                onClick={() => setActiveTab('participants')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'participants' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Participants ({activeClass.participants.length})
              </button>
              <div className="flex items-center px-2 gap-1">
                {isLeader && (
                  <button 
                    onClick={toggleChat}
                    className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
                    title={isChatDisabled ? "Enable Chat" : "Disable Chat"}
                  >
                    {isChatDisabled ? <MessageSquare className="opacity-50" size={18} /> : <MessageSquare size={18} />}
                  </button>
                )}
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Close Sidebar"
                >
                  <Maximize2 size={18} className="rotate-45" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === 'chat' ? (
                <div className="flex flex-col h-full">
                  <div className="flex-1 space-y-4">
                    {messages.map(msg => (
                      <div key={msg.id} className="space-y-1">
                        <p className="text-xs font-bold text-indigo-400">{msg.author}</p>
                        <p className="text-sm text-slate-200">{msg.content}</p>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  {isChatDisabled && (
                    <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-center">
                      <p className="text-xs text-rose-400 font-medium">Chat has been disabled by the leader</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {isLeader && activeClass.participants.length > 1 && (
                    <button 
                      onClick={() => notify('info', 'Muting all participants in the class session...')}
                      className="w-full py-2 bg-rose-500/10 text-rose-400 rounded-lg text-xs font-bold hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 mb-4"
                    >
                      <MicOff size={14} />
                      Mute All Participants
                    </button>
                  )}
                  {activeClass.participants.map(pId => {
                    const participant = users.find(u => u.id === pId);
                    const isOnline = onlineUserIds.includes(pId);
                    const isParticipantLeader = participant?.role === 'Group Leader';
                    
                    return (
                      <div key={pId} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                              {getInitials(participant?.name)}
                            </div>
                            {(onlineUserIds.includes(pId) || participant?.hasReported) && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-800 rounded-full" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-200 font-medium">{participant?.name || `User ${pId}`}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{participant?.role || 'Member'}</span>
                          </div>
                        </div>
                        
                        {isLeader && !isParticipantLeader && (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => notify('info', `Muting ${participant?.name}...`)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Mute Participant"
                            >
                              <MicOff size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {activeTab === 'chat' && (
              <div className="p-4 border-t border-slate-700">
                {(isChatDisabled && !isLeader) ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-center">
                    <p className="text-xs text-rose-400 font-medium italic">Chat is currently disabled</p>
                  </div>
                ) : (
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input 
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder={isChatDisabled ? "Chat is disabled (Leader only)" : "Type a message..."}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <button type="submit" className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      <Send size={16} />
                    </button>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Bar */}
      <div className="h-20 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <h4 className="text-sm font-bold text-white truncate max-w-[200px]">{activeClass.title}</h4>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="flex items-center gap-1">
                <Users size={12} />
                {activeClass.participants.length} members
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setIsAIAssistantOpen(true)}
            className="p-3 rounded-full bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 px-4"
            title="AI Assistant"
          >
            <Sparkles size={20} />
            <span className="text-xs font-bold hidden sm:inline">Need Help?</span>
          </button>
          <button 
            onClick={() => notify('info', 'To share your screen, please use the "Present now" feature in Google Meet.')}
            className="p-3 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
            title="Share Screen"
          >
            <Monitor size={20} />
          </button>
          <button 
            onClick={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
            className={`p-3 rounded-full transition-all ${isWhiteboardOpen ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            title="Whiteboard"
          >
            <Edit3 size={20} />
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-3 rounded-full transition-all ${isSidebarOpen ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            title="Toggle Chat"
          >
            <MessageSquare size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => sendReaction('heart')}
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <Heart size={20} />
            </button>
            <button 
              onClick={() => sendReaction('thumbsup')}
              className="p-2 text-slate-400 hover:text-amber-500 transition-colors"
            >
              <ThumbsUp size={20} />
            </button>
            <button 
              onClick={() => sendReaction('hand')}
              className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
            >
              <Hand size={20} />
            </button>
          </div>
          <div className="w-px h-8 bg-slate-800 mx-2 hidden md:block" />
          {isLeader && activeClass.isLive && (
            <button 
              onClick={() => endClass(activeClass.id)}
              className="px-4 py-2 bg-slate-800 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold hover:bg-rose-500/10 transition-all mr-2"
            >
              End Class
            </button>
          )}
          <button 
            onClick={() => {
              setCurrentView('dashboard');
            }}
            className="px-6 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-all flex items-center gap-2"
          >
            <PhoneOff size={18} />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
}
