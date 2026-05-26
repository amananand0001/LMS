/**
 * HTML course content template.
 * Placeholders replaced at runtime with actual course data from native side.
 * Native → WebView communication is done via injectedJavaScript (window.COURSE_DATA).
 */
export const COURSE_HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <title>{{COURSE_TITLE}}</title>
  <style>
    :root {
      --blue: #2563EB;
      --blue-light: #EFF6FF;
      --green: #10B981;
      --amber: #F59E0B;
      --red: #EF4444;
      --text: #1E293B;
      --muted: #64748B;
      --border: #E2E8F0;
      --bg: #F8FAFF;
      --white: #ffffff;
      --radius: 12px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Hero ───────────────────────────── */
    .hero {
      background: linear-gradient(135deg, var(--blue) 0%, #1D4ED8 100%);
      padding: 28px 20px 32px;
      color: white;
    }
    .hero-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 100px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .hero h1 {
      font-size: 22px;
      font-weight: 800;
      line-height: 1.3;
      margin-bottom: 10px;
      letter-spacing: -0.3px;
    }
    .hero-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 13px;
      opacity: 0.9;
      flex-wrap: wrap;
      margin-top: 14px;
    }
    .hero-meta span {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    /* ── Instructor strip ───────────────── */
    .instructor-strip {
      background: var(--white);
      border-bottom: 1px solid var(--border);
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .instructor-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--border);
    }
    .instructor-info small { font-size: 11px; color: var(--muted); font-weight: 500; }
    .instructor-info strong { font-size: 14px; color: var(--text); display: block; }
    .instructor-badge {
      margin-left: auto;
      background: var(--blue-light);
      color: var(--blue);
      border-radius: 100px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 700;
    }

    /* ── Progress bar ───────────────────── */
    .progress-section {
      background: var(--white);
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }
    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .progress-header span { font-size: 13px; color: var(--muted); font-weight: 500; }
    .progress-header strong { font-size: 13px; color: var(--blue); font-weight: 700; }
    .progress-bar {
      background: var(--border);
      border-radius: 100px;
      height: 6px;
      overflow: hidden;
    }
    .progress-fill {
      background: linear-gradient(90deg, var(--blue), #06B6D4);
      height: 100%;
      border-radius: 100px;
      width: {{PROGRESS}}%;
      transition: width 0.6s ease;
    }

    /* ── Content area ───────────────────── */
    .content { padding: 0 0 80px; }

    .section {
      background: var(--white);
      margin: 12px 16px;
      border-radius: var(--radius);
      overflow: hidden;
      border: 1px solid var(--border);
    }

    .section-header {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 10px;
      background: #FAFCFF;
    }
    .section-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--blue-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    .section-title { font-size: 15px; font-weight: 700; color: var(--text); }
    .section-body { padding: 16px; }

    p { font-size: 14px; line-height: 1.7; color: var(--muted); }

    /* ── Lesson list ────────────────────── */
    .lesson-list { list-style: none; }
    .lesson-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
    }
    .lesson-item:last-child { border-bottom: none; }
    .lesson-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--blue-light);
      color: var(--blue);
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .lesson-num.done { background: var(--green); color: white; }
    .lesson-info { flex: 1; }
    .lesson-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
    .lesson-dur { font-size: 11px; color: var(--muted); }
    .lesson-lock { font-size: 14px; color: var(--muted); }

    /* ── Key concepts ───────────────────── */
    .concept-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .concept-card {
      background: var(--blue-light);
      border-radius: 8px;
      padding: 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--blue);
      text-align: center;
    }

    /* ── Quiz card ──────────────────────── */
    .quiz-card {
      background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%);
      margin: 12px 16px;
      border-radius: var(--radius);
      padding: 20px;
      color: white;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .quiz-icon { font-size: 36px; }
    .quiz-title { font-size: 16px; font-weight: 800; margin-bottom: 4px; }
    .quiz-sub { font-size: 12px; opacity: 0.85; }
    .quiz-btn {
      margin-left: auto;
      background: white;
      color: #4F46E5;
      border: none;
      border-radius: 100px;
      padding: 8px 18px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* ── CTA bar ────────────────────────── */
    .cta-bar {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: white;
      border-top: 1px solid var(--border);
      padding: 12px 20px;
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .cta-btn {
      flex: 1;
      background: linear-gradient(135deg, var(--blue), #1D4ED8);
      color: white;
      border: none;
      border-radius: 100px;
      padding: 13px 20px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .cta-btn.secondary {
      background: var(--blue-light);
      color: var(--blue);
    }
  </style>
</head>
<body>

  <!-- Hero -->
  <div class="hero">
    <div class="hero-badge">{{CATEGORY}}</div>
    <h1>{{COURSE_TITLE}}</h1>
    <p style="font-size:13px;opacity:0.85;line-height:1.5;">{{SHORT_DESCRIPTION}}</p>
    <div class="hero-meta">
      <span>⭐ <strong>{{RATING}}</strong></span>
      <span>⏱ {{DURATION}}h total</span>
      <span>📊 {{LEVEL}}</span>
    </div>
  </div>

  <!-- Instructor -->
  <div class="instructor-strip">
    <img class="instructor-avatar" src="{{INSTRUCTOR_AVATAR}}" alt="{{INSTRUCTOR_NAME}}" />
    <div class="instructor-info">
      <small>Your Instructor</small>
      <strong>{{INSTRUCTOR_NAME}}</strong>
    </div>
    <span class="instructor-badge">Expert</span>
  </div>

  <!-- Progress -->
  <div class="progress-section">
    <div class="progress-header">
      <span>Your progress</span>
      <strong>{{PROGRESS}}% complete</strong>
    </div>
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
  </div>

  <!-- Content -->
  <div class="content">

    <!-- About -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📖</div>
        <span class="section-title">About this Course</span>
      </div>
      <div class="section-body">
        <p>{{DESCRIPTION}}</p>
      </div>
    </div>

    <!-- Lessons -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🎬</div>
        <span class="section-title">Course Curriculum</span>
      </div>
      <div class="section-body" style="padding:0 16px;">
        <ul class="lesson-list">
          <li class="lesson-item">
            <div class="lesson-num done">✓</div>
            <div class="lesson-info">
              <div class="lesson-title">Introduction & Setup</div>
              <div class="lesson-dur">15 min · Video</div>
            </div>
          </li>
          <li class="lesson-item">
            <div class="lesson-num done">✓</div>
            <div class="lesson-info">
              <div class="lesson-title">Core Fundamentals</div>
              <div class="lesson-dur">32 min · Video</div>
            </div>
          </li>
          <li class="lesson-item">
            <div class="lesson-num">3</div>
            <div class="lesson-info">
              <div class="lesson-title">Practical Exercises</div>
              <div class="lesson-dur">28 min · Hands-on</div>
            </div>
            <span class="lesson-lock">▶</span>
          </li>
          <li class="lesson-item">
            <div class="lesson-num">4</div>
            <div class="lesson-info">
              <div class="lesson-title">Real-world Project</div>
              <div class="lesson-dur">45 min · Project</div>
            </div>
            <span class="lesson-lock">🔒</span>
          </li>
          <li class="lesson-item">
            <div class="lesson-num">5</div>
            <div class="lesson-info">
              <div class="lesson-title">Final Assessment</div>
              <div class="lesson-dur">20 min · Quiz</div>
            </div>
            <span class="lesson-lock">🔒</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Key Concepts -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">💡</div>
        <span class="section-title">Key Concepts</span>
      </div>
      <div class="section-body">
        <div class="concept-grid">
          <div class="concept-card">Fundamentals</div>
          <div class="concept-card">Best Practices</div>
          <div class="concept-card">Optimization</div>
          <div class="concept-card">Real Projects</div>
        </div>
      </div>
    </div>

    <!-- Quiz Banner -->
    <div class="quiz-card">
      <div class="quiz-icon">🧠</div>
      <div>
        <div class="quiz-title">Chapter Quiz</div>
        <div class="quiz-sub">Test your knowledge · 10 questions</div>
      </div>
      <button class="quiz-btn" onclick="window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'QUIZ_START',courseId:'{{COURSE_ID}}'}))">
        Start Quiz
      </button>
    </div>

  </div>

  <!-- Fixed CTA -->
  <div class="cta-bar">
    <button class="cta-btn secondary" onclick="window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'BOOKMARK',courseId:'{{COURSE_ID}}'}))">
      Save
    </button>
    <button class="cta-btn" onclick="window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'ENROLL',courseId:'{{COURSE_ID}}'}))">
      Continue Learning
    </button>
  </div>

</body>
</html>
`;

/** Replace all template placeholders with actual course data */
export function buildCourseHtml(params: {
  courseId: number;
  title: string;
  description: string;
  category: string;
  rating: number;
  durationHours: number;
  level: string;
  instructorName: string;
  instructorAvatar: string;
  progress?: number;
}): string {
  const shortDescription = params.description.slice(0, 120) + (params.description.length > 120 ? '…' : '');
  const progress = params.progress ?? 0;

  return COURSE_HTML_TEMPLATE
    .replaceAll('{{COURSE_ID}}', String(params.courseId))
    .replaceAll('{{COURSE_TITLE}}', params.title)
    .replaceAll('{{DESCRIPTION}}', params.description)
    .replaceAll('{{SHORT_DESCRIPTION}}', shortDescription)
    .replaceAll('{{CATEGORY}}', params.category)
    .replaceAll('{{RATING}}', params.rating.toFixed(1))
    .replaceAll('{{DURATION}}', String(params.durationHours))
    .replaceAll('{{LEVEL}}', params.level)
    .replaceAll('{{INSTRUCTOR_NAME}}', params.instructorName)
    .replaceAll('{{INSTRUCTOR_AVATAR}}', params.instructorAvatar)
    .replaceAll('{{PROGRESS}}', String(progress));
}
