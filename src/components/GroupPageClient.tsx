"use client";

import { useState, useMemo } from "react";
import { ProfessorTable } from "@/components/ProfessorTable";
import { Search } from "lucide-react";

interface TeacherData {
    teacherName: string;
    disciplines: string[];
    groups: string[];
}

interface Professor {
    id: string;
    name: string;
    teaching_rating: number;
    teaching_count: number;
    proctoring_rating: number;
    proctoring_count: number;
    top_tags: string[];
    is_approved?: boolean;
}

interface GroupPageClientProps {
    allGroups: string[];
    teacherGroupMap: TeacherData[];
    approvedProfessors: Professor[];
}

export function GroupPageClient({ allGroups, teacherGroupMap, approvedProfessors }: GroupPageClientProps) {
    const [selectedGroup, setSelectedGroup] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Filter groups based on search query
    const filteredGroups = useMemo(() => {
        return allGroups.filter((group) =>
            group.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allGroups, searchQuery]);

    // Handle group selection
    const handleSelectGroup = (group: string) => {
        setSelectedGroup(group);
        setSearchQuery("");
        setIsDropdownOpen(false);
    };

    // Get teachers for the selected group based on the JSON mapping
    const groupTeachers = useMemo(() => {
        if (!selectedGroup) return [];

        const relevantTeachers = teacherGroupMap
            .filter((teacher) => teacher.groups.includes(selectedGroup));

        // Filter our allProfessors (from Supabase) by the names we found
        // We do a loose match or exact match depending on how names are stored
        return approvedProfessors.filter((prof) => {
            // Sometimes names might have slight differences (e.g. whitespace, case). Let's do a case-insensitive includes for safety
            return relevantTeachers.some(
                (t) =>
                    t.teacherName.toLowerCase().trim() === prof.name.toLowerCase().trim() ||
                    prof.name.toLowerCase().trim().includes(t.teacherName.toLowerCase().trim()) ||
                    t.teacherName.toLowerCase().trim().includes(prof.name.toLowerCase().trim())
            );
        }).map(prof => {
            const match = relevantTeachers.find(
                (t) =>
                    t.teacherName.toLowerCase().trim() === prof.name.toLowerCase().trim() ||
                    prof.name.toLowerCase().trim().includes(t.teacherName.toLowerCase().trim()) ||
                    t.teacherName.toLowerCase().trim().includes(prof.name.toLowerCase().trim())
            );

            return {
                ...prof,
                disciplines: match ? match.disciplines : []
            };
        });
    }, [selectedGroup, teacherGroupMap, approvedProfessors]);


    return (
        <div className="py-8 sm:py-16 px-4 sm:px-6 w-full h-full flex flex-col antialiased">
            <div className="max-w-4xl mx-auto w-full flex-1">
                <h1 className="text-3xl font-semibold mb-2 text-gray-900 dark:text-white tracking-tight">
                    Find My Group
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm sm:text-base">
                    Select your group to see the ratings of all your teachers.
                </p>

                <div className="relative mb-8 z-20 max-w-md">
                    <label htmlFor="group-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Group
                    </label>
                    <div className="relative">
                        <div className="flex items-center absolute inset-y-0 left-0 pl-3 pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            id="group-search"
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 sm:text-sm text-gray-900 dark:text-white"
                            placeholder={selectedGroup || "Search for a group (e.g. SE-2413)"}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setIsDropdownOpen(true);
                                // Clear selected group if they start typing to search for a new one
                                if (selectedGroup) {
                                    setSelectedGroup("");
                                }
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            onBlur={() => {
                                // Small delay to allow click event on dropdown item to fire
                                setTimeout(() => setIsDropdownOpen(false), 200);
                            }}
                        />
                    </div>

                    {isDropdownOpen && filteredGroups.length > 0 && (
                        <div className="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border border-gray-200 dark:border-gray-700">
                            {filteredGroups.map((group) => (
                                <div
                                    key={group}
                                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedGroup === group ? "bg-gray-50 dark:bg-gray-700 font-medium text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                                        }`}
                                    onClick={() => handleSelectGroup(group)}
                                >
                                    {group}
                                </div>
                            ))}
                        </div>
                    )}
                    {isDropdownOpen && filteredGroups.length === 0 && searchQuery && (
                        <div className="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md py-2 px-3 text-sm text-gray-500 border border-gray-200 dark:border-gray-700">
                            No groups found matching "{searchQuery}"
                        </div>
                    )}
                </div>

                {selectedGroup ? (
                    <div className="mt-8 animate-in fade-in duration-300">
                        <h2 className="text-xl font-medium mb-6 text-gray-800 dark:text-gray-200">
                            Teachers for {selectedGroup}
                        </h2>
                        {groupTeachers.length > 0 ? (
                            <ProfessorTable initialProfessors={groupTeachers} />
                        ) : (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                No teacher ratings found for this group.
                            </div>
                        )}
                    </div>
                ) : null}

            </div>
        </div>
    );
}
