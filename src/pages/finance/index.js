"use client";
import React, { useState, useRef, useEffect } from "react";
import { MdOutlineChat } from "react-icons/md";
import { FaWindowClose } from "react-icons/fa";
import RootLayout from "../layout";
import ReactMarkDown from "react-markdown";

const FinanceBot = ({ toggleChat = () => {} }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState({
    salary: 0,
    needs: 0,
    wants: 0,
    savings: 0,
    investments: 0,
  });

  const chatRef = useRef(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("financialState");
      if (savedState) {
        setState(JSON.parse(savedState));
      }
    }
  }, []);
  const updateFinancialState = (updates) => {
    const newState = { ...state, ...updates };
    setState(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem("financialState", JSON.stringify(newState));
    }
  };
  const initializeChatbot = () => {
    setChatHistory([
      {
        role: "model",
        parts: ["Hi, I am your Finance Bot. How can I assist you today?"],
      },
    ]);
  };

  useEffect(() => {
    initializeChatbot();
  }, []);

  const handleInput = (e) => {
    setMessageInput(e.target.value);
  };

  const handleChatInput = async () => {
    if (messageInput === "") return;

    setLoading(true);
    try {
      const response = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: messageInput, chatHistory }),
      });
      const data = await response.json();

      setChatHistory([
        ...chatHistory,
        { role: "user", parts: [messageInput] },
        { role: "model", parts: [data.responseText] },
      ]);
      setMessageInput("");
      const response1 = await fetch("/api/financeState", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: messageInput,
          currentState: state,
          chatHistory: chatHistory,
        }),
      });
      const data1 = await response1.json();
      console.log(data1.financialState.currentState);
      updateFinancialState(data1.financialState.currentState);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RootLayout>
      <div
        ref={chatRef}
        className="w-full h-[100vh] flex flex-col justify-between backdrop-blur-lg border bg-black border-zinc-600 p-4 shadow-md z-70 font-Mono"
      >
        <button
          onClick={() => toggleChat()}
          className="absolute -top-5 -right-5 z-10 text-red-500 p-2 font-mono"
        >
          <FaWindowClose size={28} />
        </button>
        <div className="flex flex-col gap-2 overflow-y-auto">
          {chatHistory.map((message, index) => (
            <div
              key={message.role + index}
              className={`text-xl ${
                message.role === "user" ? "text-fuchsia-500" : "text-cyan-300"
              }`}
            >
              <ReactMarkDown>
                {`${
                  message.role === "user" ? "You" : "Finance Bot"
                }: ${message.parts.join("")}`}
              </ReactMarkDown>
            </div>
          ))}
          {loading && <div className="text-center">Loading...</div>}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-white">
          <input
            disabled={loading}
            className="w-full h-full border border-gray-300 px-3 py-2 text-gray-700 rounded-md focus:outline-none"
            placeholder="Type your message"
            onKeyDown={(e) => (e.key === "Enter" ? handleChatInput() : null)}
            onChange={handleInput}
            value={messageInput}
          />
          <button
            className="bg-blue-600 px-4 py-2 text-white rounded-md shadow-md hover:bg-blue-500 disabled:bg-slate-500 focus:outline-none ml-4"
            disabled={messageInput === "" || loading}
            onClick={handleChatInput}
          >
            <MdOutlineChat size={24} />
          </button>
        </div>
      </div>
    </RootLayout>
  );
};

export default FinanceBot;
