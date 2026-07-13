import { useEffect, useRef, useState } from "react";
import Message from "./components/Message";
import PromptForm from "./components/PromptForm";
import Sidebar from "./components/Sidebar";
import { Menu } from "lucide-react";
const App = () => {
  // Main app state
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 768);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });
  const [conversations, setConversations] = useState(() => {
    try {
      // Load conversations from localStorage or use default
      const saved = localStorage.getItem("conversations");
      return saved ? JSON.parse(saved) : [{ id: "default", title: "New Chat", messages: [] }];
    } catch {
      return [{ id: "default", title: "New Chat", messages: [] }];
    }
  });
  const [activeConversation, setActiveConversation] = useState(() => {
    return localStorage.getItem("activeConversation") || "default";
  });

  useEffect(() => {
    localStorage.setItem("activeConversation", activeConversation);
  }, [activeConversation]);

  // Save conversations to localStorage
  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }, [conversations]);

  // Handle theme changes
  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Get current active conversation
  const currentConversation = conversations.find((c) => c.id === activeConversation) || conversations[0];

  // Scroll to bottom of container
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Effect to scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [conversations, activeConversation]);

  // Stop response generation mid-way
  const stopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Generate AI response with true streaming
  const generateResponse = async (conversation, botMessageId) => {
    // Format messages for API
    const formattedMessages = conversation.messages?.map((msg) => ({
      role: msg.role === "bot" ? "assistant" : msg.role,
      content: msg.content,
    }));

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      let url = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8000/api/chat";

      const res = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: formattedMessages,
          stream: true
        }),
        signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || `HTTP Error ${res.status}`);
      }

      if (!res.body) {
        throw new Error("API returned an empty response body.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let streamText = "";
      let buffer = "";

      // Set bot message initial streaming state
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversation
            ? {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === botMessageId ? { ...msg, content: "", loading: true } : msg
              ),
            }
            : conv
        )
      );

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.trim() === 'data: [DONE]') break;
          
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            try {
              const chunkData = JSON.parse(dataStr);
              const text = chunkData.choices?.[0]?.delta?.content || "";
              if (text) {
                streamText += text;
                setConversations((prev) =>
                  prev.map((conv) =>
                    conv.id === activeConversation
                      ? {
                        ...conv,
                        messages: conv.messages.map((msg) =>
                          msg.id === botMessageId ? { ...msg, content: streamText } : msg
                        ),
                      }
                      : conv
                  )
                );
                scrollToBottom();
              }
            } catch (e) {
              // Ignore parse errors on partial chunks
            }
          }
        }
      }

      // Complete generation
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversation
            ? {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === botMessageId ? { ...msg, loading: false } : msg
              ),
            }
            : conv
        )
      );
      setIsLoading(false);

    } catch (error) {
      if (error.name === "AbortError") {
        // Handle manual stop by user
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversation
              ? {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === botMessageId
                    ? { ...msg, content: msg.content + " *[Generation stopped]*", loading: false }
                    : msg
                ),
              }
              : conv
          )
        );
      } else {
        updateBotMessage(botMessageId, error.message, true);
      }
      setIsLoading(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Update specific bot message (error recovery)
  const updateBotMessage = (botId, content, isError = false) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversation
          ? {
            ...conv,
            messages: conv.messages.map((msg) => (msg.id === botId ? { ...msg, content, loading: false, error: isError } : msg)),
          }
          : conv
      )
    );
  };
  return (
    <div className={`app-container ${theme === "light" ? "light-theme" : "dark-theme"}`}>
      <div className={`overlay ${isSidebarOpen ? "show" : "hide"}`} onClick={() => setIsSidebarOpen(false)}></div>
      <Sidebar conversations={conversations} setConversations={setConversations} activeConversation={activeConversation} setActiveConversation={setActiveConversation} theme={theme} setTheme={setTheme} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <main className="main-container">
        <header className="main-header">
          <button onClick={() => setIsSidebarOpen(true)} className="sidebar-toggle">
            <Menu size={18} />
          </button>
        </header>
        {currentConversation.messages.length === 0 ? (
          // Welcome container
          <div className="welcome-container">
            <img className="welcome-logo" src="vite.svg" alt="ChatGPT Logo" />
            <h1 className="welcome-heading">Message ChatGPT</h1>
            <p className="welcome-text">Ask me anything about any topic. I'm here to help!</p>
          </div>
        ) : (
          // Messages container
          <div className="messages-container" ref={messagesContainerRef}>
            {currentConversation.messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </div>
        )}
        {/* Prompt input */}
        <div className="prompt-container">
          <div className="prompt-wrapper">
            <PromptForm conversations={conversations} setConversations={setConversations} activeConversation={activeConversation} generateResponse={generateResponse} isLoading={isLoading} setIsLoading={setIsLoading} onStop={stopResponse} />
          </div>
          <p className="disclaimer-text">ChatGPT can make mistakes, so double-check it.</p>
        </div>
      </main>
    </div>
  );
};
export default App;
