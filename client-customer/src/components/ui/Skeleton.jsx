import React from 'react';

export default function Skeleton({ className, ...props }) {
    return (
        <div
            className={`animate-pulse bg-gray-200 rounded-md ${className}`}
            {...props}
        />
    );
}

export function PropertyCardSkeleton() {
    return (
        <div className="flex flex-col xl:flex-row gap-5 bg-white rounded-[1.5rem] overflow-hidden border border-gray-100 p-3 h-full">
            {/* Image Placeholder */}
            <Skeleton className="w-full xl:w-[320px] h-[250px] xl:h-[300px] flex-shrink-0 rounded-[1.2rem]" />

            {/* Content Placeholder */}
            <div className="flex-1 flex flex-col pt-1 pb-1 pr-2 space-y-3">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <div className="flex gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />

                <div className="flex gap-2 mt-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>

                <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-50">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
