import { useState, useEffect } from "react";
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
  const [adminSection, setAdminSection] = useState("dashboard");
  const [newCourseTitle, setNewCourseTitle] = useState("");
const [newCourseGrade, setNewCourseGrade] = useState("first_intermediate");
const [newCourseDescription, setNewCourseDescription] = useState("");
const [newCoursePublished, setNewCoursePublished] = useState(false);
const [savingCourse, setSavingCourse] = useState(false);
const [courseFormMessage, setCourseFormMessage] = useState("");
const [newLessonTitle, setNewLessonTitle] = useState("");
const [newLessonVideo, setNewLessonVideo] = useState("");
const [newLessonPosition, setNewLessonPosition] = useState(2);
const [newLessonPassPercent, setNewLessonPassPercent] = useState(70);
const [savingLesson, setSavingLesson] = useState(false);
const [lessonFormMessage, setLessonFormMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
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
  .select("id, course_id, title, youtube_url, position, pass_percent, is_published")
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

  
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [lessonProgress, setLessonProgress] = useState([]);
const [loadingCourses, setLoadingCourses] = useState(true);
const [session, setSession] = useState(null);
const [userRole, setUserRole] = useState(null);
useEffect(() => {
  const fetchUserRole = async () => {
    if (!session?.user) {useEffect(() => {
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
}, []); useEffect(() => {
  const fetchLessons = async () => {
    const { data, error } = await supabase
      .from("lessons")
      .select("id, course_id, title, youtube_url, position, pass_percent, is_published")
      .order("position", { ascending: true });

    if (error) {
      console.error("Error loading lessons:", error.message);
      return;
    }

    setLessons(data || []);
    console.log("Lessons loaded:", data);
    
  };

  fetchLessons();
}, [session]);
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
const handleAddLesson = async (e) => {
  e.preventDefault();
  setLessonFormMessage("");

  if (userRole !== "admin") {
    setLessonFormMessage("ليس لديك صلاحية لإضافة الدروس.");
    return;
  }
 
const handleAnswerChange = (questionId, optionId) => {
  setQuizAnswers((previous) => ({
    ...previous,
    [questionId]: optionId,
  }));
};

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
        title: newLessonTitle.trim(),
        youtube_url: newLessonVideo.trim(),
        position: Number(newLessonPosition),
        pass_percent: Number(newLessonPassPercent),
        is_published: false,
      });

    if (error) {
      setLessonFormMessage("تعذر حفظ الدرس: " + error.message);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("lessons")
      .select("id, course_id, title, youtube_url, position, pass_percent, is_published")
      .order("position", { ascending: true });

    if (fetchError) {
      setLessonFormMessage("تمت الإضافة، لكن تعذر تحديث القائمة.");
      return;
    }

    setLessons(data || []);
    setNewLessonTitle("");
    setNewLessonVideo("");
    setNewLessonPosition(Number(newLessonPosition) + 1);
    setNewLessonPassPercent(70);

    setLessonFormMessage("تمت إضافة الدرس بنجاح.");
  } catch (error) {
    setLessonFormMessage("حدث خطأ: " + error.message);
  } finally {
    setSavingLesson(false);
  }
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
        <h1>MyEducation</h1>
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

          {authError && <p>{authError}</p>}

         <button type="submit">دخول</button>

<button
  type="button"
  onClick={handleSignUp}
  className="signup-button"
>
  إنشاء حساب جديد
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
          <div className="brand-logo">M</div>
          <div>
            <h1>MyEducation</h1>
            <span>منصة التعلم الذكي</span>
          </div>
        </div>
        <button className="profile-button" aria-label="الملف الشخصي">
          👤
        </button>
      </header>
           {userRole === "admin" && (
        <>
          <div className="admin-banner">
            <span>🛠️ لوحة تحكم المدير</span>
            <span>إدارة منصة MyEducation</span>
          </div>

          <nav className="admin-nav">
            <button onClick={() => setAdminSection("dashboard")}>
              الرئيسية
            </button>
            <button onClick={() => setAdminSection("courses")}>
              إدارة الدورات
            </button>
            <button onClick={() => setAdminSection("lessons")}>
              إدارة الدروس
            </button>
            <button onClick={() => setAdminSection("questions")}>
              الاختبارات
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

   {adminSection === "lessons" && (
  <>
    <h2>إدارة الدروس</h2>
    <form className="admin-course-form" onSubmit={handleAddLesson}>
  <h3>إضافة درس جديد</h3>

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
      <h2>إدارة الاختبارات — قيد التجهيز</h2>
    )}
  </section>
)}
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
              <strong>3</strong>
              <span>دورات متاحة</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon green-icon">🏆</span>
            <div>
              <strong>1</strong>
              <span>دروس قيد التعلم</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon orange-icon">⭐</span>
            <div>
              <strong>35%</strong>
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
                onClick={() => setSelectedCourse(null)}
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
                <div>
                  <small>{selectedCourse.category}</small>
                  <h3>{selectedCourse.title}</h3>
                </div>
              </div>
              <p>{selectedCourse.description}</p>
              <div className="detail-row">
                <span>عدد الدروس</span>
                <strong>{selectedCourse.lessons} دروس</strong>
              </div>
              <div className="detail-row">
                <span>تقدمك في الدورة</span>
                <strong>{selectedCourse.progress}%</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${selectedCourse.progress}%` }}
                />
              </div>
             <div className="course-lessons">
  <h3>دروس الدورة</h3>

  {lessons.filter(
    (lesson) => lesson.course_id === selectedCourse.id
  ).length === 0 ? (
    <p>لا توجد دروس متاحة حالياً.</p>
  ) : (
    lessons
      .filter((lesson) => lesson.course_id === selectedCourse.id)
      .map((lesson) => (
        <button
          key={lesson.id}
          className="course-button"
         onClick={() => {
  setSelectedLesson(lesson);
  loadQuiz(lesson.id);
}}
        >
          {lesson.position}. {lesson.title}
        </button>
      ))
  )}
</div>
{selectedLesson && (
  <div className="lesson-player">
    <h3>{selectedLesson.title}</h3>

    <div className="video-container">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${selectedLesson.youtube_url.split("youtu.be/")[1].split("?")[0]}`}
        title={selectedLesson.title}
        width="100%"
        height="350"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
          ) : (
            <div className="courses-grid">
              {filteredCourses.map((course) => (
                <article className="course-card" key={course.id}>
                  <div className={`course-cover ${course.color}`}>
                    <span className="course-icon">{course.icon}</span>
                    <span className="course-category">{course.category}</span>
                  </div>
                  <div className="course-info">
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>
                    <div className="course-meta">
                      <span>📖 {course.lessons} دروس</span>
                      <span>{course.progress}% مكتمل</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${course.progress}%` }}
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
              ))}
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
      </main>

      <nav className="bottom-nav">
        {[
          ["الرئيسية", "⌂"],
          ["الدورات", "▤"],
          ["إنجازاتي", "🏆"],
          ["حسابي", "👤"],
        ].map(([label, icon]) => (
          <button
            key={label}
            className={activeTab === label ? "nav-item active" : "nav-item"}
            onClick={() => {
              setActiveTab(label);
              setSelectedCourse(null);
              if (label === "الدورات") {
                document
                  .querySelector(".courses-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            <span>{icon}</span>
            <small>{label}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
