// src/components/ClassroomChat.tsx
import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  GraduationCap,
  Bell,
  CheckSquare,
  ExternalLink,
  RefreshCw,
  Sparkles,
  MessageSquare,
  School,
} from 'lucide-react';
import {
  fetchClassroomCourses,
  fetchCourseAnnouncements,
  fetchCourseWork,
} from '../lib/classroom.ts';

interface ClassroomChatProps {
  currentUser: any;
  onRequireLogin: () => void;
}

export const ClassroomChat: React.FC<ClassroomChatProps> = ({ currentUser, onRequireLogin }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [courseWork, setCourseWork] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'stream' | 'assignments'>('stream');

  const loadCourses = async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    try {
      setLoading(true);
      const list = await fetchClassroomCourses();
      setCourses(list);
      if (list.length > 0 && !selectedCourse) {
        setSelectedCourse(list[0]);
      }
    } catch (err: any) {
      console.error('Failed to load Google Classroom courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadCourses();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseDetails(selectedCourse.id);
    }
  }, [selectedCourse]);

  const loadCourseDetails = async (courseId: string) => {
    try {
      setLoading(true);
      const [ann, work] = await Promise.all([
        fetchCourseAnnouncements(courseId),
        fetchCourseWork(courseId),
      ]);
      setAnnouncements(ann);
      setCourseWork(work);
    } catch (err) {
      console.error('Failed to load course details:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border p-6 sm:p-8 bg-gradient-to-br from-emerald-900/10 via-teal-900/5 to-cyan-900/10 border-emerald-200/60 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-cyan-950/30 dark:border-emerald-900/40 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Google Classroom Integration Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            Access your Google Classroom courses, instructor announcements, coursework, and classroom chat
            streams directly inside Pingit.
          </p>
        </div>

        <button
          onClick={loadCourses}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Courses</span>
        </button>
      </div>

      {/* Main Layout: Courses Sidebar + Course Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Sidebar: Courses List */}
        <div className="rounded-2xl border p-4 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-3 md:col-span-1 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
            <School className="w-4 h-4 text-emerald-500" />
            <span>My Courses</span>
          </h2>

          <div className="space-y-1.5 overflow-y-auto max-h-[420px]">
            {courses.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                {currentUser ? 'No active Google Classroom courses found.' : 'Sign in with Google to view courses.'}
              </div>
            ) : (
              courses.map((course) => {
                const isSelected = selectedCourse?.id === course.id;
                return (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <p className="text-xs font-bold truncate">{course.name}</p>
                    <p className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {course.section || course.descriptionHeading || 'Google Classroom'}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Content Area: Announcements & CourseWork */}
        <div className="rounded-2xl border p-5 sm:p-6 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 md:col-span-3 space-y-5 shadow-xs">
          {selectedCourse ? (
            <>
              {/* Course Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedCourse.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedCourse.room || 'Classroom Stream'} • Enrollment Code:{' '}
                    <span className="font-mono font-semibold">{selectedCourse.enrollmentCode || 'N/A'}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex rounded-lg p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                    <button
                      onClick={() => setActiveSubTab('stream')}
                      className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                        activeSubTab === 'stream'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Announcements ({announcements.length})
                    </button>
                    <button
                      onClick={() => setActiveSubTab('assignments')}
                      className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                        activeSubTab === 'assignments'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Coursework ({courseWork.length})
                    </button>
                  </div>

                  {selectedCourse.alternateLink && (
                    <a
                      href={selectedCourse.alternateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title="Open in Google Classroom"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Tab Content */}
              {activeSubTab === 'stream' ? (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <Bell className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Classroom Stream Announcements</span>
                  </h3>

                  {announcements.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                      <Bell className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                      <p className="text-sm font-semibold">No announcements in this course stream.</p>
                    </div>
                  ) : (
                    announcements.map((ann) => (
                      <div
                        key={ann.id}
                        className="rounded-2xl border p-4 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Instructor Announcement</span>
                          <span>{new Date(ann.creationTime).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {ann.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Assignments &amp; Coursework</span>
                  </h3>

                  {courseWork.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                      <CheckSquare className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                      <p className="text-sm font-semibold">No coursework assignments posted yet.</p>
                    </div>
                  ) : (
                    courseWork.map((work) => (
                      <div
                        key={work.id}
                        className="rounded-2xl border p-4 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 space-y-2 flex items-start justify-between"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{work.title}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                            {work.description || 'No description provided.'}
                          </p>
                          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                            Type: {work.workType || 'ASSIGNMENT'}
                          </span>
                        </div>

                        {work.alternateLink && (
                          <a
                            href={work.alternateLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 shadow-xs flex items-center space-x-1"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400 space-y-3">
              <BookOpen className="w-12 h-12 text-emerald-500 animate-pulse" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Select a course from the sidebar
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                View course announcements, stream chats, and coursework assignments from Google Classroom.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
