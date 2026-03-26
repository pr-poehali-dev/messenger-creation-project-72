import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/08d65380-8061-4506-a228-896383e6d8e7";

interface Message {
  id: number;
  senderId: number;
  text: string;
  time: string;
  isOut: boolean;
  read: boolean;
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

const avatarColors = [
  "bg-blue-500", "bg-purple-500", "bg-green-500",
  "bg-orange-500", "bg-pink-500", "bg-teal-500",
];
const colorForChat = (id: number) => avatarColors[(id - 1) % avatarColors.length];

/* ─── useIsMobile ─── */
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

/* ─── useVisualViewport — фикс клавиатуры на iOS ─── */
function useKeyboardHeight() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const gap = window.innerHeight - vv.height - vv.offsetTop;
      setOffset(Math.max(0, gap));
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return offset;
}

export default function Index() {
  const isMobile = useIsMobile();
  const keyboardHeight = useKeyboardHeight();

  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  const fetchChats = useCallback(async () => {
    const res = await fetch(`${API_URL}?action=chats`);
    const data = await res.json();
    setChats(data.chats || []);
    setLoading(false);
  }, []);

  const fetchMessages = useCallback(async (chatId: number) => {
    const res = await fetch(`${API_URL}?action=messages&chat_id=${chatId}`);
    const data = await res.json();
    setMessages(data.messages || []);
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)));
  }, []);

  useEffect(() => { fetchChats(); }, [fetchChats]);
  useEffect(() => { if (activeChatId) fetchMessages(activeChatId); }, [activeChatId, fetchMessages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    if (!activeChatId) return;
    const t = setInterval(() => fetchMessages(activeChatId), 5000);
    return () => clearInterval(t);
  }, [activeChatId, fetchMessages]);

  const sendMessage = async () => {
    if (!inputText.trim() || !activeChatId || sending) return;
    const text = inputText.trim();
    setInputText("");
    setSending(true);
    const optimistic: Message = {
      id: Date.now(), senderId: 1, text,
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      isOut: true, read: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    const res = await fetch(`${API_URL}?action=send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: activeChatId, text }),
    });
    const data = await res.json();
    if (data.message) {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data.message : m)));
      setChats((prev) => prev.map((c) => c.id === activeChatId ? { ...c, lastMessage: text, time: data.message.time } : c));
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const openChat = (id: number) => { setActiveChatId(id); setMessages([]); };
  const goBack = () => setActiveChatId(null);

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ── MOBILE LAYOUT ── */
  if (isMobile) {
    return (
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: "100dvh",
          background: "hsl(var(--tg-chat-bg))",
        }}
      >
        {/* Chat list screen */}
        <div
          className="absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out"
          style={{
            transform: activeChatId ? "translateX(-100%)" : "translateX(0)",
            background: "hsl(var(--tg-sidebar))",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 border-b flex-shrink-0"
            style={{
              borderColor: "hsl(var(--border))",
              paddingTop: `calc(env(safe-area-inset-top, 0px) + 12px)`,
              paddingBottom: "12px",
              background: "hsl(var(--tg-header))",
            }}
          >
            <span className="text-white font-semibold text-lg flex-1">Сообщения</span>
            <button
              className="w-9 h-9 flex items-center justify-center rounded-full text-white/60"
              style={{ background: "hsl(var(--tg-input-bg))" }}
            >
              <Icon name="Plus" size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-2 flex-shrink-0" style={{ background: "hsl(var(--tg-header))" }}>
            <div className="relative">
              <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск"
                className="w-full rounded-xl py-2.5 pl-9 pr-4 outline-none text-white placeholder-white/40"
                style={{ background: "hsl(var(--tg-input-bg))", fontSize: "16px" }}
              />
            </div>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            {loading ? (
              <div className="flex items-center justify-center h-20">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => openChat(chat.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-white/5 transition-colors text-left"
                  style={{ minHeight: "72px" }}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-semibold text-white ${colorForChat(chat.id)}`}>
                      {chat.avatar}
                    </div>
                    {chat.online && (
                      <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2"
                        style={{ background: "hsl(142 71% 45%)", borderColor: "hsl(var(--tg-sidebar))" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 border-b py-3" style={{ borderColor: "hsl(var(--border))" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium text-white truncate">{chat.name}</span>
                      <span className="text-xs text-white/40 flex-shrink-0 ml-2">{chat.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-sm text-white/50 truncate">{chat.lastMessage}</span>
                      {chat.unread > 0 && (
                        <span className="ml-2 flex-shrink-0 text-xs text-white font-medium rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
                          style={{ background: "hsl(var(--tg-blue))", fontSize: "11px" }}>
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat screen */}
        <div
          className="absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out"
          style={{
            transform: activeChatId ? "translateX(0)" : "translateX(100%)",
            background: "hsl(var(--tg-chat-bg))",
            paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {/* Chat Header */}
          {activeChat && (
            <div
              className="flex items-center gap-2 px-2 border-b flex-shrink-0"
              style={{
                borderColor: "hsl(var(--border))",
                paddingTop: `calc(env(safe-area-inset-top, 0px) + 8px)`,
                paddingBottom: "8px",
                background: "hsl(var(--tg-header))",
              }}
            >
              <button
                onClick={goBack}
                className="w-10 h-10 flex items-center justify-center rounded-full text-white/70 active:bg-white/10 flex-shrink-0"
              >
                <Icon name="ChevronLeft" size={26} />
              </button>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 ${colorForChat(activeChat.id)}`}>
                {activeChat.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{activeChat.name}</div>
                <div className="text-xs" style={{ color: "hsl(var(--tg-blue))" }}>
                  {activeChat.online ? "в сети" : "был(а) недавно"}
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button className="w-10 h-10 flex items-center justify-center rounded-full text-white/60 active:bg-white/10">
                  <Icon name="Phone" size={20} />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-full text-white/60 active:bg-white/10">
                  <Icon name="MoreVertical" size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, hsl(210 80% 8% / 0.6) 0%, transparent 60%),
                radial-gradient(circle at 80% 20%, hsl(222 40% 6% / 0.4) 0%, transparent 50%)`,
            }}
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isOut ? "justify-end" : "justify-start"} animate-message-in`}
                  style={{ animationDelay: `${Math.min(i * 0.02, 0.3)}s`, animationFillMode: "both" }}
                >
                  <div
                    className="max-w-[78%] px-3.5 py-2"
                    style={{
                      background: msg.isOut ? "hsl(var(--tg-bubble-out))" : "hsl(var(--tg-bubble-in))",
                      borderRadius: msg.isOut ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    }}
                  >
                    <p className="text-sm text-white leading-relaxed">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-0.5 ${msg.isOut ? "justify-end" : "justify-start"}`}>
                      <span className="text-xs" style={{ color: msg.isOut ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.4)", fontSize: "11px" }}>
                        {msg.time}
                      </span>
                      {msg.isOut && (
                        <Icon name={msg.read ? "CheckCheck" : "Check"} size={12}
                          style={{ color: msg.read ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)" }} />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-2 px-3 py-2 border-t flex-shrink-0"
            style={{ background: "hsl(var(--tg-header))", borderColor: "hsl(var(--border))" }}
          >
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-white/50 flex-shrink-0">
              <Icon name="Smile" size={24} />
            </button>
            <div
              className="flex-1 flex items-center rounded-2xl px-4 py-2.5"
              style={{ background: "hsl(var(--tg-input-bg))", minHeight: "44px" }}
            >
              <input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Сообщение..."
                className="flex-1 bg-transparent outline-none text-white placeholder-white/40"
                style={{ fontSize: "16px" }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={sending}
              className="w-11 h-11 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-95 disabled:opacity-60"
              style={{
                background: inputText.trim() ? "hsl(var(--tg-blue))" : "hsl(var(--tg-input-bg))",
                color: inputText.trim() ? "white" : "hsl(var(--muted-foreground))",
              }}
            >
              <Icon name={inputText.trim() ? "Send" : "Mic"} size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── DESKTOP LAYOUT ── */
  return (
    <div className="flex h-screen-safe w-full overflow-hidden" style={{ background: "hsl(var(--tg-chat-bg))" }}>
      {/* Sidebar */}
      <div
        className="flex flex-col border-r transition-all duration-300 flex-shrink-0"
        style={{
          width: sidebarOpen ? "320px" : "72px",
          minWidth: sidebarOpen ? "320px" : "72px",
          background: "hsl(var(--tg-sidebar))",
          borderColor: "hsl(var(--border))",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "hsl(var(--border))", height: "60px" }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-white/10 text-white/60 hover:text-white flex-shrink-0"
          >
            <Icon name="Menu" size={20} />
          </button>
          {sidebarOpen && (
            <div className="relative flex-1 animate-fade-in">
              <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск"
                className="w-full rounded-full py-2 pl-9 pr-4 text-sm outline-none text-white placeholder-white/40"
                style={{ background: "hsl(var(--tg-input-bg))", fontSize: "14px" }} />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button key={chat.id} onClick={() => openChat(chat.id)}
                className="w-full flex items-center gap-3 px-3 py-3 transition-colors text-left"
                style={{ background: activeChatId === chat.id ? "hsl(var(--tg-sidebar-hover))" : "transparent" }}
                onMouseEnter={(e) => { if (activeChatId !== chat.id) (e.currentTarget as HTMLElement).style.background = "hsl(222 20% 14%)"; }}
                onMouseLeave={(e) => { if (activeChatId !== chat.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white ${colorForChat(chat.id)}`}>
                    {chat.avatar}
                  </div>
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                      style={{ background: "hsl(142 71% 45%)", borderColor: "hsl(var(--tg-sidebar))" }} />
                  )}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/90 truncate">{chat.name}</span>
                      <span className="text-xs text-white/40 flex-shrink-0 ml-2">{chat.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-white/50 truncate">{chat.lastMessage}</span>
                      {chat.unread > 0 && (
                        <span className="ml-2 flex-shrink-0 text-xs text-white font-medium rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
                          style={{ background: "hsl(var(--tg-blue))", fontSize: "11px" }}>
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {sidebarOpen && (
          <div className="p-4 border-t" style={{ borderColor: "hsl(var(--border))" }}>
            <button className="w-full flex items-center gap-2 justify-center py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "hsl(var(--tg-blue))" }}>
              <Icon name="Plus" size={16} />
              Новый чат
            </button>
          </div>
        )}
      </div>

      {/* Main */}
      {activeChat ? (
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-3 px-5 border-b flex-shrink-0"
            style={{ background: "hsl(var(--tg-header))", borderColor: "hsl(var(--border))", height: "60px" }}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white ${colorForChat(activeChat.id)}`}>
                {activeChat.avatar}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{activeChat.name}</div>
                <div className="text-xs" style={{ color: "hsl(var(--tg-blue))" }}>
                  {activeChat.online ? "в сети" : "был(а) недавно"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <Icon name="Phone" size={18} />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <Icon name="Video" size={18} />
              </button>
              <button onClick={() => fetchMessages(activeChat.id)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <Icon name="RefreshCw" size={16} />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <Icon name="MoreVertical" size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2"
            style={{
              background: "hsl(var(--tg-chat-bg))",
              backgroundImage: `radial-gradient(circle at 20% 50%, hsl(210 80% 8% / 0.6) 0%, transparent 60%),
                radial-gradient(circle at 80% 20%, hsl(222 40% 6% / 0.4) 0%, transparent 50%)`,
            }}>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={msg.id}
                  className={`flex ${msg.isOut ? "justify-end" : "justify-start"} animate-message-in`}
                  style={{ animationDelay: `${Math.min(i * 0.02, 0.3)}s`, animationFillMode: "both" }}>
                  <div className="max-w-[65%] px-4 py-2.5"
                    style={{
                      background: msg.isOut ? "hsl(var(--tg-bubble-out))" : "hsl(var(--tg-bubble-in))",
                      borderRadius: msg.isOut ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    }}>
                    <p className="text-sm text-white leading-relaxed">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1 ${msg.isOut ? "justify-end" : "justify-start"}`}>
                      <span className="text-xs" style={{ color: msg.isOut ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.4)" }}>
                        {msg.time}
                      </span>
                      {msg.isOut && (
                        <Icon name={msg.read ? "CheckCheck" : "Check"} size={13}
                          style={{ color: msg.read ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)" }} />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border-t flex-shrink-0"
            style={{ background: "hsl(var(--tg-header))", borderColor: "hsl(var(--border))" }}>
            <button className="w-9 h-9 flex items-center justify-center rounded-full text-white/50 hover:text-white transition-colors flex-shrink-0">
              <Icon name="Smile" size={22} />
            </button>
            <div className="flex-1 flex items-center rounded-full px-4 py-2.5" style={{ background: "hsl(var(--tg-input-bg))" }}>
              <input ref={inputRef} value={inputText} onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown} placeholder="Сообщение..."
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/40"
                style={{ fontSize: "14px" }} />
              <button className="text-white/50 hover:text-white transition-colors ml-2">
                <Icon name="Paperclip" size={18} />
              </button>
            </div>
            <button onClick={sendMessage} disabled={sending}
              className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
              style={{
                background: inputText.trim() ? "hsl(var(--tg-blue))" : "hsl(var(--tg-input-bg))",
                color: inputText.trim() ? "white" : "hsl(var(--muted-foreground))",
              }}>
              <Icon name={inputText.trim() ? "Send" : "Mic"} size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center" style={{ background: "hsl(var(--tg-chat-bg))" }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: "hsl(var(--tg-blue))" }}>
            <Icon name="MessageCircle" size={40} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Выберите чат</h2>
          <p className="text-sm text-white/40">Выберите диалог слева, чтобы начать переписку</p>
        </div>
      )}
    </div>
  );
}
