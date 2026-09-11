"use client";

import { RefObject } from "react";
import { Message } from "@/app/page";
import { TikZCodeBlock } from "@/components/TikZCodeBlock";

interface Props {
  messages: Message[];
  messagesEndRef: RefObject<HTMLDivElement>;
}

export function ChatPanel({ messages, messagesEndRef }: Props) {
  return (
    <div className="p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "assistant" || msg.role === "system" ? (
            <div className="w-full max-w-full space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-ibm-blue uppercase tracking-wider">
                  Granite
                </span>
                {msg.isLoading && (
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-ibm-blue rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-ibm-blue rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-ibm-blue rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                )}
              </div>

              {msg.content && (
                <p className="text-sm text-ibm-gray100 leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              )}

              {msg.tikzCode && (
                <div className="mt-2">
                  <TikZCodeBlock code={msg.tikzCode} compact />
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-[85%] bg-ibm-blue text-white text-sm px-4 py-2.5 rounded-sm leading-relaxed">
              {msg.content}
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
