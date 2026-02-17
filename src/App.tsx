import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useAuth } from "./AuthContext";
import LoginPage from "./LoginPage";
import { type ChatMessage } from "./types";

export default function App() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/chat");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: event.data },
      ]);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (!input || !wsRef.current) return;

    wsRef.current.send(input);
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="p-4 flex items-center justify-between border-b border-slate-700">
        <span className="text-xl font-semibold">Phrasal Verb Tutor</span>
        <button
          onClick={() => signOut(auth)}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
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
    </div>
  );
}
