"use client";

import { useMemo, useState } from "react";
import { StarRating } from "@/components/ui/StarRating";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { RateModal } from "./RateModal";
import { SuggestModal } from "./SuggestModal";
import { useRouter } from "next/navigation";

interface Professor {
    id: string;
    name: string;
    // department: string; // Removed
    teaching_rating: number;
    teaching_count: number;
    proctoring_rating: number;
    proctoring_count: number;
}

interface ProfessorTableProps {
    initialProfessors: Professor[];
}

type SortKey = "name" | "teaching_rating" | "proctoring_rating" | null;
type SortDirection = "asc" | "desc";

export function ProfessorTable({ initialProfessors }: ProfessorTableProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const [selectedProfessor, setSelectedProfessor] = useState<{ id: string; name: string } | null>(null);
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

    const handleRateClick = (professor: { id: string; name: string }) => {
        setSelectedProfessor(professor);
        setIsModalOpen(true);
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
             <ArrowUp size={12} className="inline ml-1 text-gray-800" />
        ) : (
             <ArrowDown size={12} className="inline ml-1 text-gray-800" />
        );
    };

    return (
        <div className="w-full">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <input
                    type="text"
                    placeholder="Search for a professor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-md bg-transparent border-b border-gray-300 py-2 text-sm focus:outline-none focus:border-gray-500 placeholder:text-gray-400 font-normal"
                />
                <button
                    onClick={() => setIsSuggestModalOpen(true)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50"
                >
                    <Plus size={16} />
                    Suggest Professor
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200/50">
                            <th 
                                className="py-3 pr-4 font-normal text-gray-400 w-1/3 cursor-pointer select-none hover:text-gray-600 transition-colors"
                                onClick={() => handleSort("name")}
                            >
                                Name <SortIcon active={sortKey === "name"} direction={sortDirection} />
                            </th>
                            {/* <th className="py-3 px-4 font-normal text-gray-400">Department</th> */}
                            <th
                                className="py-3 px-4 font-normal text-gray-400 cursor-pointer select-none hover:text-gray-600 transition-colors"
                                onClick={() => handleSort("teaching_rating")}
                            >
                                Teaching <SortIcon active={sortKey === "teaching_rating"} direction={sortDirection} />
                            </th>
                            <th
                                className="py-3 px-4 font-normal text-gray-400 cursor-pointer select-none hover:text-gray-600 transition-colors"
                                onClick={() => handleSort("proctoring_rating")}
                            >
                                Proctoring <SortIcon active={sortKey === "proctoring_rating"} direction={sortDirection} />
                            </th>
                            <th className="py-3 pl-4 font-normal text-gray-400">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedProfessors.map((prof) => (
                            <tr
                                key={prof.id}
                                className="group border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                                <td className="py-3 pr-4 font-medium text-gray-900">{prof.name}</td>
                                {/* <td className="py-3 px-4 text-gray-600 font-normal">{prof.department}</td> */}
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <StarRating rating={prof.teaching_rating} />
                                        <span className="text-xs text-gray-400">({prof.teaching_count})</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <StarRating rating={prof.proctoring_rating} />
                                        <span className="text-xs text-gray-400">({prof.proctoring_count})</span>
                                    </div>
                                </td>
                                <td className="py-3 pl-4">
                                    <button
                                        onClick={() => handleRateClick(prof)}
                                        className="text-gray-400 hover:text-gray-800 text-xs underline decoration-gray-300 underline-offset-2 transition-colors"
                                    >
                                        Rate
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredAndSortedProfessors.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-400 font-normal">
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
