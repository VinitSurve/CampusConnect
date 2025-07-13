
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { searchStudents, getStudentById } from '@/lib/data'; 
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import type { QueryDocumentSnapshot } from 'firebase/firestore';

type StudentSelectorProps = {
  value: string;
  onChange: (studentId: string) => void;
  className?: string;
}

export function StudentSelector({ value, onChange, className }: StudentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);
  
  const fetchAndSetSelectedStudent = useCallback(async (studentId: string) => {
    if (!studentId) {
        setSelectedStudentName(null);
        return;
    }
    try {
      const student = await getStudentById(studentId);
      if (student) {
        setSelectedStudentName(student.name);
      }
    } catch (error) {
      console.error("Error fetching selected student:", error);
      setSelectedStudentName(null);
    }
  }, []);

  useEffect(() => {
    if (value) {
        fetchAndSetSelectedStudent(value);
    } else {
        setSelectedStudentName(null);
    }
  }, [value, fetchAndSetSelectedStudent]);
  
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);
  
  const fetchStudents = useCallback(async (searchQuery: string, isNewSearch: boolean) => {
    setLoading(true);
    if (isNewSearch) {
        lastDocRef.current = null;
        setStudents([]);
    }

    try {
      const result = await searchStudents(searchQuery, lastDocRef.current, 10);
      
      setStudents(prev => isNewSearch ? result.students : [...prev, ...result.students]);
      setHasMore(result.hasMore);
      lastDocRef.current = result.lastDoc;
    } catch (error) {
      console.error("Error searching students:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setTimeout(() => {
      fetchStudents(query, true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, isOpen, fetchStudents]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  const handleOpen = () => {
    setIsOpen(true);
    if (students.length === 0) {
        fetchStudents('', true);
    }
  };
  
  const handleSelect = (student: {id: string, name: string}) => {
    onChange(student.id);
    setSelectedStudentName(student.name);
    setIsOpen(false);
  };
  
  const loadMore = () => {
    if (!loading && hasMore) {
        fetchStudents(query, false);
    }
  };
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        onClick={handleOpen}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white flex justify-between items-center cursor-pointer h-10"
      >
        <span className={selectedStudentName ? 'text-white' : 'text-gray-400'}>
          {selectedStudentName || 'Select a student lead...'}
        </span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-2 sticky top-0 bg-gray-800 border-b border-white/10">
            <Input
              ref={inputRef}
              placeholder="Search students..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-white/10"
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {loading && students.length === 0 ? (
                <div className="flex justify-center p-4">
                    <Spinner />
                </div>
            ) : !loading && students.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-400">No students found</div>
            ) : (
              <>
                {students.map(student => (
                  <div
                    key={student.id}
                    className={`px-4 py-2 cursor-pointer hover:bg-white/10 ${value === student.id ? 'bg-blue-500/30' : ''}`}
                    onClick={() => handleSelect(student)}
                  >
                    <div>{student.name}</div>
                    {student.course && student.year && (
                      <div className="text-xs text-gray-400">{student.course} - {student.year}</div>
                    )}
                  </div>
                ))}
                
                {hasMore && !loading && (
                  <div className="p-2 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMore}
                      disabled={loading}
                      className="w-full text-sm"
                    >
                      Load more
                    </Button>
                  </div>
                )}
                 {loading && students.length > 0 && (
                    <div className="flex justify-center p-4">
                        <Spinner />
                    </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
