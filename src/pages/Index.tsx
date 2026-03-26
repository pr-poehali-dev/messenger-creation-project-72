import { useState, useRef, useEffect, useCallback } from "react";
import { API_URL, Chat, Message } from "@/components/messenger/types";
import MobileChatLayout from "@/components/messenger/MobileChatLayout";
import DesktopChatLayout from "@/components/messenger/DesktopChatLayout";

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

/* ─── useKeyboardHeight — фикс клавиатуры на iOS ─── */
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

  const commonProps = {
    chats,
    messages,
    activeChatId,
    activeChat,
    inputText,
    search,
    loading,
    sending,
    onOpenChat: openChat,
    onSendMessage: sendMessage,
    onInputChange: setInputText,
    onKeyDown: handleKeyDown,
    onSearchChange: setSearch,
    messagesEndRef,
    inputRef,
  };

  if (isMobile) {
    return (
      <MobileChatLayout
        {...commonProps}
        keyboardHeight={keyboardHeight}
        onGoBack={goBack}
      />
    );
  }

  return (
    <DesktopChatLayout
      {...commonProps}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen((v) => !v)}
      onRefreshMessages={fetchMessages}
    />
  );
}
