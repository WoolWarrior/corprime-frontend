import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { MessagePayload, MessageResponse } from "../types";

export default function SocketIOComponent() {
  const [messageResponses, setMessageResponses] = useState<MessageResponse[]>(
    []
  );
  const [input, setInput] = useState("");
  const [isPublic, setIsPublic] = useState<MessagePayload["public"]>(true);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageResponses]);

  // Focus input when connected
  useEffect(() => {
    if (isConnected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isConnected]);

  // Socket.IO connection management
  useEffect(() => {
    const socket = io(import.meta.env.VITE_WS_ENDPOINT, {
      autoConnect: true,
      transports: ["websocket"],
    });

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleConnectError = (error: Error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
    };
    const handleMessage = (message: MessageResponse) => {
      setMessageResponses((prev) => [...prev, message]);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("message", handleMessage);

    socketRef.current = socket;

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("message", handleMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const sendMessage = useCallback(() => {
    const messageContent = input.trim();
    if (messageContent && socketRef.current?.connected) {
      const newMessage: MessagePayload = {
        content: messageContent,
        public: isPublic,
      };

      socketRef.current.emit("message", newMessage, (error?: Error) => {
        if (error) {
          console.error("Failed to send message:", error);
          return;
        }
        setInput("");
      });
    }
  }, [input, isPublic]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
        setInput("");
      }
    },
    [sendMessage]
  );

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="mb-4 h-64 overflow-y-auto border rounded-lg p-2 bg-gray-50">
        {messageResponses.map((messageResponse) => (
          <div
            key={`${messageResponse.id}-${messageResponse.timestamp}`}
            className="mb-2 p-2 rounded-lg border bg-white"
            style={{ maxWidth: "80%" }}
          >
            <div className="text-sm font-medium text-gray-600">
              {messageResponse.client} says:
            </div>
            <div className="text-gray-800">{messageResponse.content}</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(messageResponse.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
            className="w-4 h-4"
          />
          Public
        </label>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          disabled={!isConnected || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
