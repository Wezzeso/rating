"use client";

import { useMemo, useState, useEffect } from "react";
import { StarRating } from "@/components/ui/StarRating";
import { ArrowDown, ArrowUp, Plus, Check } from "lucide-react";
import { Analytics } from "@vercel/analytics/next"
import { RateModal } from "../modals/RateModal";
import { SuggestModal } from "../modals/SuggestModal";
import { useRouter, useSearchParams } from "next/navigation";

interface Professor {
    id: string;
    name: string;
    // department: string; // Removed
    teaching_rating: number;
    teaching_count: number;
    proctoring_rating: number;
    proctoring_count: number;
    top_tags: string[];
    disciplines?: string[];
}

interface ProfessorTableProps {
    initialProfessors: Professor[];
    ratedProfessorIds?: string[];
}

type SortKey = "name" | "teaching_rating" | "proctoring_rating" | null;
type SortDirection = "asc" | "desc";

export function ProfessorTable({ initialProfessors, ratedProfessorIds = [] }: ProfessorTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    useEffect(() => {
        const q = searchParams.get("q");
        if (q !== null && q !== searchQuery) {
            setSearchQuery(q);
        }
    }, [searchParams]);

    const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            // Toggle direction if same key
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            // New key
            setSortKey(key);
            // Default to desc for ratings, asc for name
            setSortDirection(key === "name" ? "asc" : "desc");
        }
    };

    const handleRateClick = (professor: Professor) => {
        setSelectedProfessor(professor);
        setIsModalOpen(true);
    };

    const handleInfoClick = (professor: Professor) => {
        router.push(`/professor/${professor.id}`);
    };

    const handleRateSuccess = () => {
        router.refresh(); // Refresh server data
    };

    const handleSuggestSuccess = () => {
        // Optional: refresh if we want to show it immediately (though it's pending approval)
        // router.refresh(); 
    };

    const filteredAndSortedProfessors = useMemo(() => {
        let result = [...initialProfessors];

        // 1. Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter((prof) =>
                prof.name.toLowerCase().includes(query)
            );
        }

        // 2. Sort
        if (sortKey) {
            result.sort((a, b) => {
                const aValue = a[sortKey];
                const bValue = b[sortKey];

                if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
                if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [initialProfessors, searchQuery, sortKey, sortDirection]);

    const SortIcon = ({ active, direction }: { active: boolean; direction: SortDirection }) => {
        if (!active) return null;
        return direction === "asc" ? (
            <ArrowUp size={12} className="inline ml-1 text-gray-800 dark:text-zinc-200" />
        ) : (
            <ArrowDown size={12} className="inline ml-1 text-gray-800 dark:text-zinc-200" />
        );
    };

    return (
        <div className="w-full">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="w-full max-w-md flex flex-col gap-3">
                    <input
                        id="search"
                        type="text"
                        placeholder="Search for a professor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-800 py-2 text-sm focus:outline-none focus:border-gray-500 dark:focus:border-zinc-400 placeholder:text-gray-400 dark:placeholder:text-zinc-500 font-normal text-gray-900 dark:text-zinc-100 "
                    />
                    {/* Mobile Sort Dropdown */}
                    <div className="sm:hidden flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-2 ">
                        <span className="text-gray-500 dark:text-zinc-400 text-sm">Sort by:</span>
                        <select
                            className="bg-transparent text-sm text-gray-700 dark:text-zinc-100 focus:outline-none cursor-pointer"
                            value={sortKey ? `${sortKey}-${sortDirection}` : "name-asc"}
                            onChange={(e) => {
                                const [key, dir] = e.target.value.split('-');
                                setSortKey(key as SortKey);
                                setSortDirection(dir as SortDirection);
                            }}
                        >
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="teaching_rating-desc">Teaching (Highest)</option>
                            <option value="teaching_rating-asc">Teaching (Lowest)</option>
                            <option value="proctoring_rating-desc">Proctoring (Highest)</option>
                            <option value="proctoring_rating-asc">Proctoring (Lowest)</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={() => setIsSuggestModalOpen(true)}
                    className="w-full sm:w-auto flex justify-center items-center gap-2 text-sm text-gray-600 dark:text-zinc-100 hover:text-gray-900 dark:hover:text-zinc-100  border border-gray-200 dark:border-zinc-800 rounded-md px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-900"
                >
                    <Plus size={16} />
                    Suggest Professor
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse block sm:table">
                    <thead className="hidden sm:table-header-group">
                        <tr className="border-b border-gray-200/50 dark:border-zinc-800/50 ">
                            <th
                                className="py-3 pr-4 font-normal text-gray-400 dark:text-zinc-500 w-1/3 cursor-pointer select-none hover:text-gray-600 dark:hover:text-zinc-300 "
                                onClick={() => handleSort("name")}
                            >
                                Name <SortIcon active={sortKey === "name"} direction={sortDirection} />
                            </th>
                            {/* <th className="py-3 px-4 font-normal text-gray-400">Department</th> */}
                            <th
                                className="py-3 px-4 font-normal text-gray-400 dark:text-zinc-500 cursor-pointer select-none hover:text-gray-600 dark:hover:text-zinc-300 "
                                onClick={() => handleSort("teaching_rating")}
                            >
                                Teaching <SortIcon active={sortKey === "teaching_rating"} direction={sortDirection} />
                            </th>
                            <th
                                className="py-3 px-4 font-normal text-gray-400 dark:text-zinc-500 cursor-pointer select-none hover:text-gray-600 dark:hover:text-zinc-300 "
                                onClick={() => handleSort("proctoring_rating")}
                            >
                                Proctoring <SortIcon active={sortKey === "proctoring_rating"} direction={sortDirection} />
                            </th>
                            <th className="py-3 px-4 hidden md:table-cell font-normal text-gray-400 dark:text-zinc-500 w-1/4">Top Tags</th>
                            <th className="py-3 pl-4 font-normal text-gray-400 dark:text-zinc-500 text-right sm:text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody className="block sm:table-row-group">
                        {filteredAndSortedProfessors.map((prof) => (
                            <tr
                                key={prof.id}
                                className="group border-b border-gray-100/80 dark:border-zinc-800/80 hover:bg-gray-50 dark:hover:bg-zinc-900/50  flex flex-col sm:table-row py-4 sm:py-0"
                            >
                                <td className="sm:py-3 pr-4 font-medium text-gray-900 dark:text-zinc-100 flex flex-col justify-center sm:table-cell">
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-2">
                                            <div>
                                                <div className="text-lg sm:text-sm flex items-center gap-2">
                                                    {prof.name}
                                                    {ratedProfessorIds.includes(prof.id) && (
                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-[10px] font-bold uppercase tracking-wider border border-green-200 dark:border-green-900/50">
                                                            <Check size={10} strokeWidth={3} />
                                                            Rated
                                                        </span>
                                                    )}
                                                </div>
                                                {prof.disciplines && prof.disciplines.length > 0 && (
                                                    <div className="text-xs text-gray-500 dark:text-zinc-400 font-normal mt-0.5">
                                                        {prof.disciplines.join(", ")}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 sm:hidden">
                                            <button
                                                onClick={() => handleInfoClick(prof)}
                                                className="text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-100 text-sm font-medium border border-gray-200 dark:border-zinc-800 rounded-md px-3 py-1 bg-white dark:bg-zinc-700 shadow-sm"
                                            >
                                                Info
                                            </button>
                                            <button
                                                onClick={() => handleRateClick(prof)}
                                                className="text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-100 text-sm font-medium border border-gray-200 dark:border-zinc-800 rounded-md px-3 py-1 bg-white dark:bg-zinc-700 shadow-sm"
                                            >
                                                Rate
                                            </button>
                                        </div>
                                    </div>
                                </td>
                                {/* <td className="py-3 px-4 text-gray-600 font-normal">{prof.department}</td> */}
                                <td className="py-1 px-0 sm:py-3 sm:px-4 flex items-center justify-between sm:table-cell mt-2 sm:mt-0">
                                    <span className="text-gray-500 dark:text-zinc-400 text-sm sm:hidden font-medium">Teaching:</span>
                                    <div className="flex items-center gap-2">
                                        <StarRating rating={prof.teaching_rating} />
                                        <span className="text-xs text-gray-400 dark:text-zinc-500">({prof.teaching_count})</span>
                                    </div>
                                </td>
                                <td className="py-1 px-0 sm:py-3 sm:px-4 flex items-center justify-between sm:table-cell mb-2 sm:mb-0">
                                    <span className="text-gray-500 dark:text-zinc-400 text-sm sm:hidden font-medium">Proctoring:</span>
                                    <div className="flex items-center gap-2">
                                        <StarRating rating={prof.proctoring_rating} />
                                        <span className="text-xs text-gray-400 dark:text-zinc-500">({prof.proctoring_count})</span>
                                    </div>
                                </td>
                                <td className="py-2 px-0 sm:py-3 sm:px-4 sm:hidden md:table-cell md:w-1/4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {prof.top_tags && prof.top_tags.length > 0 ? (
                                            prof.top_tags.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-100 rounded-md text-[10px] sm:text-xs border border-gray-200 dark:border-zinc-800 whitespace-nowrap ">
                                                    {tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 dark:text-zinc-500 italic">No tags</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 pl-4 hidden sm:table-cell text-right sm:text-left">
                                    <div className="flex gap-3 justify-end sm:justify-start items-center">
                                        <button
                                            onClick={() => handleInfoClick(prof)}
                                            className="text-gray-400 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-300 text-xs underline decoration-gray-300 dark:decoration-zinc-600 underline-offset-2"
                                        >
                                            Info
                                        </button>
                                        <button
                                            onClick={() => handleRateClick(prof)}
                                            className="text-gray-400 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-300 text-xs underline decoration-gray-300 dark:decoration-zinc-600 underline-offset-2"
                                        >
                                            Rate
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredAndSortedProfessors.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-400 dark:text-zinc-500 font-normal">
                                    No professors found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedProfessor && (
                <RateModal
                    professor={selectedProfessor}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleRateSuccess}
                />
            )}

            <SuggestModal
                isOpen={isSuggestModalOpen}
                onClose={() => setIsSuggestModalOpen(false)}
            />
        </div>
    );
}
