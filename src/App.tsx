import { useEffect, useRef, useState } from "react";
import { type ChatMessage } from "./types";

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("wss://nonopprobrious-vita-nonprovincially.ngrok-free.dev/ws");
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
      <header className="p-4 text-xl font-semibold border-b border-slate-700">
        Phrasal Verb Tutor
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
