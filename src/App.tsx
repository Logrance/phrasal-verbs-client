import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useAuth } from "./AuthContext";
import LoginPage from "./LoginPage";
import GapFillPanel from "./GapFillPanel";
import { type ChatMessage } from "./types";

export default function App() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showPractice, setShowPractice] = useState(false);
  const [currentVerb, setCurrentVerb] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState<string | null>(null);
  const [wsKey, setWsKey] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function connect() {
      const token = await user!.getIdToken();
      if (cancelled) return;

      const ws = new WebSocket(
        `ws://127.0.0.1:8000/ws/chat?token=${encodeURIComponent(token)}`
      );
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "session_start") {
            setConversationId(data.conversation_id);
            setCurrentVerb(data.current_phrasal_verb ?? null);
            setCurrentLevel(data.level ?? null);
            return;
          }
        } catch {
          // Not JSON — it's a regular chat message
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: event.data },
        ]);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error", err);
      };
    }

    connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, [user, wsKey]);

  const handleAdvance = () => {
    setMessages([]);
    setConversationId(null);
    setShowPractice(false);
    setWsKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const sendMessage = () => {
    if (!input || !wsRef.current) return;

    wsRef.current.send(input);
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="p-4 flex items-center justify-between border-b border-slate-700">
        <div className="flex flex-col">
          <span className="text-xl font-semibold">Phrasal Verb Tutor</span>
          {currentVerb && (
            <span className="text-sm text-emerald-400">
              {currentVerb}
              {currentLevel && (
                <span className="ml-2 text-slate-400">({currentLevel})</span>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPractice(true)}
            disabled={!conversationId || messages.length === 0}
            className="text-sm bg-emerald-600 px-3 py-1 rounded hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Practice
          </button>
          <button
            onClick={() => signOut(auth)}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-xl p-3 rounded-lg ${
              m.role === "user"
                ? "ml-auto bg-blue-600"
                : "mr-auto bg-slate-700"
            }`}
          >
            {m.content}
          </div>
        ))}
      </main>

      <footer className="p-4 flex gap-2 border-t border-slate-700">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 rounded bg-slate-800 p-2 outline-none"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 px-4 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </footer>

      {showPractice && conversationId && (
        <GapFillPanel
          conversationId={conversationId}
          onClose={() => setShowPractice(false)}
          onAdvance={handleAdvance}
        />
      )}
    </div>
  );
}
