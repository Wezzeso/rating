"use client";

import React, { useState, useEffect, useMemo, useCallback, Fragment } from "react";
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
    Users
} from "lucide-react";
import {
    approveProfessor,
    rejectProfessor,
    fetchPendingProfessors,
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
    is_duplicate: boolean | null;
}

interface VerificationStatus {
    loading: boolean;
    isDuplicate: boolean | null;
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

    // Check duplicate status
    const verifyProfessor = useCallback(async (prof: Professor) => {
        setVerificationMap((prev) => ({
            ...prev,
            [prof.id]: { loading: true, isDuplicate: null },
        }));

        try {
            const dupResult = await checkDuplicateInDB(prof.id, prof.name);

            // Update local professor data with the saved results
            setProfessors((prev) =>
                prev.map((p) =>
                    p.id === prof.id
                        ? {
                            ...p,
                            is_duplicate: dupResult.success ? dupResult.isDuplicate : p.is_duplicate,
                        }
                        : p
                )
            );

            setVerificationMap((prev) => ({
                ...prev,
                [prof.id]: {
                    loading: false,
                    isDuplicate: dupResult.success ? dupResult.isDuplicate : null,
                    existingName: dupResult.existingName,
                    error: dupResult.error || undefined,
                },
            }));
        } catch {
            setVerificationMap((prev) => ({
                ...prev,
                [prof.id]: {
                    loading: false,
                    isDuplicate: null,
                    error: "Check failed",
                },
            }));
        }
    }, []);

    // Verify only professors that haven't been checked yet
    const verifyUnchecked = useCallback(
        (profs: Professor[]) => {
            const unchecked = profs.filter(
                (p) =>
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
                const hasDup = p.is_duplicate !== null && p.is_duplicate !== undefined;
                if (hasDup) {
                    initialMap[p.id] = {
                        loading: false,
                        isDuplicate: hasDup ? p.is_duplicate : null,
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
        if (v?.loading) return 0;
        if (dupStatus) return 3;
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
        if (dupStatus) return "bg-amber-50/50 dark:bg-amber-900/10";
        return "";
    };

    const StatusBadge = ({ prof }: { prof: Professor }) => {
        const v = verificationMap[prof.id];
        if (v?.loading) {
            return (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500 ">
                    <Loader2 size={14} className="animate-spin" />
                    Checking…
                </span>
            );
        }
        if (v?.error) {
            return (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-zinc-400 ">
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
        return (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-600 ">
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-zinc-800"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-transparent px-4 py-8">
                <div className="max-w-md w-full bg-white dark:bg-zinc-950 rounded-lg shadow-md p-8 ">
                    <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-zinc-100">Admin Login</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-100 ">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 px-3 py-2 focus:border-black dark:focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-zinc-500 "
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-black dark:bg-white text-white dark:text-zinc-900 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-zinc-200 "
                        >
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-transparent py-6 px-4 md:px-8 w-full min-h-full flex-1 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">Teacher Moderation</h1>
                    <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Review and approve new professor suggestions.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => verifyAll(professors)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow"
                        title="Check for duplicates"
                    >
                        <RefreshCw size={16} />
                        <span>Check Duplicates</span>
                    </button>
                    {/* The logout is duplicated in the layout but user kept it here, styling it to match */}
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow flex items-center justify-center"
                    >
                        <LogOut size={16} />
                        <span className="hidden md:inline ml-2">Logout</span>
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm font-medium text-gray-600 dark:text-zinc-400">
                <span className="flex items-center gap-2 bg-white/50 dark:bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-gray-200/60 dark:border-zinc-800/60">
                    <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"></span>
                    Duplicate in DB
                </span>
            </div>

            <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-200/60 dark:border-zinc-800/60 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-900/60">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Users size={18} />
                        </div>
                        <h2 className="font-bold text-gray-900 dark:text-white tracking-tight text-lg">
                            Pending Approvals <span className="ml-2 px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-sm font-semibold text-gray-600 dark:text-zinc-400">{professors.length}</span>
                        </h2>
                    </div>
                </div>

                {professors.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-zinc-400 ">Пока что никого нет, но скоро будет</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 dark:bg-zinc-800/30 text-xs uppercase text-gray-500 dark:text-zinc-400 font-semibold tracking-wider">
                                <tr>
                                    <th
                                        className="px-6 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900 "
                                        onClick={() => handleSort("name")}
                                    >
                                        Name
                                        <SortIcon active={sortKey === "name"} direction={sortDirection} />
                                    </th>
                                    <th
                                        className="px-6 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900 "
                                        onClick={() => handleSort("status")}
                                    >
                                        Status
                                        <SortIcon active={sortKey === "status"} direction={sortDirection} />
                                    </th>
                                    <th
                                        className="px-6 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900 "
                                        onClick={() => handleSort("department")}
                                    >
                                        Department
                                        <SortIcon active={sortKey === "department"} direction={sortDirection} />
                                    </th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 ">
                                    {sortedProfessors.map((p) => {
                                        const v = verificationMap[p.id];

                                    return (
                                        <Fragment key={p.id}>
                                            <tr className={getRowBgClass(p)}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div>
                                                            <span className="font-medium text-gray-900 dark:text-zinc-100 ">
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
                                                <td className="px-6 py-4 text-gray-600 dark:text-zinc-400 ">{p.department}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                verifyProfessor(p);
                                                            }}
                                                            className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                                                            title="Re-verify"
                                                        >
                                                            <RefreshCw size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleApprove(p.id);
                                                            }}
                                                            className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all"
                                                            title="Approve"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleReject(p.id);
                                                            }}
                                                            className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                                                            title="Reject"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
