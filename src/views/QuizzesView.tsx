import React, { useState } from 'react';
import { useData } from '../DataContext';
import { CheckCircle2, Clock, PlayCircle, X, Plus, Award, Check, AlertCircle } from 'lucide-react';
import { Quiz } from '../types';

export default function QuizzesView() {
  const { quizzes, addQuiz, submitQuiz, completeQuiz, updateQuizCorrectAnswers, currentUser, users, notify } = useData();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [questions, setQuestions] = useState<string[]>(['']);

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isTaking, setIsTaking] = useState(false);

  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [gradingQuiz, setGradingQuiz] = useState<Quiz | null>(null);
  const [correctAnswersInput, setCorrectAnswersInput] = useState<string[]>([]);

  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [resultsQuiz, setResultsQuiz] = useState<Quiz | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;
    addQuiz({ 
      title, 
      date, 
      questions: questions.filter(q => q.trim() !== '') 
    });
    setIsCreateOpen(false);
    setTitle('');
    setDate('');
    setQuestions(['']);
  };

  const handleAddQuestionField = () => {
    setQuestions([...questions, '']);
  };

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setAnswers(new Array(quiz.questions?.length || 0).fill(''));
    setIsTaking(true);
  };

  const handleSubmit = () => {
    if (activeQuiz && currentUser) {
      submitQuiz(activeQuiz.id, answers);
      notify('success', 'Quiz submitted successfully! Waiting for grading.');
      setActiveQuiz(null);
      setIsTaking(false);
    }
  };

  const handleGrading = (e: React.FormEvent) => {
    e.preventDefault();
    if (gradingQuiz) {
      updateQuizCorrectAnswers(gradingQuiz.id, correctAnswersInput);
      setIsGradingOpen(false);
      setGradingQuiz(null);
    }
  };

  const calculateScore = (quiz: Quiz, userId: string) => {
    const submission = quiz.submissions?.[userId];
    const correct = quiz.correctAnswers;
    if (!submission || !correct) return null;

    let score = 0;
    submission.forEach((ans, idx) => {
      if (ans.trim().toLowerCase() === correct[idx]?.trim().toLowerCase()) {
        score++;
      }
    });
    return { score, total: correct.length };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quizzes & Tests</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Weekly evaluations and performance tracking.</p>
        </div>
        {currentUser?.role === 'Group Leader' && (
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Create Quiz
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Quizzes */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="text-amber-500" size={20} />
              Upcoming
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {quizzes.filter(q => q.status === 'Upcoming').map(quiz => (
              <div key={quiz.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">{quiz.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Scheduled for {quiz.date}</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">{quiz.questions?.length || 0} Questions</p>
                </div>
                <button 
                  onClick={() => handleStartQuiz(quiz)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors shrink-0"
                >
                  <PlayCircle size={18} />
                  Start Quiz
                </button>
              </div>
            ))}
            {quizzes.filter(q => q.status === 'Upcoming').length === 0 && (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">No upcoming quizzes.</div>
            )}
          </div>
        </div>

        {/* Completed Quizzes */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={20} />
              Completed
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {quizzes.filter(q => q.status === 'Completed').map(quiz => {
              const mySubmission = currentUser ? quiz.submissions?.[currentUser.id] : null;
              const result = currentUser ? calculateScore(quiz, currentUser.id) : null;
              const isLeader = currentUser?.role === 'Group Leader';

              return (
                <div key={quiz.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{quiz.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Completed on {quiz.date}</p>
                    {result && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold">
                        <Award size={12} />
                        Score: {result.score} / {result.total} ({Math.round((result.score / result.total) * 100)}%)
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Status</p>
                      <p className={`text-sm font-bold ${mySubmission ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {mySubmission ? (quiz.correctAnswers ? 'Graded' : 'Submitted') : 'Missed'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {isLeader && (
                        <button 
                          onClick={() => {
                            setGradingQuiz(quiz);
                            setCorrectAnswersInput(quiz.correctAnswers || new Array(quiz.questions?.length || 0).fill(''));
                            setIsGradingOpen(true);
                          }}
                          className="px-3 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors border border-amber-200 dark:border-amber-500/20"
                        >
                          Grade Quiz
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setResultsQuiz(quiz);
                          setIsResultsOpen(true);
                        }}
                        className="px-4 py-2 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shrink-0 border border-slate-200 dark:border-slate-600"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {quizzes.filter(q => q.status === 'Completed').length === 0 && (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">No completed quizzes yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Create Quiz Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create New Quiz</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20}/>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quiz Title</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                    placeholder="Enter Quiz Title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Questions</label>
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                        {idx + 1}
                      </span>
                      <input 
                        type="text"
                        value={q}
                        onChange={e => handleQuestionChange(idx, e.target.value)}
                        placeholder={`Question ${idx + 1}`}
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  ))}
                </div>
                <button 
                  type="button"
                  onClick={handleAddQuestionField}
                  className="mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus size={16} /> Add Question
                </button>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Create Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Take Quiz Modal */}
      {activeQuiz && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activeQuiz.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Workable Space Area - Please provide your answers below.</p>
              </div>
              {!isTaking && (
                <button onClick={() => setActiveQuiz(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={20}/>
                </button>
              )}
            </div>
            
            {!isTaking ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlayCircle size={32} />
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto">
                  You are about to start this quiz. Once you begin, please answer all questions in the provided spaces.
                </p>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => setActiveQuiz(null)}
                    className="px-6 py-3 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setIsTaking(true)}
                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Start Now
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto pr-2 space-y-8 py-4">
                  {activeQuiz.questions?.map((q, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 pt-0.5">{q}</p>
                      </div>
                      <div className="ml-11">
                        <textarea 
                          rows={4}
                          value={answers[idx] || ''}
                          onChange={e => {
                            const newAnswers = [...answers];
                            newAnswers[idx] = e.target.value;
                            setAnswers(newAnswers);
                          }}
                          placeholder="Type your answer here..."
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100 resize-none"
                        />
                      </div>
                    </div>
                  ))}
                  {(!activeQuiz.questions || activeQuiz.questions.length === 0) && (
                    <div className="text-center py-12 text-slate-500">
                      No questions found for this quiz.
                    </div>
                  )}
                </div>
                
                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {answers.filter(a => a.trim() !== '').length} of {activeQuiz.questions?.length || 0} answered
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setActiveQuiz(null);
                        setIsTaking(false);
                      }}
                      className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Exit
                    </button>
                    <button 
                      onClick={handleSubmit}
                      className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Submit Quiz
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Grade Quiz Modal */}
      {isGradingOpen && gradingQuiz && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Set Correct Answers: {gradingQuiz.title}</h3>
              <button onClick={() => setIsGradingOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20}/>
              </button>
            </div>
            <form onSubmit={handleGrading} className="flex-1 overflow-y-auto space-y-6 pr-2">
              {gradingQuiz.questions?.map((q, idx) => (
                <div key={idx} className="space-y-2">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Question {idx + 1}: {q}</p>
                  <input 
                    type="text"
                    value={correctAnswersInput[idx] || ''}
                    onChange={e => {
                      const newCorrect = [...correctAnswersInput];
                      newCorrect[idx] = e.target.value;
                      setCorrectAnswersInput(newCorrect);
                    }}
                    placeholder="Enter correct answer"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              ))}
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsGradingOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Save & Grade All</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {isResultsOpen && resultsQuiz && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-4xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Results: {resultsQuiz.title}</h3>
              <button onClick={() => setIsResultsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-8 pr-2">
              {currentUser?.role === 'Group Leader' ? (
                // Leader sees all submissions
                <div className="space-y-6">
                  {users.map(user => {
                    const submission = resultsQuiz.submissions?.[user.id];
                    const result = calculateScore(resultsQuiz, user.id);
                    if (!submission) return null;
                    return (
                      <div key={user.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold">
                              {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.regNo}</p>
                            </div>
                          </div>
                          {result && (
                            <div className="text-right">
                              <p className="text-xs text-slate-500 uppercase font-bold">Score</p>
                              <p className="text-lg font-black text-indigo-600">{result.score} / {result.total}</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          {resultsQuiz.questions?.map((q, idx) => (
                            <div key={idx} className="text-sm">
                              <p className="font-medium text-slate-700 dark:text-slate-300">Q{idx + 1}: {q}</p>
                              <div className="flex items-start gap-2 mt-1">
                                <div className={`flex-1 p-2 rounded-lg border ${
                                  resultsQuiz.correctAnswers && submission[idx].trim().toLowerCase() === resultsQuiz.correctAnswers[idx].trim().toLowerCase()
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                                }`}>
                                  <p className="text-xs font-bold uppercase mb-1">Answer:</p>
                                  {submission[idx]}
                                </div>
                                {resultsQuiz.correctAnswers && (
                                  <div className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600">
                                    <p className="text-xs font-bold uppercase mb-1 text-slate-400">Correct:</p>
                                    {resultsQuiz.correctAnswers[idx]}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Member sees only their own result
                <div className="space-y-6">
                  {(() => {
                    const submission = resultsQuiz.submissions?.[currentUser?.id || ''];
                    const result = currentUser ? calculateScore(resultsQuiz, currentUser.id) : null;
                    if (!submission) return <p className="text-center text-slate-500">No submission found.</p>;
                    return (
                      <div className="space-y-6">
                        {result && (
                          <div className="bg-indigo-600 text-white p-6 rounded-2xl text-center shadow-lg">
                            <Award size={48} className="mx-auto mb-2" />
                            <h4 className="text-2xl font-black">Your Score: {result.score} / {result.total}</h4>
                            <p className="text-indigo-100 mt-1">Great effort! Review your answers below.</p>
                          </div>
                        )}
                        <div className="space-y-4">
                          {resultsQuiz.questions?.map((q, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                              <p className="font-bold text-slate-900 dark:text-slate-100 mb-3">Q{idx + 1}: {q}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`p-3 rounded-lg border flex items-start gap-3 ${
                                  resultsQuiz.correctAnswers && submission[idx].trim().toLowerCase() === resultsQuiz.correctAnswers[idx].trim().toLowerCase()
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                                }`}>
                                  {resultsQuiz.correctAnswers && submission[idx].trim().toLowerCase() === resultsQuiz.correctAnswers[idx].trim().toLowerCase() ? (
                                    <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                                  ) : (
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                  )}
                                  <div>
                                    <p className="text-[10px] font-bold uppercase opacity-60">Your Answer</p>
                                    <p className="font-medium">{submission[idx]}</p>
                                  </div>
                                </div>
                                {resultsQuiz.correctAnswers && (
                                  <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 flex items-start gap-3">
                                    <Check size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                                    <div>
                                      <p className="text-[10px] font-bold uppercase opacity-60">Correct Answer</p>
                                      <p className="font-medium text-slate-900 dark:text-slate-100">{resultsQuiz.correctAnswers[idx]}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button onClick={() => setIsResultsOpen(false)} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
