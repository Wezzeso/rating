"use client";

import React, { useState, useTransition } from "react";
import { format } from "date-fns";
import { CheckCircle, Archive, MessageSquare, Clock } from "lucide-react";
import { manageSuggestion } from "@/app/actions";
import { toast } from "sonner";

interface Suggestion {
  id: string;
  text: string;
  status: 'pending' | 'read' | 'archived';
  createdAt: string;
}

export default function SuggestionManager({ initialSuggestions }: { initialSuggestions: Suggestion[] }) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [filter, setFilter] = useState<'all' | 'pending' | 'read' | 'archived'>('all');
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = async (id: string, newStatus: 'read' | 'archived' | 'pending') => {
    startTransition(async () => {
      const result = await manageSuggestion(id, newStatus);
      if (result.success) {
        setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
        toast.success(`Marked as ${newStatus}`);
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    });
  };

  const filteredSuggestions = suggestions.filter(s => filter === 'all' || s.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-gray-100 dark:bg-zinc-900 p-1 rounded-lg w-fit">
        {(['all', 'pending', 'read', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest ${
              filter === f
                ? "bg-white dark:bg-zinc-800 text-gray-950 dark:text-white"
                : "text-gray-500 hover:text-gray-950 dark:hover:text-zinc-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredSuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`py-8 border-t border-gray-100 dark:border-zinc-900 first:border-t-0`}
          >
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    suggestion.status === 'pending' ? "bg-blue-500" : 
                    suggestion.status === 'read' ? "bg-green-500" : "bg-gray-400"
                  }`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                    <Clock size={12} />
                    {format(new Date(suggestion.createdAt), 'MMM d, yyyy • HH:mm')}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-zinc-300 leading-relaxed text-lg font-medium italic">
                  "{suggestion.text}"
                </p>
              </div>
              
              <div className="flex gap-2 shrink-0">
                {suggestion.status !== 'read' && (
                  <button
                    onClick={() => handleStatusChange(suggestion.id, 'read')}
                    disabled={isPending}
                    className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30"
                    title="Mark as Read"
                  >
                    <CheckCircle size={20} />
                  </button>
                )}
                {suggestion.status !== 'archived' && (
                  <button
                    onClick={() => handleStatusChange(suggestion.id, 'archived')}
                    disabled={isPending}
                    className="p-3 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700"
                    title="Archive"
                  >
                    <Archive size={20} />
                  </button>
                )}
                {suggestion.status !== 'pending' && (
                  <button
                    onClick={() => handleStatusChange(suggestion.id, 'pending')}
                    disabled={isPending}
                    className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    title="Mark as Pending"
                  >
                    <MessageSquare size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredSuggestions.length === 0 && (
          <div className="py-12 text-center text-gray-400 italic">
            No suggestions match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
