"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { DiagramTypeSelector } from "@/components/DiagramTypeSelector";
import { StyleSelector } from "@/components/StyleSelector";
import { TikZCodePanel } from "@/components/TikZCodePanel";
import { ChatPanel } from "@/components/ChatPanel";
import { TopBar } from "@/components/TopBar";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { DiagramPreview } from "@/components/DiagramPreview";

export type DiagramType =
  | "auto"
  | "flowchart"
  | "neural_network"
  | "block_diagram"
  | "state_machine"
  | "sequence_diagram"
  | "tree"
  | "graph"
  | "circuit"
  | "timeline"
  | "mindmap";

export type StyleOption = "minimal" | "standard" | "detailed";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tikzCode?: string;
  isLoading?: boolean;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTikZ, setCurrentTikZ] = useState<string>("");
  const [diagramType, setDiagramType] = useState<DiagramType>("auto");
  const [style, setStyle] = useState<StyleOption>("standard");
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isRefineMode, setIsRefineMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = useCallback((msg: Omit<Message, "id">) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages((prev) => [...prev, { ...msg, id }]);
    return id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  }, []);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isGenerating) return;

    setInputValue("");
    setIsGenerating(true);

    addMessage({ role: "user", content: text });

    const loadingId = addMessage({
      role: "assistant",
      content: "",
      isLoading: true,
    });

    try {
      let action: string;
      let body: Record<string, string>;

      if (isRefineMode && currentTikZ) {
        action = "refine";
        body = {
          action,
          currentCode: currentTikZ,
          instruction: text,
        };
      } else {
        action = "generate";
        body = {
          action,
          description: text,
          diagramType,
          style,
        };
      }

      const res = await fetch("/api/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { result?: string; error?: string };

      if (!res.ok || data.error) {
        updateMessage(loadingId, {
          content: `❌ Error: ${data.error ?? "Unknown error"}`,
          isLoading: false,
        });
        return;
      }

      const tikzCode = data.result ?? "";
      setCurrentTikZ(tikzCode);
      setIsRefineMode(true);

      updateMessage(loadingId, {
        content:
          action === "refine"
            ? "Diagram refined. Updated TikZ code is ready."
            : "TikZ diagram generated. You can copy the code or refine it below.",
        tikzCode,
        isLoading: false,
      });
    } catch (err) {
      updateMessage(loadingId, {
        content: `❌ Network error: ${err instanceof Error ? err.message : String(err)}`,
        isLoading: false,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExplain = async () => {
    if (!currentTikZ || isGenerating) return;
    setIsGenerating(true);

    addMessage({
      role: "user",
      content: "Explain this TikZ diagram and suggest improvements.",
    });

    const loadingId = addMessage({
      role: "assistant",
      content: "",
      isLoading: true,
    });

    try {
      const res = await fetch("/api/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "explain", tikzCode: currentTikZ }),
      });

      const data = (await res.json()) as { result?: string; error?: string };
      updateMessage(loadingId, {
        content: data.result ?? data.error ?? "No explanation returned.",
        isLoading: false,
      });
    } catch (err) {
      updateMessage(loadingId, {
        content: `❌ ${err instanceof Error ? err.message : String(err)}`,
        isLoading: false,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWrap = async () => {
    if (!currentTikZ || isGenerating) return;
    setIsGenerating(true);

    const loadingId = addMessage({
      role: "assistant",
      content: "",
      isLoading: true,
    });

    try {
      const res = await fetch("/api/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "wrap", tikzCode: currentTikZ }),
      });

      const data = (await res.json()) as { result?: string; error?: string };
      updateMessage(loadingId, {
        content: "Wrapped in a standalone LaTeX document for direct compilation.",
        tikzCode: data.result ?? "",
        isLoading: false,
      });
    } catch (err) {
      updateMessage(loadingId, {
        content: `❌ ${err instanceof Error ? err.message : String(err)}`,
        isLoading: false,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewDiagram = () => {
    setIsRefineMode(false);
    setCurrentTikZ("");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {showPreview && currentTikZ && (
        <DiagramPreview
          tikzCode={currentTikZ}
          onClose={() => setShowPreview(false)}
        />
      )}
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — controls + chat */}
        <div className="flex flex-col w-full max-w-xl border-r border-ibm-gray20 bg-white">
          {/* Controls */}
          <div className="border-b border-ibm-gray20 p-4 space-y-3 bg-ibm-gray10">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <DiagramTypeSelector value={diagramType} onChange={setDiagramType} disabled={isRefineMode} />
              </div>
              <div className="flex-1">
                <StyleSelector value={style} onChange={setStyle} disabled={isRefineMode} />
              </div>
            </div>

            {isRefineMode && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-ibm-blue bg-blue-50 border border-ibm-blue/20 px-2 py-1 rounded-sm">
                  REFINE MODE
                </span>
                <button
                  onClick={handleNewDiagram}
                  className="text-xs text-ibm-gray60 underline hover:text-ibm-gray100 transition-colors"
                >
                  Start new diagram
                </button>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <WelcomeBanner onExample={setInputValue} />
            ) : (
              <ChatPanel messages={messages} messagesEndRef={messagesEndRef} />
            )}
          </div>

          {/* Input */}
          <div className="border-t border-ibm-gray20 p-4 bg-white">
            <div className="flex gap-2">
              <textarea
                className="flex-1 resize-none border border-ibm-gray30 bg-white text-sm text-ibm-gray100 placeholder-ibm-gray60 p-3 focus:outline-none focus:border-ibm-blue transition-colors rounded-sm min-h-[72px]"
                placeholder={
                  isRefineMode
                    ? "Describe a change, e.g. 'Make the decision diamond red' or 'Add a label to the final arrow'…"
                    : "Describe your diagram in plain English, e.g. 'A 4-step ML pipeline flowchart with a data validation decision'…"
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isGenerating}
              />
              <button
                onClick={handleSend}
                disabled={isGenerating || !inputValue.trim()}
                className="bg-ibm-blue hover:bg-ibm-blue-hover disabled:bg-ibm-gray30 disabled:text-ibm-gray60 text-white text-sm font-medium px-5 py-2 transition-colors self-end rounded-sm"
              >
                {isGenerating ? "…" : isRefineMode ? "Refine" : "Generate"}
              </button>
            </div>
            <p className="text-xs text-ibm-gray60 mt-2">
              Shift+Enter for newline · Enter to{" "}
              {isRefineMode ? "refine" : "generate"}
            </p>
          </div>
        </div>

        {/* Right panel — TikZ code */}
        <div className="flex-1 overflow-hidden flex flex-col bg-ibm-gray100">
          <TikZCodePanel
            tikzCode={currentTikZ}
            onExplain={handleExplain}
            onWrap={handleWrap}
            onPreview={() => setShowPreview(true)}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
}
