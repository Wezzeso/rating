"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProfessorTable } from "@/components/features/ProfessorTable";

interface Professor {
    id: string;
    name: string;
    teaching_rating: number;
    teaching_count: number;
    proctoring_rating: number;
    proctoring_count: number;
    top_tags: string[];
    disciplines?: string[];
}

interface DisciplinePageClientProps {
    professors: Professor[];
    ratedProfessorIds?: string[];
}

interface DisciplineOption {
    key: string;
    label: string;
    count: number;
}

function normalizeValue(value: string) {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function DisciplinePageClient({
    professors,
    ratedProfessorIds = [],
}: DisciplinePageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDiscipline, setSelectedDiscipline] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const disciplineOptions = useMemo(() => {
        const options = new Map<string, DisciplineOption>();

        professors.forEach((professor) => {
            const seenForProfessor = new Set<string>();

            (professor.disciplines || []).forEach((discipline) => {
                const label = discipline.trim();
                if (!label) {
                    return;
                }

                const key = normalizeValue(label);
                if (seenForProfessor.has(key)) {
                    return;
                }

                seenForProfessor.add(key);

                const existing = options.get(key);
                if (existing) {
                    existing.count += 1;
                    return;
                }

                options.set(key, {
                    key,
                    label,
                    count: 1,
                });
            });
        });

        return Array.from(options.values()).sort((a, b) =>
            a.label.localeCompare(b.label)
        );
    }, [professors]);

    useEffect(() => {
        const param = searchParams.get("discipline");
        const normalized = param ? normalizeValue(param) : "";
        const hasMatch = disciplineOptions.some(
            (option) => option.key === normalized
        );

        setSelectedDiscipline(hasMatch ? normalized : "");
    }, [disciplineOptions, searchParams]);

    const filteredDisciplines = useMemo(() => {
        if (!searchQuery) {
            return disciplineOptions;
        }

        const query = searchQuery.toLowerCase();
        return disciplineOptions.filter((option) =>
            option.label.toLowerCase().includes(query)
        );
    }, [disciplineOptions, searchQuery]);

    const selectedOption = useMemo(
        () =>
            disciplineOptions.find(
                (option) => option.key === selectedDiscipline
            ) || null,
        [disciplineOptions, selectedDiscipline]
    );

    const disciplineProfessors = useMemo(() => {
        if (!selectedDiscipline) {
            return [];
        }

        return professors.filter((professor) =>
            (professor.disciplines || []).some(
                (discipline) => normalizeValue(discipline) === selectedDiscipline
            )
        );
    }, [professors, selectedDiscipline]);

    const updateDisciplineParam = (disciplineLabel?: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (disciplineLabel) {
            params.set("discipline", disciplineLabel);
        } else {
            params.delete("discipline");
        }

        const queryString = params.toString();
        router.replace(queryString ? `/disciplines?${queryString}` : "/disciplines", {
            scroll: false,
        });
    };

    const handleSelectDiscipline = (option: DisciplineOption) => {
        setSelectedDiscipline(option.key);
        setSearchQuery("");
        setIsDropdownOpen(false);
        updateDisciplineParam(option.label);
    };

    const handleClearSelection = () => {
        setSelectedDiscipline("");
        setSearchQuery("");
        setIsDropdownOpen(false);
        updateDisciplineParam();
    };

    return (
        <div className="py-8 sm:py-16 px-4 sm:px-6 w-full h-full flex flex-col antialiased">
            <div className="max-w-5xl mx-auto w-full flex-1">
                <h1 className="text-3xl font-semibold mb-2 text-gray-900 dark:text-zinc-100 tracking-tight">
                    Browse by Discipline
                </h1>
                <p className="text-gray-500 dark:text-zinc-400 mb-6 text-sm sm:text-base max-w-2xl">
                    Pick a discipline to see every professor connected to it, then
                    use the table search to narrow the list even further.
                </p>

                <div className="relative mb-8 z-20 max-w-xl">
                    <label
                        htmlFor="discipline-search"
                        className="block text-sm font-medium text-gray-700 dark:text-zinc-100 mb-2"
                    >
                        Select Discipline
                    </label>
                    <div className="relative">
                        <div className="flex items-center absolute inset-y-0 left-0 pl-3 pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            id="discipline-search"
                            type="text"
                            className="block w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-zinc-800 rounded-md leading-5 bg-white dark:bg-zinc-700 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 sm:text-sm text-gray-900 dark:text-zinc-100"
                            placeholder={
                                selectedOption?.label ||
                                "Search for a discipline"
                            }
                            value={searchQuery}
                            onChange={(event) => {
                                setSearchQuery(event.target.value);
                                setIsDropdownOpen(true);

                                if (selectedDiscipline) {
                                    setSelectedDiscipline("");
                                    updateDisciplineParam();
                                }
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            onBlur={() => {
                                setTimeout(() => setIsDropdownOpen(false), 200);
                            }}
                        />
                        {selectedOption && !searchQuery && (
                            <button
                                type="button"
                                onClick={handleClearSelection}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                                aria-label="Clear selected discipline"
                                title="Clear selected discipline"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {isDropdownOpen && filteredDisciplines.length > 0 && (
                        <div className="absolute z-30 mt-1 w-full bg-white dark:bg-zinc-700 shadow-lg max-h-72 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border border-gray-200 dark:border-zinc-800">
                            {filteredDisciplines.map((option) => (
                                <button
                                    key={option.key}
                                    type="button"
                                    className={`w-full text-left cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-zinc-800 ${selectedDiscipline === option.key
                                        ? "bg-gray-50 dark:bg-zinc-800/50 font-medium text-gray-900 dark:text-zinc-100"
                                        : "text-gray-700 dark:text-zinc-100"
                                        }`}
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        handleSelectDiscipline(option);
                                    }}
                                >
                                    <span className="block truncate">
                                        {option.label}
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-zinc-400">
                                        {option.count} professor
                                        {option.count === 1 ? "" : "s"}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {isDropdownOpen &&
                        filteredDisciplines.length === 0 &&
                        searchQuery && (
                            <div className="absolute z-30 mt-1 w-full bg-white dark:bg-zinc-700 shadow-lg rounded-md py-2 px-3 text-sm text-gray-500 border border-gray-200 dark:border-zinc-800">
                                No disciplines found matching "{searchQuery}"
                            </div>
                        )}
                </div>

                {selectedOption ? (
                    <div className="mt-8 animate-in fade-in duration-300">
                        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-medium text-gray-800 dark:text-zinc-200">
                                    Professors teaching {selectedOption.label}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                                    {selectedOption.count} professor
                                    {selectedOption.count === 1 ? "" : "s"} found
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleClearSelection}
                                className="w-full sm:w-auto flex justify-center items-center gap-2 text-sm text-gray-600 dark:text-zinc-100 hover:text-gray-900 dark:hover:text-zinc-100 border border-gray-200 dark:border-zinc-800 rounded-md px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                            >
                                Clear selection
                            </button>
                        </div>

                        <ProfessorTable
                            initialProfessors={disciplineProfessors}
                            ratedProfessorIds={ratedProfessorIds}
                        />
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-950/50 rounded-lg border border-gray-100 dark:border-zinc-800">
                        Search for a discipline to see all matching professors.
                    </div>
                )}
            </div>
        </div>
    );
}
