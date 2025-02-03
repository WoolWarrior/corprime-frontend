import { useState, useEffect, useRef } from "react";
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
  const isConnecting = useRef(false);

  useEffect(() => {
    if (!socketRef.current && !isConnecting.current) {
      isConnecting.current = true;

      const socket = io("http://localhost:3000", {
        autoConnect: true,
        transports: ["websocket"],
      });

      // Connection handlers
      socket.on("connect", () => {
        setIsConnected(true);
      });

      socketRef.current = socket;
      socketRef.current.on("message", (message: MessageResponse) => {
        console.log(message);
        setMessageResponses((prev) => [...prev, message]);
      });
    }

    return () => {
      if (socketRef.current && isConnected) {
        socketRef.current.disconnect();
        socketRef.current = null;
        isConnecting.current = false;
      }
    };
  }, []);

  const sendMessage = () => {
    if (input.trim() && socketRef.current?.connected) {
      const newMessage: MessagePayload = {
        content: input,
        public: isPublic,
      };

      // Optimistic update
      // setMessages((prev) => [...prev, newMessage]);

      // Send message through Socket.IO
      socketRef.current.emit("message", newMessage);
      setInput("");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Connection status and priority selector */}
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

      {/* Messages container */}
      <div className="mb-4 h-64 overflow-y-auto border rounded-lg p-2 bg-gray-50">
        {messageResponses.map((messageResponse) => (
          <div
            key={messageResponse.id}
            className={`mb-2 p-2 rounded-lg border`}
            style={{ maxWidth: "80%" }}
          >
            <div className="text-gray-800">{messageResponse.content}</div>
            <div className="text-gray-800">{messageResponse.client}</div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <label className="flex items-center" htmlFor="public">
          <input
            type="checkbox"
            id="public"
            name="public"
            value={isPublic ? "public" : "private"}
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
          />
          Public
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded-lg p-2"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          disabled={!isConnected}
        >
          Send
        </button>
      </div>
    </div>
  );
}
