import { Star, StarHalf } from "lucide-react";
import React from "react";

interface StarRatingProps {
    rating: number;
    size?: number;
}

export function StarRating({ rating, size = 16 }: StarRatingProps) {
    // Clamp rating between 0 and 5
    const clampedRating = Math.max(0, Math.min(rating, 5));

    // Calculate color: Red (0) -> Green (120) in HSL
    // Map 1..5 to 0..120
    // If rating is 0 (unrated), use gray
    const hue = Math.max(0, (clampedRating - 1) * 30);
    const color = clampedRating === 0 ? "#D1D5DB" : `hsl(${hue}, 80%, 45%)`; // Gray-300 if 0

    return (
        <div className="flex gap-0.5 relative" title={`Rating: ${clampedRating.toFixed(1)}`}>
            {[1, 2, 3, 4, 5].map((index) => {
                const fillPercentage = Math.max(0, Math.min(100, (clampedRating - index + 1) * 100));

                return (
                    <div key={index} className="relative">
                        {/* Background (Empty) Star */}
                        <Star
                            size={size}
                            className="text-gray-200 dark:text-zinc-800 fill-gray-100 dark:fill-zinc-800"
                            strokeWidth={1.5}
                        />

                        {/* Foreground (Filled) Star - Clipped */}
                        <div
                            className="absolute top-0 left-0 overflow-hidden"
                            style={{ width: `${fillPercentage}%` }}
                        >
                            <Star
                                size={size}
                                fill={color}
                                stroke={color}
                                strokeWidth={1.5}
                                // Remove w/h constraint here to let SVG scale, but parent div clips it
                                // Need to ensure SVG maintains size
                                style={{ minWidth: `${size}px` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
