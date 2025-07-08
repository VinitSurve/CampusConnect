
'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Club } from "@/types";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ClubsDisplayProps {
  clubs: Club[];
}

export function ClubsDisplay({ clubs }: ClubsDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const allCategories = ['All', ...Array.from(new Set(clubs.flatMap(c => c.tags || [])))];
  const [filter, setFilter] = useState("All");

  const filteredClubs = clubs
    .filter(club =>
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(club => 
      filter === 'All' || (club.tags && club.tags.includes(filter))
    );
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Find Your Community</h1>
          <p className="text-white/70 mt-1">Discover clubs and organizations on campus.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Input 
            placeholder="Search clubs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
        </div>
      </div>
      
      <div className="flex overflow-x-auto pb-4 mb-8 gap-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {allCategories.map(category => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`flex items-center px-6 py-3 rounded-xl whitespace-nowrap transition-all text-white ${
              filter === category
                ? "bg-blue-600"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            <span className="text-white font-medium">{category}</span>
          </button>
        ))}
      </div>

      {filteredClubs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map(club => (
            <Link key={club.id} href={`/dashboard/clubs/${club.id}`} className="block bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all flex flex-col group">
              <div className="relative h-40 w-full overflow-hidden">
                <Image
                  src={club.image || 'https://placehold.co/600x400.png'}
                  alt={club.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint="organization community"
                />
              </div>
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-2">{club.name}</h3>
                <p className="text-white/70 text-sm mb-4 flex-grow">{club.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {(Array.isArray(club.tags) ? club.tags : []).map(tag => (
                      <span key={tag} className="px-2 py-1 text-xs bg-white/20 text-white rounded-full">{tag}</span>
                  ))}
                </div>

                <div className="flex items-center text-white/80 text-sm mt-auto pt-3 border-t border-white/10">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{club.members} Members</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-white mb-2">No Clubs Found</h3>
            <p className="text-white/80">
              Your search for "{searchTerm}" in the "{filter}" category yielded no results.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
