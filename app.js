// ---------- تنظیمات ----------
const STRICT_SYNC = false; // اگر true شود، زمان آهنگ با زمان ویدیو قفل می‌شود
const MUTE_VIDEO_AUDIO = false; // اگر ویدیو صدا دارد و نمی‌خواهی شنیده شود، true کن

// ---------- انتخاب عناصر ----------
const video = document.getElementById("video");
const music = document.getElementById("music");
const unlockBtn = document.getElementById("unlock");

// در صورت نیاز: بی‌صدا کردن ویدیو
video.muted = !!MUTE_VIDEO_AUDIO;

/**
 * نکته مهم autoplay:
 * بیشتر مرورگرها اجازه‌ی پخش خودکار صوت را بدون تعامل کاربر نمی‌دهند.
 * ما با این دکمه، یک تعامل کاربر ایجاد می‌کنیم تا هر دو مدیا آزاد شوند.
 * اگر کاربر خودِ دکمه Play ویدیو را بزند، معمولاً همین کافی است و نیازی به این دکمه نیست.
 */
unlockBtn.addEventListener("click", async () => {
  try {
    // با یک Play و Pause کوتاه، مجوز را باز می‌کنیم
    await music.play();
    music.pause();
    // اگر هنوز ویدیو آماده نیست، کاری نمی‌کنیم؛ از این به بعد رویدادهای کاربر مجازند
    unlockBtn.remove(); // دکمه را بردار
  } catch (err) {
    console.warn("Unlock failed:", err);
    unlockBtn.textContent = "دوباره تلاش کن";
  }
});

// ---------- رفتارهای همگام ----------
/**
 * وقتی ویدیو پخش شد، آهنگ هم پخش کن.
 * اگر STRICT_SYNC روشن باشد، تایم آهنگ را با ویدیو هماهنگ کن.
 */
video.addEventListener("play", async () => {
  if (STRICT_SYNC && Math.abs((music.currentTime || 0) - (video.currentTime || 0)) > 0.25) {
    syncTime();
  }
  try {
    await music.play();
  } catch (err) {
    // اگر به خاطر policy نتونست پخش شه، به کاربر بگو کلید unlock رو بزنه
    console.warn("music.play() blocked:", err);
    if (document.body.contains(unlockBtn)) {
      unlockBtn.focus();
    }
  }
});

/** وقتی ویدیو متوقف/مکث شد، آهنگ را متوقف کن. */
video.addEventListener("pause", () => {
  music.pause();
});

/** اگر ویدیو تمام شد، آهنگ را هم متوقف کن و به ابتدا برگردان (سلیقه‌ای). */
video.addEventListener("ended", () => {
  music.pause();
  music.currentTime = 0;
});

/** در هنگام بافر/انتظار هم بهتره آهنگ رو مکث کنیم تا جلوتر نره. */
video.addEventListener("waiting", () => {
  music.pause();
});

/** هنگام Seek زمان‌ها را هماهنگ کن (در حالت STRICT_SYNC). */
video.addEventListener("seeking", () => {
  if (STRICT_SYNC) syncTime();
});

/** هر چند ثانیه یک بار کمی درِفت را اصلاح کن (در حالت STRICT_SYNC). */
let lastAdjust = 0;
video.addEventListener("timeupdate", () => {
  if (!STRICT_SYNC) return;
  const now = performance.now();
  if (now - lastAdjust > 1000) { // هر ~۱ ثانیه
    const drift = (music.currentTime || 0) - (video.currentTime || 0);
    if (Math.abs(drift) > 0.15) {
      syncTime();
    }
    lastAdjust = now;
  }
});

function syncTime() {
  // هم‌زمان‌سازی ساده: زمان آهنگ = زمان ویدیو
  try {
    music.currentTime = video.currentTime || 0;
  } catch (e) {
    console.warn("Cannot sync currentTime:", e);
  }
}
