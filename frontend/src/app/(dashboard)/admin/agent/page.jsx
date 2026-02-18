'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  BotMessageSquare, Send, User, Loader2, Sparkles,
  Plus, BarChart3, GraduationCap, Users, Search,
  MessageSquare, Trash2, Clock, ChevronLeft, PanelLeftClose, PanelLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AgentPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [chatTitle, setChatTitle] = useState('New Chat');
  const [chatList, setChatList] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const userScrolledUpRef = useRef(false);
  const isStreamingRef = useRef(false);

  // Detect manual scroll — if user scrolls up, stop auto-scroll
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distFromBottom = scrollHeight - scrollTop - clientHeight;
      userScrolledUpRef.current = distFromBottom > 80;
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll only if user hasn't scrolled up
  useEffect(() => {
    if (!userScrolledUpRef.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Load chat list on mount
  const fetchChatList = useCallback(async () => {
    try {
      const res = await api.get('/mobility/chats');
      setChatList(res.data.chats || []);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  useEffect(() => { fetchChatList(); }, [fetchChatList]);

  // Load a specific chat
  const loadChat = async (id) => {
    try {
      const res = await api.get(`/mobility/chats/${id}`);
      const chat = res.data.chat;
      setChatId(chat._id);
      setChatTitle(chat.title);
      setMessages(
        chat.messages.map(m => ({
          type: m.role === 'user' ? 'user' : 'agent',
          content: m.content,
          candidates: m.candidates || [],
          meta: m.meta || {}
        }))
      );
    } catch (err) {
      console.error('Failed to load chat:', err);
    }
  };

  // Start new chat
  const startNewChat = () => {
    setChatId(null);
    setChatTitle('New Chat');
    setMessages([]);
    setQuery('');
    inputRef.current?.focus();
  };

  // Delete a chat (with confirmation)
  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      await api.delete(`/mobility/chats/${id}`);
      setChatList(prev => prev.filter(c => c._id !== id));
      if (chatId === id) startNewChat();
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  // Send message with SSE streaming (typing effect)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setLoading(true);
    isStreamingRef.current = true;
    userScrolledUpRef.current = false;

    // Add placeholder for streaming message
    const streamingMsgIndex = messages.length + 1;
    setMessages(prev => [...prev, { type: 'agent', content: '', streaming: true, candidates: [], meta: {} }]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/mobility/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          chatId: chatId || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Stream failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamedContent = '';
      let streamedCandidates = [];
      let streamedMeta = {};
      let newChatId = chatId;
      let newTitle = chatTitle;
      let pendingTokens = [];
      let flushScheduled = false;

      // Batch token updates with requestAnimationFrame for smooth rendering
      const flushTokens = () => {
        if (pendingTokens.length === 0) return;
        const batch = pendingTokens.join('');
        pendingTokens = [];
        flushScheduled = false;
        streamedContent += batch;
        const snapshot = streamedContent;
        setMessages(prev => {
          const updated = [...prev];
          updated[streamingMsgIndex] = { ...updated[streamingMsgIndex], content: snapshot };
          return updated;
        });
      };

      const scheduleFlush = () => {
        if (!flushScheduled) {
          flushScheduled = true;
          requestAnimationFrame(flushTokens);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE: split on double-newline for event boundaries
        const parts = buffer.split('\n');
        buffer = parts.pop() || '';

        let currentEvent = '';

        for (const line of parts) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.substring(6).trim();
            continue;
          }

          if (trimmed.startsWith('data:')) {
            let data;
            try { data = JSON.parse(trimmed.substring(5).trim()); } catch { continue; }

            if (data.content !== undefined) {
              pendingTokens.push(data.content);
              scheduleFlush();
            } else if (data.name) {
              streamedMeta.toolsUsed = streamedMeta.toolsUsed || [];
              if (!streamedMeta.toolsUsed.includes(data.name)) {
                streamedMeta.toolsUsed.push(data.name);
              }
              // Show live tool status while streaming
              const toolLabel = data.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              setMessages(prev => {
                const updated = [...prev];
                updated[streamingMsgIndex] = { ...updated[streamingMsgIndex], toolStatus: `Using ${toolLabel}…` };
                return updated;
              });
            } else if (data.candidates) {
              streamedCandidates = data.candidates;
              setMessages(prev => {
                const updated = [...prev];
                updated[streamingMsgIndex] = { ...updated[streamingMsgIndex], candidates: streamedCandidates };
                return updated;
              });
            } else if (data.chatId) {
              newChatId = data.chatId;
              newTitle = data.title;
              streamedMeta = { ...streamedMeta, ...data.meta };
            } else if (data.message) {
              throw new Error(data.message);
            }

            currentEvent = '';
          }
        }
      }

      // Final flush of any remaining tokens
      flushTokens();

      // Finalize the message
      setMessages(prev => {
        const updated = [...prev];
        updated[streamingMsgIndex] = {
          type: 'agent',
          content: streamedContent,
          candidates: streamedCandidates,
          meta: streamedMeta,
          streaming: false
        };
        return updated;
      });

      // Update chat metadata
      if (!chatId && newChatId) {
        setChatId(newChatId);
        setChatTitle(newTitle || userMessage.substring(0, 80));
        fetchChatList();
      }
    } catch (error) {
      console.error('Stream error:', error);
      const errorMsg = error.message || 'Failed to process query. Please try again.';
      setMessages(prev => {
        const updated = [...prev];
        updated[streamingMsgIndex] = {
          type: 'agent',
          content: errorMsg,
          error: true,
          streaming: false
        };
        return updated;
      });
    } finally {
      isStreamingRef.current = false;
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const sampleQueries = [
    { text: 'Who are the top React & TypeScript experts?', icon: Search },
    { text: 'What are our weakest skills as an org?', icon: BarChart3 },
    { text: 'Build a team for a cloud migration project', icon: Users },
    { text: 'Compare our top DevOps engineers', icon: GraduationCap },
  ];

  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';
  const timeAgo = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-xl border border-border bg-card overflow-hidden">
      {/* ─── Chat History Sidebar ─── */}
      <div
        className={`border-r border-border bg-background flex flex-col shrink-0 transition-all duration-200 ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-3 border-b border-border shrink-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">History</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startNewChat}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : chatList.length === 0 ? (
            <div className="p-4 text-center">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {chatList.map(chat => (
                <div
                  key={chat._id}
                  onClick={() => loadChat(chat._id)}
                  className={`group w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex items-start gap-2 cursor-pointer ${
                    chatId === chat._id
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-50" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium leading-tight">{chat.title}</p>
                    <p className="text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {timeAgo(chat.updatedAt)}
                      <span className="ml-auto">{chat.messageCount} msgs</span>
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(chat._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Main Chat Area ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-card">
          <div className="flex items-center gap-2.5 min-w-0">
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </Button>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">{chatTitle}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                SkillMap AI · GPT-4o
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={startNewChat} className="h-7 text-xs text-muted-foreground shrink-0">
              <Plus className="w-3 h-3 mr-1" /> New
            </Button>
          )}
        </div>

        {/* Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto"
        >
          <div className="p-4 lg:p-5 space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 lg:py-16 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                  <BotMessageSquare className="w-7 h-7 text-primary/70" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h2 className="text-lg font-bold">How can I help you?</h2>
                  <p className="text-sm text-muted-foreground">
                    Ask about top performers, build project teams, compare employees, find skill gaps, or plan career paths.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg pt-1">
                  {sampleQueries.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(q.text); inputRef.current?.focus(); }}
                      className="flex items-center gap-2.5 text-left p-3 rounded-lg border border-border bg-background hover:bg-accent hover:border-primary/20 transition-colors text-sm text-muted-foreground hover:text-foreground"
                    >
                      <q.icon className="w-4 h-4 shrink-0 text-primary/60" />
                      <span className="line-clamp-1">{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'user' ? (
                  <div className="flex items-end gap-2 max-w-[80%]">
                    <div className="px-4 py-2.5 rounded-2xl rounded-br-sm bg-primary text-primary-foreground text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
                      {msg.content}
                    </div>
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-accent text-xs">
                        <User className="w-3.5 h-3.5" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 max-w-[90%]">
                    <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2.5 min-w-0 flex-1">
                      <div className={`px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed wrap-break-word ${
                        msg.error ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-accent border border-border/50'
                      }`}>
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-1.5 last:mb-0 text-sm">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-4 my-1.5 space-y-0.5">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5 space-y-0.5">{children}</ol>,
                            li: ({ children }) => <li className="text-sm">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-bold mt-3 mb-1">{children}</h3>,
                            h4: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1">{children}</h4>,
                            table: ({ children }) => <div className="overflow-x-auto my-2"><table className="min-w-full text-xs border-collapse">{children}</table></div>,
                            thead: ({ children }) => <thead>{children}</thead>,
                            tbody: ({ children }) => <tbody>{children}</tbody>,
                            tr: ({ children }) => <tr>{children}</tr>,
                            th: ({ children }) => <th className="border border-border px-2 py-1 bg-muted text-left font-semibold">{children}</th>,
                            td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
                            code: ({ children }) => <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                            pre: ({ children }) => <pre className="bg-muted p-2 rounded my-1.5 overflow-x-auto text-xs">{children}</pre>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-3 italic my-2 text-muted-foreground">{children}</blockquote>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {msg.candidates?.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-1">
                            Matched Candidates ({msg.candidates.length})
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.candidates.map((c, j) => (
                              <div key={j} className="p-3 rounded-lg bg-background border border-border hover:border-primary/20 transition-colors">
                                <div className="flex items-center gap-2.5 mb-2">
                                  <Avatar className="h-7 w-7 shrink-0">
                                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                                      {initials(c.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate">{c.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{c.role} · {c.department}</p>
                                  </div>
                                  <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
                                    {c.avgScore}%
                                  </Badge>
                                </div>
                                {c.skills?.length > 0 && (
                                  <div className="space-y-1">
                                    {c.skills.slice(0, 3).map((sk, k) => (
                                      <div key={k}>
                                        <div className="flex justify-between text-[10px] mb-0.5">
                                          <span className="text-muted-foreground truncate">{sk.skill}</span>
                                          <span className="font-medium shrink-0 ml-2">{sk.score}%</span>
                                        </div>
                                        <Progress value={sk.score} className="h-1" />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.meta?.toolsUsed?.length > 0 && (
                        <div className="flex items-center gap-1 px-1">
                          {msg.meta.toolsUsed.map((t, k) => (
                            <Badge key={k} variant="outline" className="text-[9px] font-mono py-0 h-4 text-muted-foreground/50">
                              {t.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && !messages.some(m => m.streaming && m.content) && (
              <div className="flex items-start gap-2">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-accent border border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{messages.find(m => m.streaming)?.toolStatus || 'Analyzing data…'}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border bg-card shrink-0">
          <form onSubmit={handleSubmit} className="relative flex items-center max-w-4xl mx-auto">
            <input
              ref={inputRef}
              className="w-full h-11 pl-4 pr-12 rounded-xl border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
              placeholder="Ask about skills, teams, top performers, career roadmaps…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <Button
              type="submit"
              disabled={!query.trim() || loading}
              size="icon"
              className="absolute right-1.5 h-8 w-8 rounded-lg"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-card border border-border rounded-xl p-5 shadow-lg max-w-sm w-full mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold">Delete Conversation</h3>
              <p className="text-xs text-muted-foreground">Are you sure you want to delete this conversation? This action cannot be undone.</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
