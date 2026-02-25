"use client";

import React, { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { getSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Check,
    X,
    LogOut,
    ArrowUp,
    ArrowDown,
    RefreshCw,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import {
    approveProfessor,
    rejectProfessor,
    fetchPendingProfessors,
    verifyTeacherInAITU,
    checkDuplicateInDB,
    loginAsAdmin,
    logoutAdmin,
    checkAdminAuth
} from "@/app/actions";

interface Professor {
    id: string;
    name: string;
    department: string;
    created_at: string;
    aitu_verified: boolean | null;
    is_duplicate: boolean | null;
}

interface VerificationStatus {
    loading: boolean;
    existsInAITU: boolean | null;
    isDuplicate: boolean | null;
    matches: { nameKz: string; surnameKz: string; department: string | null }[];
    existingName?: string;
    error?: string;
}

type SortKey = "name" | "department" | "created_at" | "status";
type SortDirection = "asc" | "desc";

export default function AdminPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState("");
    const [professors, setProfessors] = useState<Professor[]>([]);
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [verificationMap, setVerificationMap] = useState<Record<string, VerificationStatus>>({});
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Verify a single professor against AITU API + duplicate check
    const verifyProfessor = useCallback(async (prof: Professor) => {
        setVerificationMap((prev) => ({
            ...prev,
            [prof.id]: { loading: true, existsInAITU: null, isDuplicate: null, matches: [] },
        }));

        try {
            const [aituResult, dupResult] = await Promise.all([
                verifyTeacherInAITU(prof.id, prof.name),
                checkDuplicateInDB(prof.id, prof.name),
            ]);

            // Update local professor data with the saved results
            setProfessors((prev) =>
                prev.map((p) =>
                    p.id === prof.id
                        ? {
                            ...p,
                            aitu_verified: aituResult.success ? aituResult.existsInAITU : p.aitu_verified,
                            is_duplicate: dupResult.success ? dupResult.isDuplicate : p.is_duplicate,
                        }
                        : p
                )
            );

            setVerificationMap((prev) => ({
                ...prev,
                [prof.id]: {
                    loading: false,
                    existsInAITU: aituResult.success ? aituResult.existsInAITU : null,
                    isDuplicate: dupResult.success ? dupResult.isDuplicate : null,
                    matches: aituResult.matches || [],
                    existingName: dupResult.existingName,
                    error: aituResult.error || dupResult.error || undefined,
                },
            }));
        } catch {
            setVerificationMap((prev) => ({
                ...prev,
                [prof.id]: {
                    loading: false,
                    existsInAITU: null,
                    isDuplicate: null,
                    matches: [],
                    error: "Verification failed",
                },
            }));
        }
    }, []);

    // Verify only professors that haven't been checked yet
    const verifyUnchecked = useCallback(
        (profs: Professor[]) => {
            const unchecked = profs.filter(
                (p) =>
                    (p.aitu_verified === null || p.aitu_verified === undefined) ||
                    (p.is_duplicate === null || p.is_duplicate === undefined)
            );
            unchecked.forEach((p) => verifyProfessor(p));
        },
        [verifyProfessor]
    );

    // Re-verify all professors (force re-check)
    const verifyAll = useCallback(
        (profs: Professor[]) => {
            profs.forEach((p) => verifyProfessor(p));
        },
        [verifyProfessor]
    );

    useEffect(() => {
        const initAuth = async () => {
            const authResult = await checkAdminAuth();
            if (authResult.isAdmin) {
                setIsAuthenticated(true);
                loadPendingProfessors();
            } else {
                setIsAuthenticated(false);
            }
            setLoading(false);
        };
        initAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadPendingProfessors = async () => {
        const result = await fetchPendingProfessors();
        if (!result.success) {
            toast.error(result.error || "Error fetching suggestions");
        } else {
            const profs = (result.data || []) as Professor[];
            setProfessors(profs);

            // Initialize verification status from cached DB values
            const initialMap: Record<string, VerificationStatus> = {};
            profs.forEach((p) => {
                const hasAitu = p.aitu_verified !== null && p.aitu_verified !== undefined;
                const hasDup = p.is_duplicate !== null && p.is_duplicate !== undefined;
                if (hasAitu || hasDup) {
                    initialMap[p.id] = {
                        loading: false,
                        existsInAITU: hasAitu ? p.aitu_verified : null,
                        isDuplicate: hasDup ? p.is_duplicate : null,
                        matches: [],
                    };
                }
            });
            setVerificationMap(initialMap);

            // Only verify unchecked professors
            verifyUnchecked(profs);
        }
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDirection("asc");
        }
    };

    const getStatusScore = (prof: Professor): number => {
        const v = verificationMap[prof.id];
        const dupStatus = v?.isDuplicate ?? prof.is_duplicate;
        if (dupStatus) return 3;
        // Use cached DB value if verification map doesn't have it
        const aituStatus = v?.existsInAITU ?? prof.aitu_verified;
        if (v?.loading) return 0;
        if (aituStatus === true) return 1;
        if (aituStatus === false) return 2;
        return 0;
    };

    const sortedProfessors = useMemo(() => {
        return [...professors].sort((a, b) => {
            if (sortKey === "status") {
                const aScore = getStatusScore(a);
                const bScore = getStatusScore(b);
                return sortDirection === "asc" ? aScore - bScore : bScore - aScore;
            }
            const aValue = a[sortKey as keyof Professor] ?? "";
            const bValue = b[sortKey as keyof Professor] ?? "";
            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [professors, sortKey, sortDirection, verificationMap]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const result = await loginAsAdmin(password);
        if (!result.success) {
            toast.error(result.error);
            setLoading(false);
        } else {
            toast.success("Logged in successfully");
            setPassword("");
            setIsAuthenticated(true);
            loadPendingProfessors();
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logoutAdmin();
        toast.success("Logged out");
        setIsAuthenticated(false);
        setProfessors([]);
        setVerificationMap({});
    };

    const handleApprove = async (id: string) => {
        const result = await approveProfessor(id);
        if (!result.success) {
            toast.error(result.error || "Failed to approve");
        } else {
            toast.success("Professor approved");
            setProfessors((prev) => prev.filter((p) => p.id !== id));
            const copy = { ...verificationMap };
            delete copy[id];
            setVerificationMap(copy);
            router.refresh();
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm("Are you sure you want to reject (delete) this suggestion?")) return;
        const result = await rejectProfessor(id);
        if (!result.success) {
            toast.error(result.error || "Failed to reject");
        } else {
            toast.success("Suggestion rejected");
            setProfessors((prev) => prev.filter((p) => p.id !== id));
            const copy = { ...verificationMap };
            delete copy[id];
            setVerificationMap(copy);
        }
    };

    const getRowBgClass = (prof: Professor): string => {
        const v = verificationMap[prof.id];
        if (v?.loading) return "";
        const dupStatus = v?.isDuplicate ?? prof.is_duplicate;
        if (dupStatus) return "bg-yellow-50";
        const aituStatus = v?.existsInAITU ?? prof.aitu_verified;
        if (aituStatus === true) return "bg-green-50";
        if (aituStatus === false) return "bg-red-50";
        return "";
    };

    const StatusBadge = ({ prof }: { prof: Professor }) => {
        const v = verificationMap[prof.id];
        if (v?.loading) {
            return (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 ">
                    <Loader2 size={14} className="animate-spin" />
                    Checking…
                </span>
            );
        }
        if (v?.error && v.existsInAITU === null && prof.aitu_verified === null) {
            return (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 ">
                    <AlertTriangle size={14} />
                    Error
                </span>
            );
        }
        const dupStatus = v?.isDuplicate ?? prof.is_duplicate;
        if (dupStatus) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 dark:text-yellow-500 ">
                    <AlertTriangle size={14} />
                    Duplicate
                </span>
            );
        }
        const aituStatus = v?.existsInAITU ?? prof.aitu_verified;
        if (aituStatus === true) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-500 ">
                    <CheckCircle2 size={14} />
                    Verified
                </span>
            );
        }
        if (aituStatus === false) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-500 ">
                    <XCircle size={14} />
                    Not Found
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600 ">
                —
            </span>
        );
    };

    const SortIcon = ({ active, direction }: { active: boolean; direction: SortDirection }) => {
        if (!active) return null;
        return direction === "asc" ? (
            <ArrowUp size={14} className="inline ml-1" />
        ) : (
            <ArrowDown size={14} className="inline ml-1" />
        );
    };

    // --- Render ---

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-transparent px-4 py-8">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-md p-8 ">
                    <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Admin Login</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 ">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:border-black dark:focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500 "
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-black dark:bg-white text-white dark:text-gray-900 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 "
                        >
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-transparent py-8 px-4 sm:p-6 w-full h-full flex-1">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white ">Admin Dashboard</h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => verifyAll(professors)}
                            className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400  px-3 py-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            title="Re-verify all teachers"
                        >
                            <RefreshCw size={15} />
                            Re-verify All
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 "
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-600 dark:text-gray-400 ">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900 border border-green-300 dark:border-green-700 inline-block"></span>
                        Found in AITU
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-900 border border-red-300 dark:border-red-700 inline-block"></span>
                        Not found in AITU
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-yellow-200 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 inline-block"></span>
                        Duplicate in DB
                    </span>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden ">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 ">
                        <h2 className="font-semibold text-gray-800 dark:text-gray-200 ">
                            Pending Approvals ({professors.length})
                        </h2>
                    </div>

                    {professors.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400 ">No pending suggestions.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-medium ">
                                    <tr>
                                        <th
                                            className="px-6 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 "
                                            onClick={() => handleSort("name")}
                                        >
                                            Name
                                            <SortIcon active={sortKey === "name"} direction={sortDirection} />
                                        </th>
                                        <th
                                            className="px-6 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 "
                                            onClick={() => handleSort("status")}
                                        >
                                            Status
                                            <SortIcon active={sortKey === "status"} direction={sortDirection} />
                                        </th>
                                        <th
                                            className="px-6 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 "
                                            onClick={() => handleSort("department")}
                                        >
                                            Department
                                            <SortIcon active={sortKey === "department"} direction={sortDirection} />
                                        </th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 ">
                                    {sortedProfessors.map((p) => {
                                        const v = verificationMap[p.id];
                                        const isExpanded = expandedRow === p.id;
                                        const hasMatches = v && v.matches.length > 0;

                                        return (
                                            <Fragment key={p.id}>
                                                <tr
                                                    className={`${getRowBgClass(p)} dark:bg-opacity-10 ${hasMatches ? "cursor-pointer" : ""} `}
                                                    onClick={() =>
                                                        hasMatches && setExpandedRow(isExpanded ? null : p.id)
                                                    }
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {hasMatches && (
                                                                isExpanded ? (
                                                                    <ChevronDown size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
                                                                ) : (
                                                                    <ChevronRight size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
                                                                )
                                                            )}
                                                            <div>
                                                                <span className="font-medium text-gray-900 dark:text-white ">
                                                                    {p.name}
                                                                </span>
                                                                {v?.isDuplicate && v.existingName && (
                                                                    <span className="block text-xs text-yellow-600 dark:text-yellow-500 mt-0.5 ">
                                                                        Already exists as &quot;{v.existingName}&quot;
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <StatusBadge prof={p} />
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 ">{p.department}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    verifyProfessor(p);
                                                                }}
                                                                className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 "
                                                                title="Re-verify"
                                                            >
                                                                <RefreshCw size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleApprove(p.id);
                                                                }}
                                                                className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 "
                                                                title="Approve"
                                                            >
                                                                <Check size={18} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleReject(p.id);
                                                                }}
                                                                className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 "
                                                                title="Reject"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded row showing AITU matches */}
                                                {isExpanded && hasMatches && (
                                                    <tr key={`${p.id}-details`} className="bg-gray-50 dark:bg-gray-800/30 ">
                                                        <td colSpan={4} className="px-6 py-3">
                                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 ">
                                                                AITU Matches ({v.matches.length}):
                                                            </p>
                                                            <div className="space-y-1">
                                                                {v.matches.map((m, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded px-3 py-1.5 border border-gray-200 dark:border-gray-700 flex items-center justify-between "
                                                                    >
                                                                        <span className="font-medium">
                                                                            {m.nameKz} {m.surnameKz}
                                                                        </span>
                                                                        {m.department && (
                                                                            <span className="text-gray-400 dark:text-gray-500 ml-3 truncate max-w-[300px]">
                                                                                {m.department}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
