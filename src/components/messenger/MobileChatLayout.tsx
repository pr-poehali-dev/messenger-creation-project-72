import { useRef } from "react";
import Icon from "@/components/ui/icon";
import { Chat, Message, colorForChat } from "./types";

interface Props {
  chats: Chat[];
  messages: Message[];
  activeChatId: number | null;
  activeChat: Chat | undefined;
  inputText: string;
  search: string;
  loading: boolean;
  sending: boolean;
  keyboardHeight: number;
  onOpenChat: (id: number) => void;
  onGoBack: () => void;
  onSendMessage: () => void;
  onInputChange: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSearchChange: (text: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
}

export default function MobileChatLayout({
  chats,
  messages,
  activeChatId,
  activeChat,
  inputText,
  search,
  loading,
  sending,
  keyboardHeight,
  onOpenChat,
  onGoBack,
  onSendMessage,
  onInputChange,
  onKeyDown,
  onSearchChange,
  messagesEndRef,
  inputRef,
}: Props) {
  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: "100dvh", background: "hsl(var(--tg-chat-bg))" }}
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
              onChange={(e) => onSearchChange(e.target.value)}
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
                onClick={() => onOpenChat(chat.id)}
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
              onClick={onGoBack}
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
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Сообщение..."
              className="flex-1 bg-transparent outline-none text-white placeholder-white/40"
              style={{ fontSize: "16px" }}
            />
          </div>
          <button
            onClick={onSendMessage}
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
