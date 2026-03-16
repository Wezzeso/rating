import React from "react";
import { fetchSuggestions, manageSuggestion } from "@/app/actions";
import { format } from "date-fns";
import { MessageCircle, CheckCircle, Archive, AlertCircle } from "lucide-react";
import SuggestionManager from "./SuggestionManager";

export const metadata = {
  title: "Manage Suggestions | Admin Panel",
};

export default async function AdminSuggestionsPage() {
  const result = await fetchSuggestions();

  if (!result.success) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={40} />
        <h2 className="text-xl font-bold text-red-900 dark:text-red-400 mb-2">Error</h2>
        <p className="text-red-600 dark:text-red-500">{result.error}</p>
      </div>
    );
  }

  const suggestions = result.data || [];

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
            Suggestions
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">
            Review and manage student feedback and professor requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MessageCircle className="text-blue-500" size={20} />
          <span className="text-blue-700 dark:text-blue-400 font-bold text-sm">
            {suggestions.filter(s => s.status === 'pending').length} New Suggestions
          </span>
        </div>
      </div>

      <div className="grid gap-6">
        {suggestions.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 dark:bg-zinc-900/40 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
            <MessageCircle className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" size={48} />
            <p className="text-gray-500 dark:text-zinc-500 font-medium">No suggestions yet.</p>
          </div>
        ) : (
          <SuggestionManager initialSuggestions={suggestions} />
        )}
      </div>
    </div>
  );
}
