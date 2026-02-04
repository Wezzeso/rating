"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, LogOut } from "lucide-react";

interface Professor {
    id: string;
    name: string;
    department: string;
    created_at: string;
}

export default function AdminPage() {
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [professors, setProfessors] = useState<Professor[]>([]);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchUnapproved(session); // Fetch immediately if session exists
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) fetchUnapproved(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUnapproved = async (currentSession: any) => {
        if (!currentSession) return;
        const { data, error } = await supabase
            .from("professors")
            .select("*")
            .eq("is_approved", false)
            .order("created_at", { ascending: false });

        if (error) {
            toast.error("Error fetching suggestions");
            console.error(error);
        } else {
            setProfessors(data || []);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast.error(error.message);
            setLoading(false);
        } else {
            toast.success("Logged in successfully");
            setEmail("");
            setPassword("");
            // Loading state will be handled by auth listener
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.success("Logged out");
        setProfessors([]);
    };

    const handleApprove = async (id: string) => {
        const { error } = await supabase
            .from("professors")
            .update({ is_approved: true })
            .eq("id", id);

        if (error) {
            toast.error("Failed to approve");
        } else {
            toast.success("Professor approved");
            setProfessors((prev) => prev.filter((p) => p.id !== id));
            router.refresh(); // Update client cache regarding approved list somewhere else if needed
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm("Are you sure you want to reject (delete) this suggestion?")) return;

        const { error } = await supabase
            .from("professors")
            .delete()
            .eq("id", id);

        if (error) {
            toast.error("Failed to reject");
        } else {
            toast.success("Suggestion rejected");
            setProfessors((prev) => prev.filter((p) => p.id !== id));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition-colors"
                        >
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-800">Pending Approvals ({professors.length})</h2>
                    </div>

                    {professors.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No pending suggestions.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Department</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {professors.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{p.department}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApprove(p.id)}
                                                        className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                                        title="Approve"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(p.id)}
                                                        className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                        title="Reject"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
