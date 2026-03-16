"use server";

import dbConnect from "@/lib/mongodb";
import RemovalRequest from "@/models/RemovalRequest";
import { revalidatePath } from "next/cache";

interface RemovalRequestData {
    professorName: string;
    officialEmail: string;
    reason: string;
    acceptedTerms: boolean;
}

export async function submitRemovalRequest(data: RemovalRequestData) {
    try {
        await dbConnect();

        // Basic validation
        if (!data.professorName || !data.officialEmail || !data.reason || !data.acceptedTerms) {
            return { success: false, error: "Please fill in all fields and accept terms." };
        }


        const newRequest = new RemovalRequest({
            professorName: data.professorName,
            officialEmail: data.officialEmail.toLowerCase(),
            reason: data.reason,
            acceptedTerms: data.acceptedTerms,
        });

        await newRequest.save();

        return { success: true };
    } catch (error: any) {
        console.error("Removal request error:", error);
        return { success: false, error: error.message || "Failed to submit request." };
    }
}

export async function fetchRemovalRequests() {
    try {
        await dbConnect();
        const requests = await RemovalRequest.find().sort({ createdAt: -1 });
        return { success: true, data: JSON.parse(JSON.stringify(requests)) };
    } catch (error: any) {
        console.error("Fetch requests error:", error);
        return { success: false, error: error.message || "Failed to fetch requests." };
    }
}

export async function updateRemovalRequestStatus(id: string, status: 'pending' | 'reviewed' | 'resolved') {
    try {
        await dbConnect();
        await RemovalRequest.findByIdAndUpdate(id, { status });
        revalidatePath("/admin/requests");
        return { success: true };
    } catch (error: any) {
        console.error("Update request error:", error);
        return { success: false, error: error.message || "Failed to update request." };
    }
}
