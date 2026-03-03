"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareButtonProps {
    professorId: string;
    professorName: string;
    className?: string;
    showText?: boolean;
}

export function ShareButton({ professorId, professorName, className = "", showText = false }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click or modal close
        const url = `${window.location.origin}/professor/${professorId}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Rate ${professorName}`,
                    text: `Check out teaching and proctoring ratings for ${professorName} on Wezeso!`,
                    url: url,
                });
            } catch (error) {
                // If user cancelled, or share failed, fallback to copy
                if ((error as Error).name !== "AbortError") {
                    fallbackCopy(url);
                }
            }
        } else {
            fallbackCopy(url);
        }
    };

    const fallbackCopy = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleShare}
            className={`flex items-center justify-center gap-2 ${className}`}
            title="Share Profile"
        >
            {copied ? <Check size={showText ? 16 : 14} className="text-green-500" /> : <Share2 size={showText ? 16 : 14} />}
            {showText && <span>{copied ? "Copied!" : "Share Profile"}</span>}
        </button>
    );
}
