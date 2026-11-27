import { useState, useEffect, useRef } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";

const courses = [
  {
    id: 1,
    title: "أساسيات الرياضيات",
    category: "الرياضيات",
    description: "تعلم الرياضيات خطوة بخطوة من الأساسيات.",
    lessons: 12,
    progress: 35,
    color: "purple",
    icon: "📐",
  },
  {
    id: 2,
    title: "اللغة الإنجليزية",
    category: "اللغات",
    description: "طور مهاراتك في اللغة الإنجليزية بسهولة.",
    lessons: 10,
    progress: 0,
    color: "blue",
    icon: "🌍",
  },
  {
    id: 3,
    title: "مبادئ العلوم",
    category: "العلوم",
    description: "اكتشف العالم من حولك بطريقة ممتعة.",
    lessons: 8,
    progress: 0,
    color: "green",
    icon: "🔬",
  },
];

function App() {
  const [activeTab, setActiveTab] = useState("الرئيسية");
  const [hasUnreadAskTeacher, setHasUnreadAskTeacher] = useState(false);
const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const [adminSection, setAdminSection] = useState("dashboard");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseGrade, setNewCourseGrade] = useState("first_intermediate");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const [newCoursePublished, setNewCoursePublished] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseFormMessage, setCourseFormMessage] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonUnit, setNewLessonUnit] = useState("");
  const [newLessonVideo, setNewLessonVideo] = useState("");
  const [newLessonPosition, setNewLessonPosition] = useState(2);
  const [newLessonPassPercent, setNewLessonPassPercent] = useState(70);
  const [newLessonRequired, setNewLessonRequired] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);
  const [lessonFormMessage, setLessonFormMessage] = useState("");
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [newUnitCourse, setNewUnitCourse] = useState("");
  const [newUnitPosition, setNewUnitPosition] = useState(1);
  const [savingUnit, setSavingUnit] = useState(false);
  const [unitMessage, setUnitMessage] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [examUnit, setExamUnit] = useState("");
  const [examPassPercent, setExamPassPercent] = useState(50);
  const [examFile, setExamFile] = useState(null);
  const [savingExam, setSavingExam] = useState(false);
  const [examMessage, setExamMessage] = useState("");
  const [selectedQuizLesson, setSelectedQuizLesson] = useState("");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionOptions, setNewQuestionOptions] = useState(["", "", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionFormMessage, setQuestionFormMessage] = useState("");
  const [adminQuestions, setAdminQuestions] = useState([]);
  const [showQuizPreview, setShowQuizPreview] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editQuestionOptions, setEditQuestionOptions] = useState(["", "", ""]);
  const [editCorrectOptionIndex, setEditCorrectOptionIndex] = useState(0);
  const [loadingAdminQuestions, setLoadingAdminQuestions] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizReview, setQuizReview] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  

  const handleAnswerChange = (questionId, optionId) => {
    setQuizAnswers((previous) => ({
      ...previous,
      [questionId]: optionId,
    }));
  };

  

  const loadQuiz = async (lessonId) => {
    setQuizLoading(true);
    setQuizResult(null);
    setQuizAnswers({});

    const { data, error } = await supabase
      .from("questions")
      .select(`
      id,
      question_text,
      position,
      question_options (
        id,
        option_text,
        position
      )
    `)
      .eq("lesson_id", lessonId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Quiz loading error:", error.message);
      setQuizQuestions([]);
    } else {
      const sortedQuestions = (data || []).map((question) => ({
        ...question,
        question_options: [...question.question_options].sort(
          (a, b) => a.position - b.position
        ),
      }));

      setQuizQuestions(sortedQuestions);
      console.log("Quiz questions loaded:", sortedQuestions.length);
    }

    setQuizLoading(false);
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(quizAnswers).length !== quizQuestions.length) {
      setQuizResult({
        error: "يرجى الإجابة عن جميع الأسئلة أولاً.",
      });
      return;
    }

    setQuizLoading(true);
    setQuizResult(null);

    const answers = Object.entries(quizAnswers).map(
      ([question_id, option_id]) => ({
        question_id,
        option_id,
      })
    );

    try {
      const { data, error } = await supabase.rpc("submit_quiz", {
        p_lesson_id: selectedLesson.id,
        p_answers: answers,
      });

      if (error) {
        setQuizResult({ error: error.message });
      } else {
        setQuizResult(data);
        if (data.passed) {
          const { data: progressData } = await supabase
            .from("lesson_progress")
            .select("lesson_id, is_passed, best_score")
            .eq("student_id", session.user.id);

          setLessonProgress(progressData || []);
          const { data: updatedLessons, error: lessonsError } = await supabase
            .from("lessons")
            .select("id, course_id, unit_id, title, youtube_url, position, pass_percent, is_published, is_required")
            .order("position", { ascending: true });

          if (!lessonsError) {
            setLessons(updatedLessons || []);
          }
        }

        const review = (data.review || []).map((item) => {
          const question = quizQuestions.find(
            (q) => q.id === item.question_id
          );

          return {
            question: question?.question_text || "",
            selectedAnswer: item.selected_answer,
            correctAnswer: item.correct_answer,
            isCorrect: item.is_correct,
          };
        });

        setQuizReview(review);
      }
    } catch (error) {
      setQuizResult({ error: error.message });
    } finally {
      setQuizLoading(false);
    }
  };

  const handleUploadExamAnswer = async () => {
    const exam = unitExams.find(
      (item) => item.unit_id === selectedUnit?.id
    );

    if (!exam) {
      setExamStudentMessage("الامتحان غير متاح حالياً.");
      return;
    }

    if (!selectedAnswerFile) {
      setExamStudentMessage("يرجى اختيار ملف الإجابة أولاً.");
      return;
    }

    if (selectedAnswerFile.size >= 500 * 1024) {
      setExamStudentMessage("يجب أن يكون حجم الملف أقل من 500 KB.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(selectedAnswerFile.type)) {
      setExamStudentMessage("يسمح فقط بملفات PDF أو JPG أو PNG.");
      return;
    }

    setUploadingExam(true);
    setExamStudentMessage("");

    let filePath = "";

    try {
      const fileName = selectedAnswerFile.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      filePath = `${session.user.id}/${exam.id}/${Date.now()}-${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("student-answers")
        .upload(filePath, selectedAnswerFile);

      if (uploadError) throw uploadError;

      const { error: saveError } = await supabase
        .from("unit_exam_submissions")
        .insert({
          exam_id: exam.id,
          student_id: session.user.id,
          file_path: filePath,
        });

      if (saveError) {
        await supabase.storage
          .from("student-answers")
          .remove([filePath]);
        throw saveError;
      }

      setSelectedAnswerFile(null);
      setExamStudentMessage("تم رفع إجابتك بنجاح.");
    } catch (error) {
      console.error("Exam answer upload error:", error);
      setExamStudentMessage("تعذر رفع الإجابة: " + error.message);
    } finally {
      setUploadingExam(false);
    }
  };

  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [units, setUnits] = useState([]);
  const [unitExams, setUnitExams] = useState([]);
  const [selectedAnswerFile, setSelectedAnswerFile] = useState(null);
  const [uploadingExam, setUploadingExam] = useState(false);
  const [examStudentMessage, setExamStudentMessage] = useState("");
  const [lessonProgress, setLessonProgress] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [myQuestion, setMyQuestion] = useState(null);
  const [questionInput, setQuestionInput] = useState("");
  const [questionLoading, setQuestionLoading] = useState(false);
  const [teacherQuestions, setTeacherQuestions] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
const [isAskOpen, setIsAskOpen] = useState(false);
  const currentUser = session?.user || null;
  const isAdminUser = userRole === "admin";
const [notificationsList, setNotificationsList] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifGrade, setNotifGrade] = useState("all");
  const [sendingNotif, setSendingNotif] = useState(false);

  const loadNotifications = async () => {
    if (!currentUser) return;
    setNotificationsLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    setNotificationsLoading(false);
    if (!error) {
      setNotificationsList(data || []);
    }
  };

 useEffect(() => {
    if (!currentUser) return;

    loadNotifications();

    const channel = supabase
      .channel("public-notifications-feed")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
         if (payload.eventType === "INSERT" && payload.new) {
            setNotificationsList((prev) => {
              const exists = prev.some((item) => item.id === payload.new.id);
              if (!exists) {
                setHasUnreadAlerts(true);
                return [payload.new, ...prev];
              }
              return prev;
            });
          } else if (payload.eventType === "DELETE" && payload.old) {
            setNotificationsList((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    const cleanTitle = notifTitle.trim();
    const cleanBody = notifBody.trim();
    if (!cleanTitle || !cleanBody || !isAdminUser) return;

    setSendingNotif(true);
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        title: cleanTitle,
        body: cleanBody,
        target_grade: notifGrade,
      })
      .select()
      .single();
    setSendingNotif(false);

    if (error) {
      alert("تعذر نشر التنبيه، تأكد من الصلاحيات.");
      return;
    }

    if (data) {
      setNotificationsList((prev) =>
        prev.some((item) => item.id === data.id) ? prev : [data, ...prev]
      );
    }
    setNotifTitle("");
    setNotifBody("");
    setNotifGrade("all");
  };

  const handleDeleteNotification = async (notifId) => {
    if (!isAdminUser) return;
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notifId);
    if (!error) {
      setNotificationsList((prev) => prev.filter((item) => item.id !== notifId));
    }
  };

  // --- بداية: فك قفل الصوت وتشغيل تنبيه الأسئلة والردود ---
 const audioCtxRef = useRef(null);

 const unlockAudio = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
    } catch {
      // تجاهل أي خطأ بصمت
    }
  };

  useEffect(() => {
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("click", unlockAudio, { passive: true });
    return () => {
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("click", unlockAudio);
    };
  }, []);

const playAlertSound = (type = "question") => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;

      const runTone = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(type === "question" ? 880 : 660, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      };

      if (ctx.state === "suspended") {
        ctx.resume().then(runTone).catch(() => {});
      } else if (ctx.state === "running") {
        runTone();
      }
    } catch {
      // تجاهل أي خطأ صوتي بصمت
    }
  };
  // --- نهاية: فك قفل الصوت وتشغيل تنبيه الأسئلة والردود ---

  const loadQuestions = async () => {
    if (!currentUser) return;
    if (isAdminUser) {
      const { data } = await supabase
        .from("student_questions")
        .select("*")
        .order("created_at", { ascending: false });
      setTeacherQuestions(data || []);
    } else {
      const { data } = await supabase
        .from("student_questions")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setMyQuestion(data || null);
    }
  };

// --- بداية: اشتراك Realtime وإعادة المزامنة عند العودة للتطبيق ---
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel("student-questions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_questions",
        },
        (payload) => {
          const newRow = payload.new;
          const oldRow = payload.old;

          if (isAdminUser) {
            if (payload.eventType === "INSERT" && newRow) {
              setTeacherQuestions((prev) => {
                if (prev.some((item) => item.id === newRow.id)) return prev;
                playAlertSound("question");
                setHasUnreadAskTeacher(true);
                return [newRow, ...prev];
              });
            } else if (payload.eventType === "UPDATE" && newRow) {
              setTeacherQuestions((prev) =>
                prev.map((item) => (item.id === newRow.id ? newRow : item))
              );
            } else if (payload.eventType === "DELETE" && oldRow) {
              setTeacherQuestions((prev) =>
                prev.filter((item) => item.id !== oldRow.id)
              );
            }
          } else {
            if (
              (payload.eventType === "INSERT" || payload.eventType === "UPDATE") &&
              newRow &&
              newRow.user_id === currentUser.id
            ) {
             if (
  payload.eventType === "UPDATE" &&
  (newRow.answer || newRow.status === "answered")
) {
                playAlertSound("reply");
                setHasUnreadAskTeacher(true);
              }

              setMyQuestion((prev) => {
                if (!prev) return newRow;
                if (
                  newRow.id === prev.id ||
                  new Date(newRow.created_at) >= new Date(prev.created_at)
                ) {
                  return newRow;
                }
                return prev;
              });
            }
          }
        }
      )
      .subscribe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadQuestions();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [currentUser, isAdminUser]);
  // --- نهاية: اشتراك Realtime وإعادة المزامنة عند العودة للتطبيق ---

  useEffect(() => {
    loadQuestions();
  }, [currentUser?.id, isAdminUser]);

  const handleSendQuestion = async (e) => {
    e.preventDefault();
    const trimmed = questionInput.trim();
    if (!trimmed || !currentUser || myQuestion) return;
    setQuestionLoading(true);
    const { data, error } = await supabase
      .from("student_questions")
      .insert({
        user_id: currentUser.id,
        student_email: currentUser.email,
        question_text: trimmed,
        status: "pending",
      })
      .select()
      .single();
    setQuestionLoading(false);
    if (error) {
      alert("تعذر إرسال السؤال، حاول مرة أخرى.");
      return;
    }
    setMyQuestion(data);
    setQuestionInput("");
  };

  const handleDeleteMyQuestion = async () => {
    if (!myQuestion) return;
    setQuestionLoading(true);
    const { error } = await supabase
      .from("student_questions")
      .delete()
      .eq("id", myQuestion.id);
    setQuestionLoading(false);
    if (error) {
      alert("تعذر حذف المحادثة.");
      return;
    }
    setMyQuestion(null);
  };

  const handleSendReply = async (questionId) => {
    const answer = (replyDrafts[questionId] || "").trim();
    if (!answer) return;
    const { error } = await supabase
      .from("student_questions")
      .update({ answer_text: answer, status: "answered" })
      .eq("id", questionId);
    if (error) {
      alert("تعذر إرسال الرد.");
      return;
    }
    setReplyDrafts((prev) => ({ ...prev, [questionId]: "" }));
    loadQuestions();
  };

  const handleAdminDeleteQuestion = async (questionId) => {
    const { error } = await supabase
      .from("student_questions")
      .delete()
      .eq("id", questionId);
    if (!error) {
      setTeacherQuestions((prev) => prev.filter((q) => q.id !== questionId));
    }
  };
  
  const getBlockingLesson = (lesson) => {
    return lessons
      .filter(
        (previous) =>
          previous.course_id === lesson.course_id &&
          previous.unit_id === lesson.unit_id &&
          previous.position < lesson.position &&
          previous.is_required === true
      )
      .sort((a, b) => a.position - b.position)
      .find(
        (previous) =>
          !lessonProgress.some(
            (progress) =>
              progress.lesson_id === previous.id &&
              progress.is_passed === true
          )
      );
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!session?.user) {
        setUserRole(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Role error:", error.message);
        setUserRole(null);
        return;
      }

      setUserRole(data.role);
      console.log("User role:", data.role);
    };

    fetchUserRole();
  }, [session]);

  useEffect(() => {
    const fetchLessonProgress = async () => {
      if (!session?.user) {
        setLessonProgress([]);
        return;
      }

      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id, is_passed, best_score")
        .eq("student_id", session.user.id);

      if (error) {
        console.error("Progress error:", error.message);
        return;
      }

      setLessonProgress(data || []);
    };

    fetchLessonProgress();
  }, [session]);

  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);

        if (_event === "PASSWORD_RECOVERY") {
          setRecoveryMode(true);
        }

        setAuthLoading(false);
      }
    });

    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (mounted) {
          setSession(data.session);
        }
      } catch (error) {
        console.error("Session error:", error.message);

        if (mounted) {
          setAuthError("تعذر الاتصال بخدمة تسجيل الدخول.");
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };

    getSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);

      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, grade_level, is_published")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading courses:", error.message);
      } else {
        setCourses(data || []);
        console.log("Courses loaded:", data);
      }

      setLoadingCourses(false);
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchLessons = async () => {
      let data;
      let error;

      if (userRole === "admin") {
        const result = await supabase
          .from("lessons")
          .select("id, course_id, unit_id, title, youtube_url, position, pass_percent, is_published, is_required")
          .order("position", { ascending: true });

        data = result.data;
        error = result.error;
      } else {
        const result = await supabase.rpc("get_lesson_catalog");

        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("Error loading lessons:", error.message);
        return;
      }

      setLessons(data || []);
      console.log("Lessons loaded:", data);
    };

    fetchLessons();
  }, [session, userRole]);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!session?.user?.id) {
        setUnits([]);
        return;
      }

      const { data, error } = await supabase
        .from("units")
        .select("id, course_id, title, description, position, is_open")
        .order("position", { ascending: true });

      if (error) {
        console.error("Error loading units:", error.message);
        return;
      }

      setUnits(data || []);
    };

    fetchUnits();
  }, [session]);

  useEffect(() => {
    const fetchUnitExams = async () => {
      if (!session?.user) {
        setUnitExams([]);
        return;
      }

      const { data, error } = await supabase
        .from("unit_exams")
        .select("id, unit_id, title, pass_percent, is_published, file_path");

      if (error) {
        console.error("Error loading unit exams:", error.message);
        return;
      }

      setUnitExams(data || []);
    };

    fetchUnitExams();
  }, [session, userRole]);

  useEffect(() => {
    if (selectedQuizLesson) {
      fetchAdminQuestions(selectedQuizLesson);
    } else {
      setAdminQuestions([]);
    }
  }, [selectedQuizLesson]);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error.message);
      setAuthError("فشل تسجيل الدخول: " + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://myeducationapp.vercel.app",
      },
    });

    if (error) {
      console.error("Google login error:", error.message);
      setAuthError("فشل تسجيل الدخول باستخدام Google: " + error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError("اكتب بريدك الإلكتروني أولاً.");
      return;
    }

    setAuthError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://myeducationapp.vercel.app",
    });

    if (error) {
      setAuthError("تعذر إرسال رابط الاستعادة: " + error.message);
    } else {
      setAuthError("تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setAuthError("فشل إنشاء الحساب: " + error.message);
    } else {
      setAuthError("تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيده.");
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setCourseFormMessage("");

    if (userRole !== "admin") {
      setCourseFormMessage("ليس لديك صلاحية لإضافة الدورات.");
      return;
    }

    if (!newCourseTitle.trim()) {
      setCourseFormMessage("يرجى كتابة اسم الدورة.");
      return;
    }

    setSavingCourse(true);

    try {
      const { error } = await supabase
        .from("courses")
        .insert({
          title: newCourseTitle.trim(),
          grade_level: newCourseGrade,
          description: newCourseDescription.trim(),
          is_published: newCoursePublished,
        });

      if (error) {
        setCourseFormMessage("تعذر حفظ الدورة: " + error.message);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("courses")
        .select("id, title, description, grade_level, is_published")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setCourseFormMessage("تمت الإضافة، لكن تعذر تحديث القائمة.");
        return;
      }

      setCourses(data || []);
      setNewCourseTitle("");
      setNewCourseGrade("first_intermediate");
      setNewCourseDescription("");
      setNewCoursePublished(false);

      setCourseFormMessage("تمت إضافة الدورة بنجاح.");
    } catch (error) {
      setCourseFormMessage("حدث خطأ: " + error.message);
    } finally {
      setSavingCourse(false);
    }
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    setSavingUnit(true);
    setUnitMessage("");

    const { data, error } = await supabase
      .from("units")
      .insert({
        course_id: newUnitCourse,
        title: newUnitTitle,
        position: newUnitPosition,
      })
      .select()
      .single();

    setSavingUnit(false);

    if (error) {
      setUnitMessage("تعذر إضافة الوحدة: " + error.message);
      return;
    }

    setUnits((previous) => [...previous, data]);
    setNewUnitTitle("");
    setUnitMessage("تمت إضافة الوحدة بنجاح.");
  };

  const handleAddExam = async (e) => {
    e.preventDefault();

    if (!examUnit || !examTitle.trim() || !examFile) {
      setExamMessage("يرجى إكمال جميع الحقول واختيار ملف الأسئلة.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(examFile.type)) {
      setExamMessage("يسمح فقط بملفات PDF أو Word.");
      return;
    }

    setSavingExam(true);
    setExamMessage("");

    try {
      const fileName = examFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${examUnit}/${Date.now()}-${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("unit-exams")
        .upload(filePath, examFile);

      if (uploadError) throw uploadError;

      const { error: saveError } = await supabase
        .from("unit_exams")
        .upsert(
          {
            unit_id: examUnit,
            title: examTitle.trim(),
            pass_percent: Number(examPassPercent),
            file_path: filePath,
            is_published: false,
          },
          { onConflict: "unit_id" }
        );

      if (saveError) {
        await supabase.storage.from("unit-exams").remove([filePath]);
        throw saveError;
      }

      setExamTitle("");
      setExamUnit("");
      setExamPassPercent(50);
      setExamFile(null);
      setExamMessage("تم حفظ الامتحان بنجاح، وهو غير منشور حالياً.");
    } catch (error) {
      console.error("Exam save error:", error);
      setExamMessage("تعذر حفظ الامتحان: " + error.message);
    } finally {
      setSavingExam(false);
    }
  };

  const handleToggleUnit = async (unit) => {
    const { error } = await supabase
      .from("units")
      .update({ is_open: !unit.is_open })
      .eq("id", unit.id);

    if (error) {
      setUnitMessage("تعذر تحديث الوحدة: " + error.message);
      return;
    }

    setUnits((previous) =>
      previous.map((item) =>
        item.id === unit.id
          ? { ...item, is_open: !unit.is_open }
          : item
      )
    );

    setUnitMessage("تم تحديث حالة الوحدة بنجاح.");
  };

  const handleToggleExamPublish = async (exam) => {
    const newStatus = !exam.is_published;

    setExamMessage("جارٍ تحديث حالة الامتحان...");

    try {
      const { data, error } = await supabase
        .from("unit_exams")
        .update({ is_published: newStatus })
        .eq("id", exam.id)
        .select("id, is_published")
        .single();

      if (error) throw error;

      setUnitExams((previous) =>
        previous.map((item) =>
          item.id === exam.id
            ? { ...item, is_published: data.is_published }
            : item
        )
      );

      setExamMessage(
        data.is_published
          ? "تم نشر الامتحان بنجاح."
          : "تم إيقاف نشر الامتحان."
      );
    } catch (error) {
      console.error("Toggle exam publish error:", error);
      setExamMessage("تعذر تغيير حالة النشر: " + error.message);
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    setLessonFormMessage("");

    if (userRole !== "admin") {
      setLessonFormMessage("ليس لديك صلاحية لإضافة الدروس.");
      return;
    }

    if (!newLessonTitle.trim() || !newLessonVideo.trim()) {
      setLessonFormMessage("يرجى كتابة اسم الدرس ورابط الفيديو.");
      return;
    }

    setSavingLesson(true);

    try {
      const { error } = await supabase
        .from("lessons")
        .insert({
          course_id: "702c051e-f7f8-46d6-b22d-c5e5d9d6ab4c",
          unit_id: newLessonUnit,
          title: newLessonTitle.trim(),
          youtube_url: newLessonVideo.trim(),
          position: Number(newLessonPosition),
          pass_percent: Number(newLessonPassPercent),
          is_published: true,
          is_required: newLessonRequired,
        });

      if (error) {
        setLessonFormMessage("تعذر حفظ الدرس: " + error.message);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("lessons")
        .select("id, course_id, unit_id, title, youtube_url, position, pass_percent, is_published, is_required")
        .order("position", { ascending: true });

      if (fetchError) {
        setLessonFormMessage("تمت الإضافة، لكن تعذر تحديث القائمة.");
        return;
      }

      setLessons(data || []);
      setNewLessonTitle("");
      setNewLessonVideo("");
      setNewLessonUnit("");
      setNewLessonPosition(Number(newLessonPosition) + 1);
      setNewLessonPassPercent(70);

      setLessonFormMessage("تمت إضافة الدرس بنجاح.");
    } catch (error) {
      setLessonFormMessage("حدث خطأ: " + error.message);
    } finally {
      setSavingLesson(false);
    }
  };

  const handleUpdatePassPercent = async (lesson) => {
    const value = window.prompt(
      "أدخل نسبة النجاح الجديدة من 1 إلى 100:",
      lesson.pass_percent
    );

    if (value === null) return;

    const percent = Number(value);

    if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
      alert("أدخل نسبة صحيحة بين 1 و100.");
      return;
    }

    const { error } = await supabase
      .from("lessons")
      .update({ pass_percent: percent })
      .eq("id", lesson.id);

    if (error) {
      alert("تعذر تحديث النسبة: " + error.message);
      return;
    }

    setLessons((current) =>
      current.map((item) =>
        item.id === lesson.id
          ? { ...item, pass_percent: percent }
          : item
      )
    );

    alert("تم تحديث نسبة النجاح بنجاح.");
  };

  const handleUpdateLesson = async (lesson) => {
    const title = window.prompt("أدخل عنوان الدرس الجديد:", lesson.title);
    if (title === null) return;

    const video = window.prompt("أدخل رابط الفيديو الجديد:", lesson.youtube_url || "");
    if (video === null) return;

    const position = window.prompt("أدخل ترتيب الدرس:", lesson.position);
    if (position === null) return;

    if (!title.trim() || !video.trim()) {
      alert("العنوان ورابط الفيديو مطلوبان.");
      return;
    }

    const newPosition = Number(position);

    if (!Number.isInteger(newPosition) || newPosition < 1) {
      alert("ترتيب الدرس يجب أن يكون رقماً صحيحاً يبدأ من 1.");
      return;
    }

    const { error } = await supabase
      .from("lessons")
      .update({
        title: title.trim(),
        youtube_url: video.trim(),
        position: newPosition,
      })
      .eq("id", lesson.id);

    if (error) {
      alert("تعذر تعديل الدرس: " + error.message);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("lessons")
      .select("id, course_id, unit_id, title, youtube_url, position, pass_percent, is_published")
      .order("position", { ascending: true });

    if (fetchError) {
      alert("تم التعديل، لكن تعذر تحديث القائمة.");
      return;
    }

    setLessons(data || []);
    alert("تم تعديل بيانات الدرس بنجاح.");
  };

  const handleToggleLessonPublish = async (lesson) => {
    const newStatus = !lesson.is_published;

    const { error } = await supabase
      .from("lessons")
      .update({ is_published: newStatus })
      .eq("id", lesson.id);

    if (error) {
      alert("تعذر تغيير حالة النشر: " + error.message);
      return;
    }

    setLessons((current) =>
      current.map((item) =>
        item.id === lesson.id
          ? { ...item, is_published: newStatus }
          : item
      )
    );

    alert(newStatus ? "تم نشر الدرس." : "تم إيقاف نشر الدرس.");
  };

  const handleToggleLessonRequired = async (lesson) => {
    const newStatus = !lesson.is_required;

    const { error } = await supabase
      .from("lessons")
      .update({ is_required: newStatus })
      .eq("id", lesson.id);

    if (error) {
      alert("تعذر تغيير حالة إلزامية الدرس: " + error.message);
      return;
    }

    setLessons((current) =>
      current.map((item) =>
        item.id === lesson.id
          ? { ...item, is_required: newStatus }
          : item
      )
    );

    alert(newStatus ? "أصبح الدرس إلزامياً." : "أصبح الدرس عادياً.");
  };

  const handleDeleteLesson = async (lesson) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الدرس "${lesson.title}"؟ سيتم حذف الأسئلة والمحاولات والتقدم المرتبط به، ولا يمكن التراجع عن ذلك.`
    );

    if (!confirmed) return;

    const { error } = await supabase.rpc("admin_delete_lesson", {
      p_lesson_id: lesson.id,
    });

    if (error) {
      alert("تعذر حذف الدرس: " + error.message);
      return;
    }

    setLessons((current) =>
      current.filter((item) => item.id !== lesson.id)
    );

    alert("تم حذف الدرس وكل البيانات المرتبطة به.");
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setQuestionFormMessage("");

    if (userRole !== "admin") {
      setQuestionFormMessage("ليس لديك صلاحية لإضافة الأسئلة.");
      return;
    }

    if (!selectedQuizLesson) {
      setQuestionFormMessage("يرجى اختيار الدرس.");
      return;
    }

    if (!newQuestionText.trim()) {
      setQuestionFormMessage("يرجى كتابة نص السؤال.");
      return;
    }

    if (newQuestionOptions.some((option) => !option.trim())) {
      setQuestionFormMessage("يرجى كتابة الخيارات الثلاثة.");
      return;
    }

    setSavingQuestion(true);

    try {
      const { error } = await supabase.rpc("admin_add_question", {
        p_lesson_id: selectedQuizLesson,
        p_question_text: newQuestionText.trim(),
        p_options: newQuestionOptions.map((option) => option.trim()),
        p_correct_option: correctOptionIndex + 1,
      });

      if (error) {
        setQuestionFormMessage("تعذر حفظ السؤال: " + error.message);
        return;
      }

      setNewQuestionText("");
      setNewQuestionOptions(["", "", ""]);
      setCorrectOptionIndex(0);

      setQuestionFormMessage("تم حفظ السؤال بنجاح.");
    } catch (error) {
      setQuestionFormMessage("حدث خطأ: " + error.message);
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleEditQuestion = async (question) => {
    setEditingQuestionId(question.id);
    setEditQuestionText(question.question_text);

    setEditQuestionOptions(
      question.question_options.map((option) => option.option_text)
    );

    const { data, error } = await supabase.rpc(
      "admin_get_correct_option",
      {
        p_question_id: question.id,
      }
    );

    if (error) {
      setQuestionFormMessage(
        "تعذر تحميل الإجابة الصحيحة: " + error.message
      );
      setEditingQuestionId(null);
      return;
    }

    setEditCorrectOptionIndex(data - 1);
  };

  const handleSaveQuestionEdit = async (e) => {
    e.preventDefault();
    setQuestionFormMessage("");

    if (!editQuestionText.trim()) {
      setQuestionFormMessage("يرجى كتابة نص السؤال.");
      return;
    }

    if (editQuestionOptions.some((option) => !option.trim())) {
      setQuestionFormMessage("يرجى كتابة الخيارات الثلاثة.");
      return;
    }

    const { error } = await supabase.rpc("admin_update_question", {
      p_question_id: editingQuestionId,
      p_question_text: editQuestionText.trim(),
      p_options: editQuestionOptions.map((option) => option.trim()),
      p_correct_option: editCorrectOptionIndex + 1,
    });

    if (error) {
      setQuestionFormMessage("تعذر حفظ التعديل: " + error.message);
      return;
    }

    await fetchAdminQuestions(selectedQuizLesson);
    setEditingQuestionId(null);
    setQuestionFormMessage("تم تعديل السؤال بنجاح.");
  };

  const handleDeleteQuestion = async (questionId) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن الحذف."
    );

    if (!confirmed) return;

    setQuestionFormMessage("");

    const { error } = await supabase.rpc("admin_delete_question", {
      p_question_id: questionId,
    });

    if (error) {
      setQuestionFormMessage("تعذر حذف السؤال: " + error.message);
      return;
    }

    await fetchAdminQuestions(selectedQuizLesson);

    if (editingQuestionId === questionId) {
      setEditingQuestionId(null);
    }

    setQuestionFormMessage("تم حذف السؤال بنجاح.");
  };

  const fetchAdminQuestions = async (lessonId) => {
    if (!lessonId) {
      setAdminQuestions([]);
      return;
    }

    setLoadingAdminQuestions(true);

    const { data, error } = await supabase
      .from("questions")
      .select(`
      id,
      question_text,
      position,
      question_options (
        id,
        option_text,
        position
      )
    `)
      .eq("lesson_id", lessonId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Admin questions error:", error.message);
      setQuestionFormMessage("تعذر تحميل الأسئلة: " + error.message);
      setAdminQuestions([]);
    } else {
      const sortedQuestions = (data || []).map((question) => ({
        ...question,
        question_options: [...(question.question_options || [])].sort(
          (a, b) => a.position - b.position
        ),
      }));

      setAdminQuestions(sortedQuestions);
    }

    setLoadingAdminQuestions(false);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (newPassword.length < 6) {
      setAuthError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setRecoveryMode(false);
      setNewPassword("");
      alert("تم تغيير كلمة المرور بنجاح.");
    }
  };

  if (authLoading) {
    return <div>جاري التحميل...</div>;
  }

  if (recoveryMode) {
    return (
      <div className="login-page" dir="rtl">
        <div className="login-box">
          <h1>Active Zed</h1>
          <h2>تعيين كلمة مرور جديدة</h2>

          <form onSubmit={handlePasswordUpdate}>
            <input
              type="password"
              placeholder="كلمة المرور الجديدة"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />

            {authError && <p>{authError}</p>}

            <button type="submit">حفظ كلمة المرور</button>
          </form>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="login-page" dir="rtl">
        <div className="login-box">
          <h1>MyEducation</h1>
          <h2>تسجيل الدخول</h2>
          <p>أهلاً بك في منصة التعلم الذكي</p>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={handleForgotPassword}
              className="forgot-password-button"
            >
              نسيت كلمة المرور؟
            </button>
            {authError && <p>{authError}</p>}

            <button type="submit">دخول</button>

            <button
              type="button"
              onClick={handleSignUp}
              className="signup-button"
            >
              إنشاء حساب جديد
            </button>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="google-login-button"
            >
              الاستمرار باستخدام Google
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app" dir="rtl">
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">A</div>
          <div>
            <h1>Active Zed</h1>
            <span>منصة التعلم الذكي</span>
          </div>
        </div>

        <button
          type="button"
          className="profile-button"
          aria-label="حسابي"
          onClick={() => {
            setActiveTab("حسابي");
            setSelectedCourse(null);
          }}
        >
          <span>👤</span>
          <span className="logout-label">حسابي</span>
        </button>
      </header>

      {userRole === "admin" && (
        <>
          <div className="admin-banner">
            <span>🛠️ لوحة تحكم المدير</span>
            <span>إدارة منصة Active Zed</span>
          </div>

          <nav className="admin-nav">
            <button onClick={() => setAdminSection("dashboard")}>
              الرئيسية
            </button>

            <button onClick={() => setAdminSection("courses")}>
              إدارة الدورات
            </button>

            <button onClick={() => setAdminSection("units")}>
              إدارة الوحدات
            </button>

            <button onClick={() => setAdminSection("lessons")}>
              إدارة الدروس
            </button>

            <button onClick={() => setAdminSection("questions")}>
              الاختبارات
            </button>

            <button onClick={() => setAdminSection("unitExams")}>
              امتحانات الوحدات
            </button>
          </nav>
        </>
      )}

      <main className="main-content">
        {userRole === "admin" && adminSection !== "dashboard" && (
          <section className="admin-content">
            {adminSection === "courses" && (
              <>
                <h2>إدارة الدورات</h2>
                <p>إضافة وإدارة دورات اللغة الإنجليزية</p>

                <form className="admin-course-form" onSubmit={handleAddCourse}>
                  <label>اسم الدورة</label>
                  <input
                    type="text"
                    placeholder="مثلاً: اللغة الإنجليزية – الصف الأول المتوسط"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    required
                  />

                  <label>الصف الدراسي</label>
                  <select
                    value={newCourseGrade}
                    onChange={(e) => setNewCourseGrade(e.target.value)}
                  >
                    <option value="first_intermediate">الأول المتوسط</option>
                    <option value="second_intermediate">الثاني المتوسط</option>
                    <option value="third_intermediate">الثالث المتوسط</option>
                    <option value="fourth_preparatory">الرابع الإعدادي</option>
                    <option value="fifth_preparatory">الخامس الإعدادي</option>
                    <option value="sixth_preparatory">السادس الإعدادي</option>
                  </select>

                  <label>وصف الدورة</label>
                  <textarea
                    placeholder="اكتب وصفاً مختصراً للدورة..."
                    value={newCourseDescription}
                    onChange={(e) => setNewCourseDescription(e.target.value)}
                    rows={4}
                  />

                  <button type="submit" disabled={savingCourse}>
                    {savingCourse ? "جاري الحفظ..." : "إضافة الدورة"}
                  </button>

                  {courseFormMessage && <p>{courseFormMessage}</p>}
                </form>

                <h3>الدورات المسجلة</h3>

                {loadingCourses ? (
                  <p>جاري تحميل الدورات...</p>
                ) : courses.length === 0 ? (
                  <p>لا توجد دورات حالياً.</p>
                ) : (
                  courses.map((course) => (
                    <div className="admin-course-item" key={course.id}>
                      <h3>{course.title}</h3>
                      <p>{course.description}</p>
                      <span>{course.is_published ? "منشورة" : "غير منشورة"}</span>
                    </div>
                  ))
                )}
              </>
            )}

            {adminSection === "units" && (
              <>
                <h2>إدارة الوحدات</h2>

                <form className="admin-course-form" onSubmit={handleAddUnit}>
                  <label>اختر الدورة</label>
                  <select
                    value={newUnitCourse}
                    onChange={(e) => setNewUnitCourse(e.target.value)}
                    required
                  >
                    <option value="">اختر الدورة</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>

                  <label>اسم الوحدة</label>
                  <input
                    type="text"
                    value={newUnitTitle}
                    onChange={(e) => setNewUnitTitle(e.target.value)}
                    placeholder="مثلاً: Unit 1 – My spare time"
                    required
                  />

                  <label>ترتيب الوحدة</label>
                  <input
                    type="number"
                    min="1"
                    value={newUnitPosition}
                    onChange={(e) => setNewUnitPosition(Number(e.target.value))}
                    required
                  />

                  <button type="submit" disabled={savingUnit}>
                    {savingUnit ? "جارٍ الحفظ..." : "إضافة الوحدة"}
                  </button>
                </form>

                {unitMessage && <p>{unitMessage}</p>}

                <h3>الوحدات الموجودة</h3>

                <div className="admin-course-list">
                  {units.length === 0 ? (
                    <p>لا توجد وحدات مضافة حالياً.</p>
                  ) : (
                    units.map((unit) => (
                      <div className="admin-course-item" key={unit.id}>
                        <h4>{unit.title}</h4>
                        <p>
                          الدورة: {
                            courses.find((course) => course.id === unit.course_id)?.title
                            || "غير محددة"
                          }
                        </p>
                        <p>الترتيب: {unit.position}</p>
                        <p>{unit.is_open ? "مفتوحة للطلاب" : "مغلقة أمام الطلاب"}</p>
                        <button onClick={() => handleToggleUnit(unit)}>
                          {unit.is_open ? "إغلاق الوحدة" : "فتح الوحدة"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {adminSection === "unitExams" && (
              <>
                <h2>إدارة امتحانات الوحدات</h2>

                <form className="admin-course-form" onSubmit={handleAddExam}>
                  <h3>إضافة امتحان شامل</h3>

                  <label>اختر الوحدة</label>
                  <select
                    value={examUnit}
                    onChange={(e) => setExamUnit(e.target.value)}
                    required
                  >
                    <option value="">اختر الوحدة</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.title}
                      </option>
                    ))}
                  </select>

                  <label>عنوان الامتحان</label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="مثلاً: امتحان شامل للوحدة الأولى"
                    required
                  />

                  <label>نسبة النجاح (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={examPassPercent}
                    onChange={(e) => setExamPassPercent(e.target.value)}
                    required
                  />

                  <label>ملف أسئلة الامتحان (PDF أو Word)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setExamFile(e.target.files[0] || null)}
                    required
                  />

                  <button type="submit" disabled={savingExam}>
                    {savingExam ? "جارٍ حفظ الامتحان..." : "حفظ الامتحان"}
                  </button>
                </form>

                {examMessage && <p>{examMessage}</p>}

                <h3>الامتحانات المحفوظة</h3>

                {unitExams.length === 0 ? (
                  <p>لا توجد امتحانات محفوظة حالياً.</p>
                ) : (
                  unitExams.map((exam) => {
                    const examUnitInfo = units.find(
                      (unit) => unit.id === exam.unit_id
                    );

                    return (
                      <div className="admin-course-item" key={exam.id}>
                        <h3>{exam.title}</h3>

                        <p>الوحدة: {examUnitInfo?.title || "غير معروفة"}</p>
                        <p>نسبة النجاح: {exam.pass_percent}%</p>

                        <p>
                          الحالة: {exam.is_published ? "منشور ✅" : "غير منشور"}
                        </p>

                        <button
                          type="button"
                          onClick={() => handleToggleExamPublish(exam)}
                        >
                          {exam.is_published ? "إيقاف النشر" : "نشر الامتحان"}
                        </button>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {adminSection === "lessons" && (
              <>
                <h2>إدارة الدروس</h2>
                <form className="admin-course-form" onSubmit={handleAddLesson}>
                  <h3>إضافة درس جديد</h3>
                  <label>اختر الوحدة</label>
                  <select
                    value={newLessonUnit}
                    onChange={(e) => setNewLessonUnit(e.target.value)}
                    required
                  >
                    <option value="">اختر الوحدة</option>
                    {units
                      .filter((unit) => unit.course_id === "702c051e-f7f8-46d6-b22d-c5e5d9d6ab4c")
                      .map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.title}
                        </option>
                      ))}
                  </select>
                  <label>اسم الدرس</label>
                  <input
                    type="text"
                    placeholder="مثلاً: المضارع البسيط"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    required
                  />

                  <label>رابط فيديو YouTube</label>
                  <input
                    type="url"
                    placeholder="https://youtu.be/..."
                    value={newLessonVideo}
                    onChange={(e) => setNewLessonVideo(e.target.value)}
                    required
                  />

                  <label>ترتيب الدرس</label>
                  <input
                    type="number"
                    min="1"
                    value={newLessonPosition}
                    onChange={(e) => setNewLessonPosition(e.target.value)}
                    required
                  />

                  <label>نسبة النجاح المطلوبة (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newLessonPassPercent}
                    onChange={(e) => setNewLessonPassPercent(e.target.value)}
                    required
                  />
                  <label className="required-lesson-option">
                    <input
                      type="checkbox"
                      checked={newLessonRequired}
                      onChange={(e) => setNewLessonRequired(e.target.checked)}
                    />
                    هذا الدرس إلزامي ويجب اجتياز اختباره
                  </label>
                  <button type="submit" disabled={savingLesson}>
                    {savingLesson ? "جاري الحفظ..." : "إضافة الدرس"}
                  </button>

                  {lessonFormMessage && <p>{lessonFormMessage}</p>}
                </form>
                <p>دروس اللغة الإنجليزية للصف الأول المتوسط</p>

                {lessons.filter(
                  (lesson) =>
                    lesson.course_id === "702c051e-f7f8-46d6-b22d-c5e5d9d6ab4c"
                ).length === 0 ? (
                  <p>لا توجد دروس مسجلة حالياً.</p>
                ) : (
                  lessons
                    .filter(
                      (lesson) =>
                        lesson.course_id === "702c051e-f7f8-46d6-b22d-c5e5d9d6ab4c"
                    )
                    .map((lesson) => (
                      <div className="admin-course-item" key={lesson.id}>
                        <h3>{lesson.title}</h3>

                        <p>ترتيب الدرس: {lesson.position}</p>
                        <p>نسبة النجاح المطلوبة: {lesson.pass_percent}%</p>
                        <p>
                          حالة الدرس: {lesson.is_required ? "إلزامي 🔒" : "عادي"}
                        </p>

                        <button
                          type="button"
                          onClick={() => handleToggleLessonRequired(lesson)}
                        >
                          {lesson.is_required ? "جعله درساً عادياً" : "جعله درساً إلزامياً"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdatePassPercent(lesson)}
                        >
                          تعديل نسبة النجاح
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateLesson(lesson)}
                        >
                          تعديل بيانات الدرس
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleLessonPublish(lesson)}
                        >
                          {lesson.is_published ? "إيقاف نشر الدرس" : "نشر الدرس"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(lesson)}
                        >
                          حذف الدرس
                        </button>

                        <p>
                          الحالة: {lesson.is_published ? "منشور" : "غير منشور"}
                        </p>

                        {lesson.youtube_url && (
                          <a
                            href={lesson.youtube_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            مشاهدة فيديو الدرس
                          </a>
                        )}
                      </div>
                    ))
                )}
              </>
            )}

            {adminSection === "questions" && (
              <>
                <h2>إدارة الاختبارات</h2>

                <form className="admin-course-form" onSubmit={handleAddQuestion}>
                  <h3>إضافة سؤال جديد</h3>

                  <label>اختر الدرس</label>
                  <select
                    value={selectedQuizLesson}
                    onChange={(e) => setSelectedQuizLesson(e.target.value)}
                    required
                  >
                    <option value="">اختر الدرس</option>
                    {lessons
                      .filter(
                        (lesson) =>
                          lesson.course_id === "702c051e-f7f8-46d6-b22d-c5e5d9d6ab4c"
                      )
                      .map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </option>
                      ))}
                  </select>

                  <label>نص السؤال</label>
                  <textarea
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="اكتب السؤال هنا"
                    required
                  />

                  {[0, 1, 2].map((index) => (
                    <div key={index}>
                      <label>الخيار {index + 1}</label>
                      <input
                        type="text"
                        value={newQuestionOptions[index]}
                        onChange={(e) => {
                          const updated = [...newQuestionOptions];
                          updated[index] = e.target.value;
                          setNewQuestionOptions(updated);
                        }}
                        placeholder={`اكتب الخيار ${index + 1}`}
                        required
                      />
                      <label>
                        <input
                          type="radio"
                          name="correctOption"
                          checked={correctOptionIndex === index}
                          onChange={() => setCorrectOptionIndex(index)}
                        />
                        هذا هو الجواب الصحيح
                      </label>
                    </div>
                  ))}

                  <button type="submit" disabled={savingQuestion}>
                    {savingQuestion ? "جاري الحفظ..." : "حفظ السؤال"}
                  </button>

                  {questionFormMessage && <p>{questionFormMessage}</p>}
                </form>

                <div className="admin-questions-list">
                  <h3>الأسئلة المحفوظة</h3>
                  <button
                    type="button"
                    onClick={() => setShowQuizPreview(!showQuizPreview)}
                    disabled={adminQuestions.length === 0}
                  >
                    {showQuizPreview ? "إغلاق المعاينة" : "معاينة الاختبار"}
                  </button>
                  {showQuizPreview && (
                    <div className="quiz-preview">
                      <h3>معاينة الاختبار</h3>
                      <p>هذه معاينة فقط، ولا يتم تسجيل أي محاولة أو درجة.</p>

                      {adminQuestions.map((question, index) => (
                        <div className="quiz-question" key={question.id}>
                          <h4>
                            السؤال {index + 1}: {question.question_text}
                          </h4>

                          {question.question_options.map((option) => (
                            <div className="quiz-option" key={option.id}>
                              <label>
                                <input type="radio" disabled />
                                {option.option_text}
                              </label>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {loadingAdminQuestions && <p>جاري تحميل الأسئلة...</p>}

                  {!loadingAdminQuestions && adminQuestions.length === 0 && (
                    <p>لا توجد أسئلة لهذا الدرس حالياً.</p>
                  )}

                  {!loadingAdminQuestions && adminQuestions.map((question, index) => (
                    <div key={question.id} className="quiz-question">
                      <h4>
                        السؤال {index + 1}: {question.question_text}
                      </h4>

                      {question.question_options.map((option) => (
                        <p key={option.id}>
                          {option.position}. {option.option_text}
                        </p>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleEditQuestion(question)}
                      >
                        تعديل السؤال
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        حذف السؤال
                      </button>
                      {editingQuestionId === question.id && (
                        <form onSubmit={handleSaveQuestionEdit}>
                          <h4>تعديل السؤال</h4>

                          <label>نص السؤال</label>
                          <textarea
                            value={editQuestionText}
                            onChange={(e) => setEditQuestionText(e.target.value)}
                            required
                          />

                          {editQuestionOptions.map((option, optionIndex) => (
                            <div key={optionIndex}>
                              <label>الخيار {optionIndex + 1}</label>

                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const updated = [...editQuestionOptions];
                                  updated[optionIndex] = e.target.value;
                                  setEditQuestionOptions(updated);
                                }}
                                required
                              />

                              <label>
                                <input
                                  type="radio"
                                  name="editCorrectOption"
                                  checked={editCorrectOptionIndex === optionIndex}
                                  onChange={() => setEditCorrectOptionIndex(optionIndex)}
                                />
                                الجواب الصحيح
                              </label>
                            </div>
                          ))}

                          <button type="submit">
                            حفظ التعديلات
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingQuestionId(null)}
                          >
                            إلغاء
                          </button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {(activeTab === "الرئيسية" || activeTab === "الدورات") && (
          <>
            <section className="welcome-card">
              <div className="welcome-text">
                <span className="welcome-label">مرحباً بك في رحلتك التعليمية 👋</span>
                <h2>تعلم اليوم، واصنع مستقبلك غداً</h2>
                <p>ابدأ رحلتك التعليمية واكتسب مهارات جديدة كل يوم.</p>
               <button
                className="primary-button"
                onClick={() => {
                  setActiveTab("الدورات");
                  setSelectedCourse(null);
                  setTimeout(() => {
                    document
                      .querySelector(".courses-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 50);
                }}
              >
                استكشف الدورات <span>←</span>
              </button>
              </div>
              <div className="welcome-art">🎓</div>
            </section>

           <section className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon purple-icon">📚</span>
                <div>
                  <strong>{courses.length}</strong>
                  <span>دورات متاحة</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon green-icon">🏆</span>
                <div>
                  <strong>{lessonProgress.filter((item) => item.is_passed).length}</strong>
                  <span>دروس مجتازة</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon orange-icon">⭐</span>
                <div>
                  <strong>
                    {lessons.length > 0
                      ? Math.round(
                          (lessonProgress.filter((item) => item.is_passed).length /
                            lessons.length) *
                            100
                        )
                      : 0}
                    %
                  </strong>
                  <span>نسبة التقدم</span>
                </div>
              </div>
            </section>

            <section className="courses-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">تعلم واكتشف</span>
                  <h2>{selectedCourse ? "تفاصيل الدورة" : "الدورات التعليمية"}</h2>
                </div>
                {selectedCourse && (
                 <button
  className="back-button"
  onClick={() => {
    setSelectedCourse(null);
    setSelectedUnit(null);
    setSelectedLesson(null);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizResult(null);
    setQuizReview([]);
  }}
>
  العودة للدورات
</button>
                )}
              </div>

              {!selectedCourse && (
                <div className="search-box">
                  <span>🔎</span>
                  <input
                    type="text"
                    placeholder="ابحث عن دورة تعليمية..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              )}

              {selectedCourse ? (
                <div className="course-details">
                  <div className={`course-banner ${selectedCourse.color}`}>
                    <span>{selectedCourse.icon}</span>
                   <div className="course-detail-heading">
  <span className="course-detail-subject">اللغة الإنكليزية</span>
  <h2>
    {selectedCourse.title
      .replace(/^.*?(?:–|—|-|:|\|)\s*/, "")
      .trim() || selectedCourse.title}
  </h2>
</div>
                  </div>
                  <p>{selectedCourse.description}</p>
                 <div className="detail-row">
                    <span>عدد الدروس</span>
                    <strong>
                      {lessons.filter((l) => l.course_id === selectedCourse.id).length} دروس
                    </strong>
                  </div>
                  <div className="detail-row">
                    <span>تقدمك في الدورة</span>
                    <strong>
                      {(() => {
                        const courseLessons = lessons.filter(
                          (l) => l.course_id === selectedCourse.id
                        );
                        if (courseLessons.length === 0) return "0%";
                        const passedCount = courseLessons.filter((l) =>
                          lessonProgress.some(
                            (p) => p.lesson_id === l.id && p.is_passed
                          )
                        ).length;
                        return `${Math.round((passedCount / courseLessons.length) * 100)}%`;
                      })()}
                    </strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(() => {
                          const courseLessons = lessons.filter(
                            (l) => l.course_id === selectedCourse.id
                          );
                          if (courseLessons.length === 0) return 0;
                          const passedCount = courseLessons.filter((l) =>
                            lessonProgress.some(
                              (p) => p.lesson_id === l.id && p.is_passed
                            )
                          ).length;
                          return Math.round((passedCount / courseLessons.length) * 100);
                        })()}%`,
                      }}
                    />
                  </div>

                  <div className="course-lessons">
                    {units
                      .filter((unit) => unit.course_id === selectedCourse.id)
                      .map((unit) => (
                        <div key={unit.id} className="unit-item">
                          <button
                            className="course-button"
                            disabled={!unit.is_open}
                            onClick={() => {
                              if (unit.is_open) {
                                setSelectedUnit(
                                  selectedUnit?.id === unit.id ? null : unit
                                );
                                setSelectedLesson(null);
                                setQuizResult(null);
                              }
                            }}
                          >
                            {unit.is_open ? "📖 " : "🔒 "}
                            {unit.title}
                            {!unit.is_open && " - قريباً"}
                          </button>

                          {selectedUnit?.id === unit.id && (
                            <div className="unit-lessons">
                              {lessons
                                .filter(
                                  (lesson) =>
                                    lesson.course_id === selectedCourse.id &&
                                    lesson.unit_id === unit.id
                                )
                                .map((lesson) => (
                                  <div key={lesson.id} className="lesson-item">
                                    <button
                                      onClick={async () => {
                                        const blockingLesson = getBlockingLesson(lesson);

                                        if (blockingLesson) {
                                          alert(
                                            `يجب اجتياز اختبار الدرس السابق أولاً:\n${blockingLesson.title}`
                                          );
                                          return;
                                        }

                                        if (selectedLesson?.id === lesson.id) {
                                          setSelectedLesson(null);
                                          setQuizQuestions([]);
                                          setQuizAnswers({});
                                          setQuizResult(null);
                                          setQuizReview([]);
                                          return;
                                        }

                                        const { data: fullLesson, error } = await supabase
                                          .from("lessons")
                                          .select("id, course_id, unit_id, title, youtube_url, position, pass_percent, is_published, is_required")
                                          .eq("id", lesson.id)
                                          .single();

                                        if (error || !fullLesson) {
                                          alert("تعذر فتح الدرس.");
                                          console.error(error);
                                          return;
                                        }

                                        setSelectedLesson(fullLesson);
                                        loadQuiz(lesson.id);
                                      }}
                                    >
                                      {getBlockingLesson(lesson) ? "🔒 " : "📖 "}
                                      {lesson.position}. {lesson.title}
                                    </button>
                                    {selectedLesson?.id === lesson.id && (
                                      <div className="lesson-player">
                                        <h3>{selectedLesson.title}</h3>

                                        <div className="video-container">
                                          <iframe
                                            src={`https://www.youtube-nocookie.com/embed/${selectedLesson.youtube_url.split("youtu.be/")[1].split("?")[0]}?playsinline=0`}
                                            title={selectedLesson.title}
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                                            allowFullScreen
                                          />
                                        </div>

                                        <p>شاهد الشرح جيداً، ثم انتقل إلى اختبار الدرس.</p>
                                        <div className="lesson-quiz">
                                          <h3>اختبار الدرس</h3>

                                          {quizLoading && <p>جاري تحميل الاختبار...</p>}

                                          {!quizLoading && quizQuestions.length === 0 && (
                                            <p>لا توجد أسئلة متاحة حالياً.</p>
                                          )}

                                          {!quizLoading && quizQuestions.map((question, index) => (
                                            <div className="quiz-question" key={question.id}>
                                              <h4>
                                                السؤال {index + 1}: {question.question_text}
                                              </h4>

                                              {question.question_options.map((option) => (
                                                <div className="quiz-option" key={option.id}>
                                                  <input
                                                    type="radio"
                                                    name={question.id}
                                                    value={option.id}
                                                    checked={quizAnswers[question.id] === option.id}
                                                    onChange={() => {
                                                      console.log("تم اختيار إجابة:", option.id);
                                                      handleAnswerChange(question.id, option.id);
                                                    }}
                                                  />
                                                  <span onClick={() => handleAnswerChange(question.id, option.id)}>
                                                    {option.option_text}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          ))}

                                          {quizQuestions.length > 0 && !quizResult?.score && (
                                            <button
                                              onClick={handleSubmitQuiz}
                                              disabled={quizLoading}
                                            >
                                              إرسال الإجابات
                                            </button>
                                          )}

                                          {quizResult?.error && (
                                            <p>{quizResult.error}</p>
                                          )}

                                          {quizResult && quizResult.score !== undefined && (
                                            <div className="quiz-result">
                                              <h3>نتيجتك: {quizResult.score}%</h3>

                                              <p>
                                                {quizResult.passed
                                                  ? "أحسنت! لقد اجتزت الاختبار."
                                                  : "لم تجتز الاختبار، يمكنك المحاولة مرة أخرى."}
                                              </p>

                                              <p>نسبة النجاح المطلوبة: {quizResult.pass_percent}%</p>

                                              <div className="quiz-review">
                                                <h3>مراجعة إجاباتك</h3>

                                                {quizReview.map((item, index) => (
                                                  <div key={index} className="quiz-question">
                                                    <h4>{index + 1}. {item.question}</h4>
                                                    <p>
                                                      {item.isCorrect ? "✅ إجابتك صحيحة" : "❌ إجابتك غير صحيحة"}
                                                    </p>

                                                    <p>إجابتك: {item.selectedAnswer}</p>
                                                    <p>الإجابة الصحيحة: {item.correctAnswer}</p>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}

                          {(() => {
                            const unitExam = unitExams.find(
                              (exam) => exam.unit_id === selectedUnit?.id
                            );

                            if (!unitExam) {
                              return (
                                <div className="unit-exam">
                                  <h3>📋 الامتحان الشامل للوحدة</h3>
                                  <p>
                                    سيظهر الامتحان بعد اجتياز جميع الدروس المطلوبة في هذه الوحدة.
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <div className="unit-exam">
                                <h3>📋 {unitExam.title}</h3>
                                <p>نسبة النجاح المطلوبة: {unitExam.pass_percent}%</p>

                                <button
                                  onClick={async () => {
                                    const { data, error } = await supabase.storage
                                      .from("unit-exams")
                                      .createSignedUrl(unitExam.file_path, 60);

                                    if (error || !data?.signedUrl) {
                                      setExamStudentMessage("تعذر تحميل ملف الأسئلة.");
                                      return;
                                    }

                                    window.location.href = data.signedUrl;
                                  }}
                                >
                                  تحميل ملف الأسئلة
                                </button>

                                <h4>رفع إجابة الامتحان</h4>
                                <p>ارفع صورة الحل أو ملف PDF، بحجم أقل من 500 KB.</p>

                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    setSelectedAnswerFile(e.target.files[0] || null);
                                    setExamStudentMessage("");
                                  }}
                                />

                                <button
                                  onClick={handleUploadExamAnswer}
                                  disabled={uploadingExam || !selectedAnswerFile}
                                >
                                  {uploadingExam ? "جارٍ رفع الإجابة..." : "إرسال الإجابة"}
                                </button>

                                {examStudentMessage && (
                                  <p>{examStudentMessage}</p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
               <div className="courses-grid">
                  {filteredCourses.map((course, idx) => {
                    const courseLessons = lessons.filter((l) => l.course_id === course.id);
                    const passedCount = courseLessons.filter((l) =>
                      lessonProgress.some((p) => p.lesson_id === l.id && p.is_passed)
                    ).length;
                    const progressPercent =
                      courseLessons.length > 0
                        ? Math.round((passedCount / courseLessons.length) * 100)
                        : 0;
                    const coverClasses = ["purple", "blue", "green"];

                    return (
                      <article className="course-card" key={course.id}>
                       <div className={`course-cover ${coverClasses[idx % coverClasses.length]} course-cover-modern`}>
  <div className="course-cover-top">
    <h3 className="course-cover-title">اللغة الإنكليزية</h3>
    <span className="course-icon">📘</span>
  </div>
  <span className="course-badge">المنهج العراقي</span>
</div>
<div className="course-info">
<h3 className="course-stage-title">
  {course.title
    .replace(/^.*?(?:–|—|-|:|\|)\s*/, "")
    .trim() || course.title}
</h3>
                          <p>{course.description || "منهج اللغة الإنكليزية المعتمد"}</p>
                          <div className="course-meta">
                            <span>📖 {courseLessons.length} دروس</span>
                            <span>{progressPercent}% مكتمل</span>
                          </div>
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <button
                            className="course-button"
                            onClick={() => setSelectedCourse(course)}
                          >
                            عرض الدورة <span>←</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                  {filteredCourses.length === 0 && (
                    <p className="empty-message">لم نعثر على دورة بهذا الاسم.</p>
                  )}
                </div>
              )}
            </section>

            <section className="note-card">
              <span>💡</span>
              <div>
                <strong>خطوة صغيرة كل يوم تصنع فرقاً كبيراً!</strong>
                <p>استمر في التعلم، فكل درس يقربك من هدفك.</p>
              </div>
            </section>
          </>
        )}

        {activeTab === "إنجازاتي" && (
          <section className="account-section">
            <h2>إنجازاتي 🏆</h2>

            <div className="account-card">
              <h3>ملخص إنجازاتي</h3>

              <p>
                <strong>الدروس المجتازة:</strong>{" "}
                {lessonProgress.filter((item) => item.is_passed).length}
              </p>

              <p>
                <strong>أفضل نتيجة:</strong>{" "}
                {lessonProgress.length > 0
                  ? Math.max(...lessonProgress.map((item) => item.best_score || 0))
                  : 0}%
              </p>

              <hr />

              <h3>سجل الدروس المجتازة</h3>

              {lessonProgress.filter((item) => item.is_passed).length === 0 ? (
                <p>لم تجتز أي درس حتى الآن. واصل التعلم!</p>
              ) : (
                lessonProgress
                  .filter((item) => item.is_passed)
                  .map((item) => {
                    const lesson = lessons.find((l) => l.id === item.lesson_id);

                    return (
                      <div key={item.lesson_id}>
                        <p>
                          <strong>{lesson?.title || "درس غير معروف"}</strong>
                        </p>
                        <p>أفضل نتيجة: {item.best_score}%</p>
                        <hr />
                      </div>
                    );
                  })
              )}
            </div>
          </section>
        )}

        {activeTab === "حسابي" && (
          <section className="account-section">
            <h2>حسابي</h2>
            <div className="account-card">
              <p><strong>البريد الإلكتروني:</strong></p>
              <p>{session?.user?.email || "غير متوفر"}</p>

              <p><strong>نوع الحساب:</strong></p>
              <p>{userRole === "admin" ? "مدير" : "طالب"}</p>

              <p><strong>معرّف الحساب:</strong></p>
              <p>{session?.user?.id || "غير متوفر"}</p>

             <button
  type="button"
  className="logout-button"
  aria-label="تسجيل الخروج"
  onClick={async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("حدث خطأ أثناء تسجيل الخروج");
    }
  }}
>
  تسجيل خروج
</button>
            </div>
          </section>
        )}
      </main>

     {activeTab === "التنبيهات" && (
        <section className="notifications-section">
          <div className="section-header">
            <h2>التنبيهات والإعلانات</h2>
            <p>آخر التحديثات والتنبيهات المهمة من الأستاذ.</p>
          </div>

          {isAdminUser && (
            <form onSubmit={handleCreateNotification} className="notif-admin-form">
              <h3>نشر تنبيه جديد للطلاب</h3>
              <input
                type="text"
                placeholder="عنوان التنبيه..."
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                required
              />
              <textarea
                rows="3"
                placeholder="نص التنبيه أو الإعلان..."
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                required
              />
             <select
                value={notifGrade}
                onChange={(e) => setNotifGrade(e.target.value)}
              >
                <option value="all">جميع المراحل</option>
                <option value="first_intermediate">الأول المتوسط</option>
                <option value="second_intermediate">الثاني المتوسط</option>
                <option value="third_intermediate">الثالث المتوسط</option>
                <option value="fourth_preparatory">الرابع الإعدادي</option>
                <option value="fifth_preparatory">الخامس الإعدادي</option>
                <option value="sixth_preparatory">السادس الإعدادي</option>
              </select>
              <button type="submit" className="ask-send-btn" disabled={sendingNotif}>
                {sendingNotif ? "جاري النشر..." : "نشر التنبيه"}
              </button>
            </form>
          )}

          {notificationsLoading ? (
            <p className="empty-questions-note">جاري تحميل التنبيهات...</p>
          ) : notificationsList.length === 0 ? (
            <div className="notification-card empty-notif-card">
              <p>لا توجد تنبيهات جديدة حالياً.</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notificationsList.map((item) => (
                <div key={item.id} className="notification-card unread">
                  <div className="notification-top">
                    <span className="notification-badge">
                      {item.target_grade === "all" ? "عام" : item.target_grade}
                    </span>
                    <small className="notification-date">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("ar-IQ")
                        : "اليوم"}
                    </small>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  {isAdminUser && (
                    <button
                      type="button"
                      className="ask-delete-btn"
                      onClick={() => handleDeleteNotification(item.id)}
                    >
                      حذف التنبيه
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
     {activeTab === "اسأل أستاذك" && currentUser && (
     <section className="ask-teacher-section">
            <div className="ask-teacher-card">
              <div className="ask-teacher-top-bar">
                <div>
                  <span className="ask-teacher-badge">تواصل مباشر</span>
                  <h3>اسأل الأستاذ</h3>
                  <p>
                    {!isAdminUser
                      ? myQuestion?.status === "answered"
                        ? "وصل رد الأستاذ على سؤالك!"
                        : "علقت في قاعدة أو تمرين؟ اسأل أستاذك مباشرة."
                      : "متابعة والرد على أسئلة الطلاب."}
                  </p>
                </div>

              {!isAdminUser && (
                  <div className="ask-btn-wrapper">
                    {myQuestion?.status === "answered" && (
                      <span className="ask-new-reply-pill">رد جديد!</span>
                    )}
                    <button
                      type="button"
                      className={`ask-toggle-btn ${
                        myQuestion?.status === "answered" ? "has-reply" : ""
                      }`}
                      onClick={() => setIsAskOpen((prev) => !prev)}
                    >
                      {myQuestion?.status === "answered"
                        ? "عرض الرد"
                        : isAskOpen
                        ? "إغلاق"
                        : myQuestion
                        ? "سؤالي المرسل"
                        : "اسأل الآن"}
                    </button>
                  </div>
                )}
              </div>

              {!isAdminUser ? (
                (isAskOpen || myQuestion?.status === "answered") && (
                  <div className="ask-student-panel">
                    {!myQuestion ? (
                      <form onSubmit={handleSendQuestion} className="ask-teacher-form">
                        <textarea
                          rows="3"
                          maxLength={400}
                          placeholder="اكتب سؤالك هنا بوضوح (سؤال واحد فقط في كل مرة)..."
                          value={questionInput}
                          onChange={(e) => setQuestionInput(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="ask-send-btn"
                          disabled={questionLoading}
                        >
                          {questionLoading ? "جاري الإرسال..." : "إرسال السؤال"}
                        </button>
                      </form>
                    ) : (
                      <div className="question-thread">
                        <div className="question-bubble">
                          <small>
                            سؤالك (
                            {myQuestion.status === "answered"
                              ? "تم الرد"
                              : "بانتظار رد الأستاذ"}
                            )
                          </small>
                          <p>{myQuestion.question_text}</p>
                        </div>

                        {myQuestion.status === "answered" && myQuestion.answer_text && (
                          <div className="answer-bubble">
                            <small>رد الأستاذ</small>
                            <p>{myQuestion.answer_text}</p>
                            <button
                              type="button"
                              className="ask-delete-btn"
                              onClick={() => {
                                handleDeleteMyQuestion();
                                setIsAskOpen(false);
                              }}
                              disabled={questionLoading}
                            >
                              تمت القراءة وحذف المحادثة
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="admin-questions-list">
                  {teacherQuestions.length === 0 ? (
                    <p className="empty-questions-note">
                      لا توجد أسئلة معلّقة من الطلاب حالياً.
                    </p>
                  ) : (
                    teacherQuestions.map((item) => (
                      <div key={item.id} className="admin-question-item">
                        <div className="admin-question-meta">
                          <strong>{item.student_email || "طالب"}</strong>
                          <span>
                            {item.status === "answered" ? "تم الرد" : "بانتظار الرد"}
                          </span>
                        </div>
                        <p className="admin-q-text">{item.question_text}</p>
                        {item.answer_text && (
                          <p className="admin-a-preview">ردك: {item.answer_text}</p>
                        )}
                        <div className="admin-reply-row">
                          <input
                            type="text"
                            placeholder="اكتب ردك هنا..."
                            value={replyDrafts[item.id] || ""}
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="ask-send-btn"
                            onClick={() => handleSendReply(item.id)}
                          >
                            إرسال الرد
                          </button>
                          <button
                            type="button"
                            className="ask-delete-btn"
                            onClick={() => handleAdminDeleteQuestion(item.id)}
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>
        )}

     {/* --- بداية: شريط التنقل السفلي مع زر اسأل أستاذك للطالب --- */}
      <nav className="bottom-nav">
        {[
          ["الرئيسية", "⌂"],
          ["الدورات", "▤"],
          ["اسأل أستاذك", "💬"],
          ["التنبيهات", "🔔"],
          ["إنجازاتي", "🏆"],
        ].map(([label, icon]) => (
          <button
            key={label}
            className={
              activeTab === label
                ? `nav-item active ${label === "اسأل أستاذك" ? "nav-ask-teacher" : ""}`
                : `nav-item ${label === "اسأل أستاذك" ? "nav-ask-teacher" : ""}`
            }
           onClick={() => {
              setActiveTab(label);
              setSelectedCourse(null);
              if (label === "اسأل أستاذك") {
                setHasUnreadAskTeacher(false);
              } else if (label === "التنبيهات") {
                setHasUnreadAlerts(false);
              }

              if (label === "الرئيسية") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else if (label === "الدورات") {
                document
                  .querySelector(".courses-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <span className="nav-icon-wrap">
              <span>{icon}</span>
              {((label === "اسأل أستاذك" && hasUnreadAskTeacher) ||
                (label === "التنبيهات" && hasUnreadAlerts)) && (
                <span className="nav-red-dot" aria-hidden="true" />
              )}
            </span>
            <small>{label}</small>
          </button>
        ))}
      </nav>
      {/* --- نهاية: شريط التنقل السفلي مع زر اسأل أستاذك للطالب --- */}
    </div>
  );
}

export default App;