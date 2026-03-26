import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Message {
  id: number;
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
  messages: Message[];
}

const initialChats: Chat[] = [
  {
    id: 1,
    name: "Алексей Петров",
    avatar: "АП",
    lastMessage: "Окей, договорились на завтра!",
    time: "14:32",
    unread: 0,
    online: true,
    messages: [
      { id: 1, text: "Привет! Как дела?", time: "14:20", isOut: false, read: true },
      { id: 2, text: "Всё отлично! Работаю над новым проектом 🚀", time: "14:21", isOut: true, read: true },
      { id: 3, text: "Круто! Расскажи подробнее", time: "14:25", isOut: false, read: true },
      { id: 4, text: "Делаем мессенджер в стиле Telegram, очень интересно получается", time: "14:28", isOut: true, read: true },
      { id: 5, text: "Окей, договорились на завтра!", time: "14:32", isOut: false, read: true },
    ],
  },
  {
    id: 2,
    name: "Мария Иванова",
    avatar: "МИ",
    lastMessage: "Спасибо за помощь! 🙏",
    time: "13:15",
    unread: 3,
    online: true,
    messages: [
      { id: 1, text: "Привет, можешь помочь с документами?", time: "12:00", isOut: false, read: true },
      { id: 2, text: "Конечно, что именно нужно?", time: "12:05", isOut: true, read: true },
      { id: 3, text: "Нужно составить договор", time: "12:10", isOut: false, read: true },
      { id: 4, text: "Хорошо, сейчас подготовлю шаблон", time: "12:15", isOut: true, read: true },
      { id: 5, text: "Спасибо за помощь! 🙏", time: "13:15", isOut: false, read: false },
    ],
  },
  {
    id: 3,
    name: "Команда проекта",
    avatar: "КП",
    lastMessage: "Дизайн утверждён ✅",
    time: "12:00",
    unread: 5,
    online: false,
    messages: [
      { id: 1, text: "Ребята, делаем созвон в 15:00?", time: "10:00", isOut: false, read: true },
      { id: 2, text: "Да, я буду", time: "10:05", isOut: true, read: true },
      { id: 3, text: "Отлично, подготовьте презентации", time: "10:10", isOut: false, read: true },
      { id: 4, text: "Дизайн утверждён ✅", time: "12:00", isOut: false, read: false },
    ],
  },
  {
    id: 4,
    name: "Иван Сидоров",
    avatar: "ИС",
    lastMessage: "Понял, сделаю до вечера",
    time: "Вчера",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Нужно обновить базу данных", time: "09:00", isOut: true, read: true },
      { id: 2, text: "Понял, сделаю до вечера", time: "09:05", isOut: false, read: true },
    ],
  },
  {
    id: 5,
    name: "Анна Козлова",
    avatar: "АК",
    lastMessage: "Встреча перенесена на пятницу",
    time: "Вчера",
    unread: 1,
    online: false,
    messages: [
      { id: 1, text: "Встреча перенесена на пятницу", time: "18:00", isOut: false, read: false },
    ],
  },
  {
    id: 6,
    name: "Дмитрий Новиков",
    avatar: "ДН",
    lastMessage: "👍",
    time: "Пн",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Отчёт готов, скинул на почту", time: "15:00", isOut: true, read: true },
      { id: 2, text: "👍", time: "15:10", isOut: false, read: true },
    ],
  },
];

const avatarColors = [
  "bg-blue-500", "bg-purple-500", "bg-green-500",
  "bg-orange-500", "bg-pink-500", "bg-teal-500",
];

export default function Index() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState<number | null>(1);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, activeChat?.messages.length]);

  const sendMessage = () => {
    if (!inputText.trim() || !activeChatId) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const newMsg: Message = {
      id: Date.now(),
      text: inputText.trim(),
      time,
      isOut: true,
      read: false,
    };
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg.text, time }
          : c
      )
    );
    setInputText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openChat = (id: number) => {
    setActiveChatId(id);
    setChats((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, unread: 0, messages: c.messages.map((m) => ({ ...m, read: true })) }
          : c
      )
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "hsl(var(--tg-chat-bg))" }}>
      {/* Sidebar */}
      <div
        className="flex flex-col border-r transition-all duration-300"
        style={{
          width: sidebarOpen ? "320px" : "72px",
          minWidth: sidebarOpen ? "320px" : "72px",
          background: "hsl(var(--tg-sidebar))",
          borderColor: "hsl(var(--border))",
        }}
      >
        {/* Sidebar Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "hsl(var(--border))", height: "60px" }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-white/10 text-white/60 hover:text-white flex-shrink-0"
          >
            <Icon name="Menu" size={20} />
          </button>
          {sidebarOpen && (
            <div className="relative flex-1 animate-fade-in">
              <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск"
                className="w-full rounded-full py-2 pl-9 pr-4 text-sm outline-none text-white placeholder-white/40"
                style={{ background: "hsl(var(--tg-input-bg))", fontSize: "14px" }}
              />
            </div>
          )}
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat, idx) => (
            <button
              key={chat.id}
              onClick={() => openChat(chat.id)}
              className="w-full flex items-center gap-3 px-3 py-3 transition-colors text-left"
              style={{
                background: activeChatId === chat.id ? "hsl(var(--tg-sidebar-hover))" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (activeChatId !== chat.id)
                  (e.currentTarget as HTMLElement).style.background = "hsl(222 20% 14%)";
              }}
              onMouseLeave={(e) => {
                if (activeChatId !== chat.id)
                  (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <div className="relative flex-shrink-0">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white ${avatarColors[idx % avatarColors.length]}`}
                >
                  {chat.avatar}
                </div>
                {chat.online && (
                  <span
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                    style={{
                      background: "hsl(142 71% 45%)",
                      borderColor: "hsl(var(--tg-sidebar))",
                    }}
                  />
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
                      <span
                        className="ml-2 flex-shrink-0 text-xs text-white font-medium rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
                        style={{ background: "hsl(var(--tg-blue))", fontSize: "11px" }}
                      >
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {sidebarOpen && (
          <div className="p-4 border-t" style={{ borderColor: "hsl(var(--border))" }}>
            <button
              className="w-full flex items-center gap-2 justify-center py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "hsl(var(--tg-blue))" }}
            >
              <Icon name="Plus" size={16} />
              Новый чат
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      {activeChat ? (
        <div className="flex flex-col flex-1 min-w-0">
          {/* Chat Header */}
          <div
            className="flex items-center gap-3 px-5 border-b flex-shrink-0"
            style={{
              background: "hsl(var(--tg-header))",
              borderColor: "hsl(var(--border))",
              height: "60px",
            }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white ${avatarColors[chats.findIndex((c) => c.id === activeChat.id) % avatarColors.length]}`}
              >
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
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <Icon name="Search" size={18} />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <Icon name="MoreVertical" size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-6 py-4 space-y-2"
            style={{
              background: "hsl(var(--tg-chat-bg))",
              backgroundImage: `radial-gradient(circle at 20% 50%, hsl(210 80% 8% / 0.6) 0%, transparent 60%),
                radial-gradient(circle at 80% 20%, hsl(222 40% 6% / 0.4) 0%, transparent 50%)`,
            }}
          >
            {activeChat.messages.map((msg, i) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOut ? "justify-end" : "justify-start"} animate-message-in`}
                style={{ animationDelay: `${i * 0.03}s`, animationFillMode: "both" }}
              >
                <div
                  className="max-w-[65%] px-4 py-2.5"
                  style={{
                    background: msg.isOut ? "hsl(var(--tg-bubble-out))" : "hsl(var(--tg-bubble-in))",
                    borderRadius: msg.isOut ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  }}
                >
                  <p className="text-sm text-white leading-relaxed">{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${msg.isOut ? "justify-end" : "justify-start"}`}>
                    <span className="text-xs" style={{ color: msg.isOut ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.4)" }}>
                      {msg.time}
                    </span>
                    {msg.isOut && (
                      <Icon
                        name={msg.read ? "CheckCheck" : "Check"}
                        size={13}
                        style={{ color: msg.read ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)" }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-t flex-shrink-0"
            style={{
              background: "hsl(var(--tg-header))",
              borderColor: "hsl(var(--border))",
            }}
          >
            <button className="w-9 h-9 flex items-center justify-center rounded-full text-white/50 hover:text-white transition-colors flex-shrink-0">
              <Icon name="Smile" size={22} />
            </button>
            <div
              className="flex-1 flex items-center rounded-full px-4 py-2.5"
              style={{ background: "hsl(var(--tg-input-bg))" }}
            >
              <input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Сообщение..."
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/40"
              />
              <button className="text-white/50 hover:text-white transition-colors ml-2">
                <Icon name="Paperclip" size={18} />
              </button>
            </div>
            <button
              onClick={sendMessage}
              className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 transition-all hover:scale-105 active:scale-95"
              style={{
                background: inputText.trim() ? "hsl(var(--tg-blue))" : "hsl(var(--tg-input-bg))",
                color: inputText.trim() ? "white" : "hsl(var(--muted-foreground))",
              }}
            >
              <Icon name={inputText.trim() ? "Send" : "Mic"} size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center" style={{ background: "hsl(var(--tg-chat-bg))" }}>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ background: "hsl(var(--tg-blue))" }}
          >
            <Icon name="MessageCircle" size={40} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Выберите чат</h2>
          <p className="text-sm text-white/40">Выберите диалог слева, чтобы начать переписку</p>
        </div>
      )}
    </div>
  );
}
