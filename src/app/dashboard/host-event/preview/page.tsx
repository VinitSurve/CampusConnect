
'use client';

import { useState, useEffect } from 'react';
import type { Event } from '@/types';
import EventDetailPage from '@/components/event-detail-page';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventPreviewPage() {
    const [eventData, setEventData] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDataFromStorage = () => {
        try {
            const storedData = sessionStorage.getItem('eventPreviewData');
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                setEventData(parsedData);
            } else {
                setError("No preview data found. Please generate a preview from the event form.");
            }
        } catch (e) {
            console.error("Error parsing preview data:", e);
            setError("Could not load preview. The data might be corrupted.");
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        // Initial load from storage
        loadDataFromStorage();

        // Set up listener for real-time updates from other tabs
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'eventPreviewData' && event.newValue) {
                try {
                    const parsedData = JSON.parse(event.newValue);
                    setEventData(parsedData);
                } catch (e) {
                     console.error("Error parsing updated preview data:", e);
                     setError("Could not update preview. The data might be corrupted.");
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []); // Empty dependency array ensures this effect runs only once on mount


    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 text-white p-8">
                <div className="max-w-4xl mx-auto">
                    <Skeleton className="h-80 w-full mb-8 bg-white/10" />
                    <Skeleton className="h-16 w-1/2 mb-8 bg-white/10" />
                    <div className="space-y-8">
                        <Skeleton className="h-32 w-full bg-white/10" />
                        <Skeleton className="h-32 w-full bg-white/10" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 text-white p-4">
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Preview Error</h2>
                    <p className="text-white/70">{error}</p>
                </div>
            </div>
        );
    }

    if (!eventData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 text-white p-4">
                 <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 p-8 max-w-md w-full text-center">
                     <h2 className="text-2xl font-bold text-white mb-4">No Data</h2>
                     <p className="text-white/70">No event data was found to display a preview.</p>
                 </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 text-white">
             <div className="container mx-auto px-4 py-8">
                <div className="bg-yellow-500/20 border border-yellow-400 text-yellow-200 text-sm rounded-lg p-4 mb-8 max-w-4xl mx-auto text-center">
                    <strong>Note:</strong> This is a dynamic preview. Changes in the form tab will update here automatically. Close this tab to return to the form.
                </div>
                <EventDetailPage event={eventData} />
            </div>
        </div>
    );
}
