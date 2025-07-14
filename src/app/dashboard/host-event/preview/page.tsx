
'use client';

import { useState, useEffect } from 'react';
import type { Event, Club, User } from '@/types';
import EventDetailPage from '@/components/event-detail-page';
import { Skeleton } from '@/components/ui/skeleton';

interface PreviewData {
    event: Event;
    club: Club | null;
    lead: User | null;
}

export default function EventPreviewPage() {
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Function for initial load from sessionStorage
        const loadInitialData = () => {
            setLoading(true);
            try {
                const storedData = sessionStorage.getItem('eventPreviewData');
                if (storedData) {
                    const parsedData = JSON.parse(storedData);
                    setPreviewData(parsedData);
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

        loadInitialData();

        // Set up Broadcast Channel for real-time updates
        const channel = new BroadcastChannel('event_preview_channel');
        
        const handleMessage = (event: MessageEvent) => {
            if (event.data) {
                try {
                    // The event.data should be a JavaScript object
                    setPreviewData(event.data);
                } catch (e) {
                     console.error("Error processing preview update:", e);
                     setError("Could not update preview. The data might be corrupted.");
                }
            }
        };

        channel.addEventListener('message', handleMessage);

        // Cleanup listener on component unmount
        return () => {
            channel.removeEventListener('message', handleMessage);
            channel.close();
        };
    }, []); // Empty dependency array ensures this effect runs only once on mount


    if (loading) {
        return (
            <div className="p-8">
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
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Preview Error</h2>
                    <p className="text-white/70">{error}</p>
                </div>
            </div>
        );
    }

    if (!previewData || !previewData.event) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                 <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 p-8 max-w-md w-full text-center">
                     <h2 className="text-2xl font-bold text-white mb-4">No Data</h2>
                     <p className="text-white/70">No event data was found to display a preview.</p>
                 </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-yellow-500/20 border border-yellow-400 text-yellow-200 text-sm rounded-lg p-4 mb-8 max-w-4xl mx-auto text-center">
                <strong>Note:</strong> This is a dynamic preview. Changes in the form tab will update here automatically. Close this tab to return to the form.
            </div>
            <EventDetailPage event={previewData.event} club={previewData.club} lead={previewData.lead} />
        </div>
    );
}
