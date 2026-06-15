/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api-client';
import { User, Test, Question, Attempt } from '../types';
import AdminPanel from './AdminPanel';
import { 
  ClipboardList, Plus, Search, Calendar, MapPin, Eye, Users, RefreshCw, 
  Trash, ChevronRight, LayoutGrid, CheckSquare, AlignLeft, ShieldAlert, Sliders, LogOut, ArrowLeft, ArrowRight, X
} from 'lucide-react';

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
  addToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export default function TeacherDashboard({ user, onLogout, addToast }: TeacherDashboardProps) {
  // Navigation & Tabs
  const [currentTab, setCurrentTab] = useState<'exams' | 'assemble' | 'admin'>('exams');
  
  // Tests List State
  const [tests, setTests] = useState<Test[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingTests, setLoadingTests] = useState(false);
  
  // Selected Details State (Exam inspection drawer/modal)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Attendees tracker state
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [attendeeTestId, setAttendeeTestId] = useState<string | null>(null);

  // Test Assembly Builder State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDuration, setNewDuration] = useState(60); // 60 mins default
  const [newTotalMarks, setNewTotalMarks] = useState(10);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  
  // Geolocation defaults
  const [newLat, setNewLat] = useState(23.756); // Fallback standard coords
  const [newLng, setNewLng] = useState(90.370);
  const [newRadius, setNewRadius] = useState(300); // 300 meters default

  // Questions dynamic stack
  const [questions, setQuestions] = useState<Partial<Question>[]>([
    {
      questionType: 'mcq',
      questionText: '',
      options: ['', '', '', ''],
      correctOption: 0,
      marks: 1
    }
  ]);

  const [assemblySubmitting, setAssemblySubmitting] = useState(false);

  // Fetch paginated exams
  const fetchExams = async (targetPage = 1) => {
    setLoadingTests(true);
    try {
      const response = await apiFetch<Test[]>(`/teacher/getAllTests?page=${targetPage}`);
      if (response.success && response.data) {
        setTests(response.data);
        // Page size is 10. If returned counts are less than 10, there is no next page.
        setHasNextPage(response.data.length === 10);
        setPage(targetPage);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Unable to load examinations list.');
    } finally {
      setLoadingTests(false);
    }
  };
  

  useEffect(() => {
    if (currentTab === 'exams') {
      fetchExams(1);
    }
  }, [currentTab]);

// calculating durtion
const getDuration = (start: string, end: string) => {
  const diff =  new Date(end).getTime() - new Date(start).getTime();
  return Math.floor(diff / (1000 * 60));
};

  // Inspect particular exam details (questions list)
  const handleInspectTest = async (testId: string) => {
    setLoadingDetails(true);
    try {
      const response = await apiFetch<Test>(`/teacher/getTestDetails/${testId}`);
      if (response.success && response.data) {
        setSelectedTest(response.data);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Error tracking test parameters.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Inspect student attempts (attendees)
  const handleInspectAttendees = async (testId: string) => {
    setLoadingAttendees(true);
    setAttendeeTestId(testId);
    try {
      const response = await apiFetch<any[]>(`/teacher/seeAllAttendees/${testId}`);
      if (response.success && response.data) {
        setAttendees(response.data);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Could not fetch exam respondents.');
    } finally {
      setLoadingAttendees(false);
    }
  };

  // Build Assembly parameters
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionType: 'mcq',
        questionText: '',
        options: ['', '', '', ''],
        correctOption: 0,
        marks: 1
      }
    ]);
  };

  const removeQuestion = (idx: number) => {
    const nextQ = [...questions];
    nextQ.splice(idx, 1);
    setQuestions(nextQ);
  };

  const handleUpdateQuestion = (idx: number, patch: Partial<Question>) => {
    const nextQ = [...questions];
    nextQ[idx] = { ...nextQ[idx], ...patch };
    setQuestions(nextQ);
  };

  const handleUpdateMCQOption = (qIdx: number, optIdx: number, val: string) => {
    const nextQ = [...questions];
    if (nextQ[qIdx].options) {
      const nextOptions = [...nextQ[qIdx].options!];
      nextOptions[optIdx] = val;
      nextQ[qIdx].options = nextOptions;
    }
    setQuestions(nextQ);
  };

  // Test Creation Post Handler
  const handleAssembleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Core validation and normalized schemas
    if (!newTitle || !newSubject || !newStartTime || !newEndTime) {
      addToast('error', 'All exam metadata fields are required.');
      return;
    }

    if (newTitle.length < 6) {
      addToast('error', 'The test title must have at least 6 characters.');
      return;
    }

    if (newSubject.length < 6) {
      addToast('error', 'The subject code must have at least 6 characters.');
      return;
    }

    // Inspect questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || q.questionText.length < 5) {
        addToast('error', `Question #${i + 1} text is too short (min 5 characters).`);
        return;
      }
      if (q.questionType === 'mcq') {
        if (!q.options || q.options.some(opt => !opt.trim())) {
          addToast('error', `Ensure Question #${i + 1} has 4 valid, non-empty options.`);
          return;
        }
      }
    }

    setAssemblySubmitting(true);
    try {
      const computedTotal = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      
      const payload = {
        title: newTitle,
        subjectCode: newSubject.toUpperCase(),
        duration: Number(newDuration),
        totalMarks: computedTotal,
        startTime: new Date(newStartTime).toISOString(),
        endTime: new Date(newEndTime).toISOString(),
        allowedLocation: {
          lat: Number(newLat),
          lng: Number(newLng),
          radius: Number(newRadius),
        },
        questions: questions
      };

      const response = await apiFetch<any>('/teacher/createTest', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      addToast('success', `Exam successfully created! Generated system access code is: ${response.data.testCode}`);
      
      // Reset Assembly state
      setNewTitle('');
      setNewSubject('');
      setNewStartTime('');
      setNewEndTime('');
      setQuestions([{
        questionType: 'mcq',
        questionText: '',
        options: ['', '', '', ''],
        correctOption: 0,
        marks: 1
      }]);
      
      setCurrentTab('exams');
    } catch (err: any) {
      addToast('error', err.message || 'Error creating test file.');
    } finally {
      setAssemblySubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Banner Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center font-display font-bold text-lg text-white">
              V
            </div>
            <div>
              <span className="font-display font-medium text-lg text-slate-900 tracking-tight">ValidEx <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 py-0.5 px-2.5 rounded-full font-sans font-semibold ml-2">{user.role === 'admin' || user.role === 'superAdmin' ? 'Administrative Portal' : 'Faculty Moderator'}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 text-xs font-bold font-mono">
                {user.fullname.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{user.fullname}</p>
                <p className="text-xs text-slate-500 font-medium font-mono uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors hover:bg-slate-50 p-2 rounded-lg"
              title="End session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Primary Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Sidebar-like Tabs */}
        <div className="flex items-center border-b border-slate-200">
          <button
            onClick={() => setCurrentTab('exams')}
            className={`py-4 px-6 font-display font-medium text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              currentTab === 'exams'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="h-4 w-4" /> Examination Directory
          </button>
          
          <button
            id="tab-assemble-btn"
            onClick={() => setCurrentTab('assemble')}
            className={`py-4 px-6 font-display font-medium text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              currentTab === 'assemble'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus className="h-4 w-4" /> Assemble New Exam
          </button>

          {(user.role === 'admin' || user.role === 'superAdmin') && (
            <button
              id="tab-admin-btn"
              onClick={() => setCurrentTab('admin')}
              className={`py-4 px-6 font-display font-medium text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                currentTab === 'admin'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="h-4 w-4" /> Faculty Governance
            </button>
          )}
        </div>

        {/* CONTROLS SWITCH */}
        {currentTab === 'exams' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight">Active Assessments</h2>
                <p className="text-xs text-slate-500 mt-1">Direct oversight of examinations currently associated under your verified profile.</p>
              </div>
              <button
                onClick={() => fetchExams(1)}
                className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh List
              </button>
            </div>

            {loadingTests ? (
              <div className="text-center py-20 flex flex-col items-center justify-center gap-3 bg-white border border-slate-100 rounded-2xl">
                <span className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-500">Retrieving test listings...</p>
              </div>
            ) : tests.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl max-w-lg mx-auto p-8 flex flex-col items-center">
                <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-slate-950">No examinations found</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mt-1.5 mb-5">
                  You haven't authorized any exams yet. Assemble your first exam detailing MCQs and location boundaries to deploy the system code.
                </p>
                <button
                  onClick={() => setCurrentTab('assemble')}
                  className="bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Create An Exam
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map((test) => {
                  const formatDateSafe = (dateVal: any) => {
                    if (!dateVal) return 'N/A';
                    const d = new Date(dateVal);
                    if (isNaN(d.getTime())) return 'N/A';
                    try {
                      return d.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      });
                    } catch (e) {
                      return d.toISOString();
                    }
                  };

                  const start = formatDateSafe(test.startTime);
                  const end = formatDateSafe(test.endTime);

                  return (
                    <motion.div
                      key={test._id}
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white border border-slate-100 rounded-2xl shadow-premium overflow-hidden hover:border-indigo-100 transition-all flex flex-col justify-between"
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-100 uppercase">
                            CODE: {test.testCode}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                            {test.subjectCode}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-display font-bold text-slate-950 text-base leading-snug tracking-tight hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => handleInspectTest(test._id)}>
                            {test.title}
                          </h3>
                        </div>

                        {/* Timing indicator */}
                        <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                          <p className="flex items-center gap-1.5 font-medium text-slate-600"><Calendar className="h-3.5 w-3.5 text-slate-400" /> TIMING SCOPE:</p>
                          <p className="pl-5 text-[11px] leading-relaxed">
                            Start: <span className="font-semibold text-slate-800">{start}</span><br />
                            End: &nbsp;&nbsp;<span className="font-semibold text-slate-800">{end}</span>
                          </p>
                        </div>
                      </div>

                      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-1">
                        <span className="text-[11px] text-slate-500 font-semibold font-mono">
                         Duration: {getDuration(test.startTime, test.endTime)} MINS
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            title="Inspect Exam Parameter Questions"
                            onClick={() => handleInspectTest(test._id)}
                            className="p-1 px-2.5 rounded-lg text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" /> Specs
                          </button>
                          
                          <button
                            title="Review Candidates"
                            onClick={() => handleInspectAttendees(test._id)}
                            className="p-1 px-2.5 rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Users className="h-3.5 w-3.5" /> Attendees
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {tests.length > 0 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => fetchExams(page - 1)}
                  disabled={page === 1}
                  className="py-1 px-3 border border-slate-200 rounded-lg bg-white text-xs font-semibold text-slate-600 disabled:opacity-50 hover:bg-slate-50 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-medium text-slate-500 font-mono">
                  PAGE {page}
                </span>
                <button
                  onClick={() => fetchExams(page + 1)}
                  disabled={!hasNextPage}
                  className="py-1 px-3 border border-slate-200 rounded-lg bg-white text-xs font-semibold text-slate-600 disabled:opacity-50 hover:bg-slate-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {currentTab === 'assemble' && (
          /* NEW TEST ASSEMBLY VIEW */
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden">
            <div className="px-8 py-6 border-b border-secondary/20 bg-slate-50">
              <h2 className="font-display font-bold text-lg text-slate-900 tracking-tight">Examination Sheet Assembler</h2>
              <p className="text-xs text-slate-500 mt-1">Configure complete test requirements, geolocation coordinates, and questions stack below.</p>
            </div>

            <form onSubmit={handleAssembleTest} className="p-8 space-y-8" id="test-assembly-form">
              {/* Basic Details Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">1. Basic Metadata</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Exam Title</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors"
                      placeholder="Midterm Exam: Data Structures"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subject Code</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors"
                      placeholder="CSE-202"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Allowed Duration (Mins)</label>
                    <input
                      type="number"
                      min={10}
                      className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors"
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-1" />

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Start Boundary Time</label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors font-mono"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">End Boundary Time</label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors font-mono"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Geoposition Lock */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">2. Location Perimeter Check</h3>
                  <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full font-mono uppercase">Geo-fence Protection Enabled</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Center Latitude</label>
                    <input
                      type="number"
                      step="any"
                      className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors font-mono"
                      value={newLat}
                      onChange={(e) => setNewLat(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Center Longitude</label>
                    <input
                      type="number"
                      step="any"
                      className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors font-mono"
                      value={newLng}
                      onChange={(e) => setNewLng(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Radius Limit (Meters)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors font-mono"
                      value={newRadius}
                      onChange={(e) => setNewRadius(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Questions Assembler drawer */}
              <div className="space-y-5 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">3. Questions Stack ({questions.length})</h3>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="py-1 px-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-700 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Append Question
                  </button>
                </div>

                <div className="space-y-6">
                  {questions.map((q, qIdx) => (
                    <div key={qIdx} className="border border-slate-100 shadow-sm p-5 rounded-xl space-y-4 relative bg-slate-50/50">
                      {/* Delete index anchor */}
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIdx)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Erase question"
                        >
                          <Trash className="h-4 w-4 text-rose-500" />
                        </button>
                      )}

                      <div className="flex flex-wrap items-center gap-4">
                        <span className="h-6 w-6 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                          {qIdx + 1}
                        </span>

                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestion(qIdx, { questionType: 'mcq' })}
                            className={`py-1 px-3 rounded-md font-semibold transition-all ${
                              q.questionType === 'mcq'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Multiple Choice
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestion(qIdx, { questionType: 'theory' })}
                            className={`py-1 px-3 rounded-md font-semibold transition-all ${
                              q.questionType === 'theory'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Theoretical Essay
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold uppercase text-slate-400">Points:</label>
                          <input
                            type="number"
                            min={1}
                            className="w-16 px-2 py-1 text-xs bg-white border border-slate-200 rounded font-bold font-display"
                            value={q.marks || 1}
                            onChange={(e) => handleUpdateQuestion(qIdx, { marks: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-400">Question Body Text</label>
                        <textarea
                          rows={2}
                          className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors"
                          placeholder="What is the time complexity of retrieval operations inside balanced binary trees?"
                          value={q.questionText}
                          onChange={(e) => handleUpdateQuestion(qIdx, { questionText: e.target.value })}
                          required
                        />
                      </div>

                      {/* Optional Options Stack (MCQ SPECIFIC) */}
                      {q.questionType === 'mcq' && (
                        <div className="space-y-3 pt-2 pl-4 border-l-2 border-indigo-500/30">
                          <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Define Options & Map Correct Entry</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[0, 1, 2, 3].map((optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2 bg-white rounded-lg p-1.5 border border-slate-200">
                                <input
                                  type="radio"
                                  name={`correctOption-${qIdx}`}
                                  checked={q.correctOption === optIdx}
                                  onChange={() => handleUpdateQuestion(qIdx, { correctOption: optIdx })}
                                  className="h-4 w-4 text-indigo-600"
                                />
                                <span className="font-mono text-xs font-bold text-slate-400">
                                  {String.fromCharCode(65 + optIdx)}:
                                </span>
                                <input
                                  type="text"
                                  className="flex-1 px-2 py-1 bg-transparent text-xs text-slate-700 focus:outline-none"
                                  placeholder={`Option content #${optIdx + 1}`}
                                  value={q.options?.[optIdx] || ''}
                                  onChange={(e) => handleUpdateMCQOption(qIdx, optIdx, e.target.value)}
                                  required
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit panel */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentTab('exams')}
                  className="py-2.5 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={assemblySubmitting}
                  className="py-2.5 px-5 rounded-xl border border-indigo-700 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {assemblySubmitting ? (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Publish Examination Sheet <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {currentTab === 'admin' && (
          <AdminPanel currentUser={user} addToast={addToast} />
        )}
      </main>

      {/* MODAL 1: EXAM SPECIFICATIONS (Questions Viewer Drawer) */}
      <AnimatePresence>
        {selectedTest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTest(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden z-10 max-h-[85vh] flex flex-col"
            >
              {/* Drawer header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 uppercase">
                    CODE: {selectedTest.testCode}
                  </span>
                  <h3 className="font-display font-bold text-slate-900 text-lg tracking-tight mt-2">{selectedTest.title}</h3>
                  <p className="text-slate-500 text-xs font-medium font-mono">Subject: {selectedTest.subjectCode} &middot; Duration: {selectedTest.duration} MINS</p>
                </div>
                <button
                  onClick={() => setSelectedTest(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer scroll container */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Visual Location Check */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin className="h-4 w-4 text-indigo-600" /> Location Fence Boundary Parameters</p>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold pl-5">
                    Lattitude: <span className="font-mono text-slate-900 bg-white border px-1 rounded">{selectedTest.allowedLocation.lat}</span> &nbsp;&middot;&nbsp; 
                    Longitude: <span className="font-mono text-slate-900 bg-white border px-1 rounded">{selectedTest.allowedLocation.lng}</span> &nbsp;&middot;&nbsp; 
                    Max allowable Radius: <span className="text-indigo-600 font-mono text-slate-900 bg-white border px-1 rounded">{selectedTest.allowedLocation.radius} meters</span>
                  </p>
                  <p className="text-[10px] text-slate-400 pl-5">
                    Students launching desktop verification outside this circle coordinate perimeter fence will be strictly blocked from exam retrieval actions.
                  </p>
                </div>

                {/* Drawer questions list */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">Questions Checklist</h4>
                  
                  {(!selectedTest.questions || selectedTest.questions.length === 0) ? (
                    <p className="text-xs text-slate-500 italic pl-2">No compiled questions loaded in this exam metadata.</p>
                  ) : (
                    <div className="space-y-4">
                      {(selectedTest.questions as Question[]).map((q, idx) => (
                        <div key={q._id || idx} className="border border-slate-100 rounded-xl p-4 bg-slate-50/20 space-y-3">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <span className="text-xs font-semibold text-slate-800">Question #{idx + 1}</span>
                            <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest uppercase">
                              <span className={`px-2 py-0.5 rounded ${
                                q.questionType === 'mcq' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {q.questionType}
                              </span>
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Points: {q.marks}</span>
                            </div>
                          </div>

                          <p className="text-sm text-slate-900 leading-relaxed font-medium">
                            {q.questionText}
                          </p>

                          {q.questionType === 'mcq' && q.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                              {q.options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className={`text-xs p-2 rounded-lg border flex items-center gap-2 ${
                                    q.correctOption === optIdx
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 font-medium'
                                      : 'border-slate-100 bg-white text-slate-600'
                                  }`}
                                >
                                  <span className="font-mono font-bold text-slate-400">
                                    {String.fromCharCode(65 + optIdx)}:
                                  </span>
                                  {opt}
                                  {q.correctOption === optIdx && <span className="text-[10px] bg-emerald-600 text-white rounded px-1.5 py-0.2 select-none uppercase font-mono ml-auto">Correct</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Close container */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTest(null)}
                  className="py-2 px-4 rounded-xl text-slate-600 font-semibold bg-white border border-slate-200 text-xs hover:bg-slate-100 transition-colors transition-all cursor-pointer"
                >
                  Close Specification Portal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ATTENDEES TRACKER DRAWER */}
      <AnimatePresence>
        {attendeeTestId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAttendeeTestId(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden z-10 max-h-[85vh] flex flex-col"
            >
              {/* Drawer header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-lg tracking-tight">Active Exam Respondents</h3>
                  <p className="text-slate-500 text-xs mt-1">Live database of students who attempted this particular examination lock.</p>
                </div>
                <button
                  onClick={() => setAttendeeTestId(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Recipient scroll table */}
              <div className="overflow-y-auto flex-1 p-6">
                {loadingAttendees ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2">
                    <span className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-semibold text-slate-400 font-mono">Loading respondent lists...</p>
                  </div>
                ) : attendees.length === 0 ? (
                  <div className="text-center py-16 p-6 flex flex-col items-center max-w-sm mx-auto">
                    <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-slate-950 text-sm">No exam sessions completed</p>
                    <p className="text-xs text-slate-500 mt-1">Students taking the exam via locked desktop applications will dynamically append to this secure roster.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                          <th className="py-3 px-4">Student Name</th>
                          <th className="py-3 px-4">Registration</th>
                          <th className="py-3 px-4">Academic Email</th>
                          <th className="py-3 px-6 text-right">Obtained / Max Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {attendees.map((att) => {
                          const student = att.studentId;
                          const name = student?.fullname || 'Encrypted Student Key';
                          const reg = student?.regNo || 'N/A';
                          const mail = student?.email || 'unknown@academy.edu';
                          const score = att.obtainedMarks ?? 0;
                          const tot = att.totalMarks ?? 10;
                          const percent = Math.round((score / tot) * 100);

                          return (
                            <tr key={att._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-4 font-semibold text-slate-900">{name}</td>
                              <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 font-semibold uppercase">{reg}</td>
                              <td className="py-3.5 px-4 text-slate-500 font-medium">{mail}</td>
                              <td className="py-3.5 px-6 text-right font-mono font-bold text-slate-900">
                                <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${percent >= 40 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {score} <span className="font-normal text-slate-400 text-[10px]">/ {tot} points</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Close container */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  onClick={() => attendeeTestId && handleInspectAttendees(attendeeTestId)}
                  className="p-1 px-3 border border-slate-200 bg-white rounded text-[11px] font-bold text-slate-600 flex items-center gap-1 transition-colors hover:bg-slate-100 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Re-sync live submissions
                </button>
                <button
                  type="button"
                  onClick={() => setAttendeeTestId(null)}
                  className="py-2 px-4 rounded-xl text-slate-600 font-semibold bg-white border border-slate-200 text-xs hover:bg-slate-100 transition-colors transition-all cursor-pointer"
                >
                  Close Roster
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
