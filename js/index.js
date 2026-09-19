/**
 * Birthday Wishes - Interactive Engine 9.5
 * Features:
 *  - Dynamic URL Personalization (?name=...&from=...)
 *  - Master-Gain Web Audio Festive Music Synthesizer (Instant Mute/Unmute)
 *  - Dynamic Gift Messages resolving current recipient name
 *  - Orchestrated Storyboard Timeline with Clean Reset/Replay
 *  - 60fps Canvas Particle Confetti & Interactive Fireworks
 *  - Interactive Unwrapping Gifts & Custom Link Generator
 */

(function () {
  "use strict";

  // ==========================================================================
  // 1. STATE & PERSONALIZATION
  // ==========================================================================
  const urlParams = new URLSearchParams(window.location.search);
  const rawName = urlParams.get("name");
  const rawRel = urlParams.get("rel") || urlParams.get("relation");
  const rawFrom = urlParams.get("from");

  const hasUrlRecipient = Boolean(rawName && rawName.trim());

  const state = {
    recipientName: hasUrlRecipient ? decodeURIComponent(rawName.trim()) : "Amrutha Basireddy",
    relation: rawRel ? decodeURIComponent(rawRel.trim()).toLowerCase() : "friend",
    senderName: rawFrom ? decodeURIComponent(rawFrom.trim()) : "",
    currentStage: 1,
    audioEnabled: false,
    audioInitialized: false,
    timeouts: [],
    particles: [],
    animationFrameId: null,
  };

  // DOM Elements
  const recipientNameEl = document.getElementById("recipient-name");
  const personalizedSubtextEl = document.getElementById("personalized-subtext");
  const audioPromptEl = document.getElementById("audio-prompt");

  function applyPersonalization() {
    if (recipientNameEl) {
      recipientNameEl.textContent = state.recipientName;
    }
    document.title = `Happy Birthday ${state.recipientName}! 🎂`;

    if (personalizedSubtextEl) {
      const rel = state.relation || "friend";
      let subtext = `For an amazing ${rel}: ${state.recipientName}!`;
      if (state.senderName) {
        subtext += ` • With love from ${state.senderName}`;
      }
      personalizedSubtextEl.textContent = subtext;
    }
  }

  applyPersonalization();

  // ==========================================================================
  // 2. TIMELINE ORCHESTRATION & STAGES
  // ==========================================================================
  const slide1 = document.getElementById("slide-1");
  const slideContent = slide1 ? slide1.querySelector(".slide--content") : null;
  const slideContentOne = slide1 ? slide1.querySelector(".slide--content--one") : null;

  const slide2 = document.getElementById("slide-2");
  const slide3 = document.getElementById("slide-3");
  const giftsTapHint = document.getElementById("gifts-tap-hint");

  function clearAllTimeouts() {
    state.timeouts.forEach((t) => clearTimeout(t));
    state.timeouts = [];
  }

  function registerTimeout(fn, delay) {
    const id = setTimeout(fn, delay);
    state.timeouts.push(id);
    return id;
  }

  function resetStages() {
    clearAllTimeouts();

    // Reset Stage 1
    if (slide1) {
      slide1.className = "first--slide stage active";
    }
    if (slideContent) {
      slideContent.className = "slide--content";
      slideContent.style.display = "block";
    }
    if (slideContentOne) {
      slideContentOne.className = "slide--content--one";
      slideContentOne.style.display = "none";
    }

    // Reset Stage 2
    if (slide2) {
      slide2.className = "second--canvas stage";
    }

    // Reset Stage 3
    if (slide3) {
      slide3.className = "third--canvas stage";
    }
    if (personalizedSubtextEl) {
      personalizedSubtextEl.classList.remove("show");
    }
    if (giftsTapHint) {
      giftsTapHint.classList.remove("show");
    }

    state.currentStage = 1;
  }

  function startCelebrationTimeline() {
    resetStages();

    // Stage 1 Part A: "Hello [Name]" visible for 2.5s
    registerTimeout(() => {
      if (slideContent) {
        slideContent.classList.add("fade-out");
      }
    }, 2100);

    registerTimeout(() => {
      if (slideContent) slideContent.style.display = "none";
      if (slideContentOne) {
        slideContentOne.style.display = "block";
        slideContentOne.classList.add("visible");
      }
      // Confetti burst on "Today is your special day"
      launchConfettiBurst(window.innerWidth / 2, window.innerHeight / 2, 45);
    }, 2500);

    // Transition out of Stage 1 to Stage 2
    registerTimeout(() => {
      if (slideContentOne) slideContentOne.classList.add("slide-exit");
      if (slide1) slide1.classList.add("curtain-out");
    }, 5700);

    // Enter Stage 2: "Let's Celebrate"
    registerTimeout(() => {
      if (slide1) slide1.classList.remove("active");
      if (slide2) {
        slide2.classList.add("active");
        state.currentStage = 2;
      }
      launchConfettiCannon("left");
      launchConfettiCannon("right");
    }, 6200);

    // Transition out of Stage 2 to Stage 3
    registerTimeout(() => {
      if (slide2) slide2.classList.add("curtain-wipe");
    }, 9100);

    // Enter Stage 3: Grand Birthday Reveal
    registerTimeout(() => {
      if (slide2) slide2.classList.remove("active");
      if (slide3) {
        slide3.classList.add("active");
        state.currentStage = 3;
      }
      // Grand Confetti Blast
      launchConfettiGrandFinale();
    }, 9600);

    // Show personalized note & tap hint
    registerTimeout(() => {
      if (personalizedSubtextEl) personalizedSubtextEl.classList.add("show");
      if (giftsTapHint) giftsTapHint.classList.add("show");
      launchConfettiBurst(window.innerWidth * 0.35, window.innerHeight * 0.7, 30);
      launchConfettiBurst(window.innerWidth * 0.65, window.innerHeight * 0.7, 30);
    }, 13200);
  }

  // ==========================================================================
  // 3. ROBUST WEB AUDIO SYNTHESIZER WITH MASTER GAIN (INSTANT MUTE/UNMUTE)
  // ==========================================================================
  let audioCtx = null;
  let masterGainNode = null;
  let activeOscillators = [];
  let musicLoopTimeout = null;

  const NOTE_FREQS = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
    G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
    G5: 783.99, A5: 880.00,
  };

  const MELODY = [
    { note: "G4", beats: 0.75 },
    { note: "G4", beats: 0.25 },
    { note: "A4", beats: 1.0 },
    { note: "G4", beats: 1.0 },
    { note: "C5", beats: 1.0 },
    { note: "B4", beats: 2.0 },

    { note: "G4", beats: 0.75 },
    { note: "G4", beats: 0.25 },
    { note: "A4", beats: 1.0 },
    { note: "G4", beats: 1.0 },
    { note: "D5", beats: 1.0 },
    { note: "C5", beats: 2.0 },

    { note: "G4", beats: 0.75 },
    { note: "G4", beats: 0.25 },
    { note: "G5", beats: 1.0 },
    { note: "E5", beats: 1.0 },
    { note: "C5", beats: 1.0 },
    { note: "B4", beats: 1.0 },
    { note: "A4", beats: 1.5 },

    { note: "F5", beats: 0.75 },
    { note: "F5", beats: 0.25 },
    { note: "E5", beats: 1.0 },
    { note: "C5", beats: 1.0 },
    { note: "D5", beats: 1.0 },
    { note: "C5", beats: 2.5 },
  ];

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        masterGainNode = audioCtx.createGain();
        masterGainNode.gain.setValueAtTime(state.audioEnabled ? 1 : 0, audioCtx.currentTime);
        masterGainNode.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, startTime, duration, type = "triangle", gainLevel = 0.18) {
    if (!audioCtx || !masterGainNode) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      // Smooth ADSR Envelope
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(gainLevel * 0.65, startTime + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(masterGainNode); // CONNECT TO MASTER GAIN!

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);

      activeOscillators.push(osc);
      osc.onended = () => {
        const idx = activeOscillators.indexOf(osc);
        if (idx !== -1) activeOscillators.splice(idx, 1);
      };
    } catch (e) {
      // Audio safety
    }
  }

  function playChimeEffect(freq1 = 523.25, freq2 = 659.25, freq3 = 783.99) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(freq1, now, 0.4, "sine", 0.25);
    playTone(freq2, now + 0.08, 0.4, "sine", 0.25);
    playTone(freq3, now + 0.16, 0.6, "triangle", 0.28);
  }

  function scheduleMelodyLoop() {
    if (!state.audioEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const tempoBpm = 115;
    const beatDuration = 60 / tempoBpm;
    let currentToneTime = ctx.currentTime + 0.1;

    MELODY.forEach((item) => {
      const noteDuration = item.beats * beatDuration;
      const freq = NOTE_FREQS[item.note];
      if (freq) {
        playTone(freq, currentToneTime, noteDuration * 0.88, "triangle", 0.18);
        // Harmony overtone for warmth
        playTone(freq * 0.5, currentToneTime, noteDuration * 0.85, "sine", 0.12);
      }
      currentToneTime += noteDuration;
    });

    const totalDurationMs = (currentToneTime - ctx.currentTime) * 1000;
    musicLoopTimeout = setTimeout(() => {
      if (state.audioEnabled) {
        scheduleMelodyLoop();
      }
    }, totalDurationMs + 800);
  }

  function startMusic() {
    const ctx = getAudioContext();
    if (!ctx) return;

    state.audioEnabled = true;
    document.body.classList.remove("audio-muted");

    if (masterGainNode) {
      masterGainNode.gain.cancelScheduledValues(ctx.currentTime);
      masterGainNode.gain.setValueAtTime(1, ctx.currentTime);
    }

    const soundIcon = document.getElementById("sound-icon");
    const soundBtn = document.getElementById("sound-btn");
    const soundText = soundBtn ? soundBtn.querySelector(".btn-text") : null;
    if (soundIcon) soundIcon.textContent = "🔊";
    if (soundText) soundText.textContent = "Music";

    if (musicLoopTimeout) clearTimeout(musicLoopTimeout);
    scheduleMelodyLoop();

    if (audioPromptEl) {
      audioPromptEl.classList.add("dismissed");
    }
  }

  function stopMusic() {
    state.audioEnabled = false;
    document.body.classList.add("audio-muted");

    // Immediately silence the master gain node
    if (audioCtx && masterGainNode) {
      masterGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    }

    // Stop all actively playing and scheduled oscillators
    activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    activeOscillators = [];

    if (musicLoopTimeout) {
      clearTimeout(musicLoopTimeout);
      musicLoopTimeout = null;
    }

    const soundIcon = document.getElementById("sound-icon");
    const soundBtn = document.getElementById("sound-btn");
    const soundText = soundBtn ? soundBtn.querySelector(".btn-text") : null;
    if (soundIcon) soundIcon.textContent = "🔇";
    if (soundText) soundText.textContent = "Muted";
  }

  function toggleMusic() {
    if (state.audioEnabled) {
      stopMusic();
    } else {
      startMusic();
    }
  }

  // Handle first interaction anywhere on page (except clicking sound button directly)
  function handleUserFirstInteraction(e) {
    if (e && e.target && e.target.closest && e.target.closest("#sound-btn")) {
      return;
    }
    if (!state.audioInitialized) {
      state.audioInitialized = true;
      getAudioContext();
      startMusic();
    }
  }

  window.addEventListener("click", handleUserFirstInteraction);
  window.addEventListener("touchstart", handleUserFirstInteraction);

  const soundBtn = document.getElementById("sound-btn");
  if (soundBtn) {
    soundBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      state.audioInitialized = true;
      getAudioContext();
      toggleMusic();
    });
  }

  // ==========================================================================
  // 4. CANVAS CONFETTI & FIREWORKS ENGINE
  // ==========================================================================
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  const CONFETTI_COLORS = [
    "#FF4757", "#2ED573", "#1E90FF", "#FFA502", "#9B59B6",
    "#FCBB5E", "#FF6B81", "#70A1FF", "#7BED9F", "#ECCC68"
  ];

  class Particle {
    constructor(x, y, vx, vy, color, size, type = "confetti") {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.size = size;
      this.type = type;
      this.rotation = Math.random() * 360;
      this.vRotation = (Math.random() - 0.5) * 12;
      this.opacity = 1;
      this.gravity = type === "firework" ? 0.08 : 0.22;
      this.drag = type === "firework" ? 0.96 : 0.98;
      this.decay = (Math.random() * 0.008) + 0.005;
    }

    update() {
      this.vx *= this.drag;
      this.vy *= this.drag;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.vRotation;
      this.opacity -= this.decay;
    }

    draw(context) {
      if (this.opacity <= 0) return;
      context.save();
      context.translate(this.x, this.y);
      context.rotate((this.rotation * Math.PI) / 180);
      context.globalAlpha = Math.max(0, this.opacity);
      context.fillStyle = this.color;

      if (this.type === "circle" || this.type === "firework") {
        context.beginPath();
        context.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
      }
      context.restore();
    }
  }

  function launchConfettiBurst(originX, originY, count = 40) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 12 + 3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 3;
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const size = Math.random() * 8 + 6;
      const type = Math.random() > 0.4 ? "confetti" : "circle";
      state.particles.push(new Particle(originX, originY, vx, vy, color, size, type));
    }
  }

  function launchConfettiCannon(side = "left") {
    const originX = side === "left" ? 40 : window.innerWidth - 40;
    const originY = window.innerHeight * 0.75;
    const baseAngle = side === "left" ? -Math.PI / 4 : (-Math.PI * 3) / 4;

    for (let i = 0; i < 65; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * 0.8;
      const speed = Math.random() * 20 + 8;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const size = Math.random() * 9 + 6;
      state.particles.push(new Particle(originX, originY, vx, vy, color, size, "confetti"));
    }
  }

  function launchConfettiGrandFinale() {
    launchConfettiCannon("left");
    launchConfettiCannon("right");
    setTimeout(() => {
      launchConfettiBurst(window.innerWidth * 0.5, window.innerHeight * 0.35, 70);
    }, 450);
  }

  function renderParticles() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.update();
      p.draw(ctx);
      if (p.opacity <= 0 || p.y > window.innerHeight + 50) {
        state.particles.splice(i, 1);
      }
    }

    state.animationFrameId = requestAnimationFrame(renderParticles);
  }

  renderParticles();

  // Interactive Clicks create sparkles & fireworks anywhere!
  window.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".modal-card") || e.target.closest(".top-controls")) return;
    launchConfettiBurst(e.clientX, e.clientY, 25);
  });

  // ==========================================================================
  // 5. DYNAMIC INTERACTIVE GIFT BOXES WITH CURRENT RECIPIENT NAME
  // ==========================================================================
  function getGiftWish(giftIndex) {
    const name = state.recipientName || "Friend";
    const rel = state.relation || "friend";
    const wishes = {
      1: {
        title: "🎁 Gift #1 Unwrapped!",
        body: `Happy Birthday to an amazing ${rel}, ${name}! 🌟 May every candle on your cake turn into a wish fulfilled, a wild adventure conquered, and endless moments of pure happiness!`,
      },
      2: {
        title: "🎂 Gift #2 Unwrapped!",
        body: `Sending you 365 days of radiant health, unstoppable laughter, big triumphs, and beautiful memories, ${name}! 💖✨`,
      },
      3: {
        title: "🚀 Gift #3 Unwrapped!",
        body: `A special coder's wish for you, ${name}: May your year ahead be zero-bug, full of breakthrough moments, extraordinary love, and limitless prosperity! 🎉🎈`,
      },
    };
    return wishes[giftIndex] || wishes[1];
  }

  const giftModal = document.getElementById("gift-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const modalAckBtn = document.getElementById("modal-ack-btn");

  function openGiftModal(giftIndex) {
    const data = getGiftWish(giftIndex); // Dynamically evaluates current name!
    if (modalTitle) modalTitle.textContent = data.title;
    if (modalBody) modalBody.textContent = data.body;

    if (giftModal) {
      giftModal.removeAttribute("hidden");
      setTimeout(() => giftModal.classList.add("open"), 10);
    }

    playChimeEffect(587.33, 739.99, 880.00);
    launchConfettiBurst(window.innerWidth / 2, window.innerHeight / 2, 60);
  }

  function closeGiftModal() {
    if (giftModal) {
      giftModal.classList.remove("open");
      setTimeout(() => giftModal.setAttribute("hidden", ""), 300);
    }
  }

  document.querySelectorAll(".gift-wrapper").forEach((giftWrap) => {
    giftWrap.addEventListener("click", (e) => {
      e.stopPropagation();
      const giftIndex = giftWrap.getAttribute("data-gift-index") || "1";
      openGiftModal(giftIndex);
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeGiftModal);
  if (modalAckBtn) modalAckBtn.addEventListener("click", closeGiftModal);
  if (giftModal) {
    giftModal.querySelector(".modal-backdrop")?.addEventListener("click", closeGiftModal);
  }

  // ==========================================================================
  // 6. CUSTOMIZE & SHARE MODAL / CREATOR FLOW
  // ==========================================================================
  const shareModal = document.getElementById("share-modal");
  const shareBtn = document.getElementById("share-btn");
  const shareCloseBtn = document.getElementById("share-close-btn");
  const inputFriendName = document.getElementById("input-friend-name");
  const inputRelation = document.getElementById("input-relation");
  const inputSenderName = document.getElementById("input-sender-name");
  const relationChips = document.querySelectorAll("#relation-chips .chip");
  const generatedUrlInput = document.getElementById("generated-url");
  const copyLinkBtn = document.getElementById("copy-link-btn");
  const whatsappShareBtn = document.getElementById("whatsapp-share-btn");
  const copyStatus = document.getElementById("copy-status");
  const previewBtn = document.getElementById("preview-btn");
  const skipDemoBtn = document.getElementById("skip-demo-btn");

  let celebrationStarted = false;

  function getCustomizedUrl() {
    const friendName = (inputFriendName && inputFriendName.value.trim());
    const rel = (inputRelation && inputRelation.value.trim().toLowerCase()) || "friend";
    const sender = (inputSenderName && inputSenderName.value.trim());

    let base = window.location.origin + window.location.pathname;
    if (window.location.protocol === "file:" || !window.location.origin || window.location.origin === "null") {
      base = window.location.href.split("?")[0];
    }

    const params = new URLSearchParams();
    if (friendName) params.set("name", friendName);
    if (rel && rel !== "friend") params.set("rel", rel);
    if (sender) params.set("from", sender);

    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  function updateGeneratedUrl() {
    if (generatedUrlInput) {
      generatedUrlInput.value = getCustomizedUrl();
    }
    if (copyStatus) copyStatus.textContent = "";
  }

  // Bind relationship chips
  if (relationChips && relationChips.length > 0) {
    relationChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        relationChips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        if (inputRelation) {
          inputRelation.value = chip.getAttribute("data-rel") || "friend";
        }
        updateGeneratedUrl();
      });
    });
  }

  if (inputRelation) {
    inputRelation.addEventListener("input", () => {
      const typed = inputRelation.value.trim().toLowerCase();
      relationChips.forEach((c) => {
        if (c.getAttribute("data-rel") === typed) {
          c.classList.add("active");
        } else {
          c.classList.remove("active");
        }
      });
      updateGeneratedUrl();
    });
  }

  function openShareModal() {
    if (inputFriendName) {
      inputFriendName.value = hasUrlRecipient ? state.recipientName : (state.recipientName === "Amrutha Basireddy" ? "" : state.recipientName);
    }
    if (inputRelation) {
      inputRelation.value = state.relation === "friend" ? "friend" : state.relation;
      relationChips.forEach((c) => {
        if (c.getAttribute("data-rel") === (state.relation || "friend")) {
          c.classList.add("active");
        } else {
          c.classList.remove("active");
        }
      });
    }
    if (inputSenderName) inputSenderName.value = state.senderName;
    updateGeneratedUrl();

    if (shareModal) {
      shareModal.removeAttribute("hidden");
      setTimeout(() => {
        shareModal.classList.add("open");
        if (inputFriendName && !inputFriendName.value) {
          inputFriendName.focus();
        }
      }, 30);
    }
  }

  function closeShareModal() {
    if (shareModal) {
      shareModal.classList.remove("open");
      setTimeout(() => shareModal.setAttribute("hidden", ""), 300);
    }
    if (!celebrationStarted) {
      celebrationStarted = true;
      startCelebrationTimeline();
    }
  }

  if (shareBtn) shareBtn.addEventListener("click", openShareModal);
  if (shareCloseBtn) shareCloseBtn.addEventListener("click", closeShareModal);
  if (shareModal) {
    shareModal.querySelector(".modal-backdrop")?.addEventListener("click", closeShareModal);
  }

  if (inputFriendName) inputFriendName.addEventListener("input", updateGeneratedUrl);
  if (inputSenderName) inputSenderName.addEventListener("input", updateGeneratedUrl);

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", () => {
      const url = getCustomizedUrl();
      const name = (inputFriendName && inputFriendName.value.trim()) || "your friend";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          if (copyStatus) copyStatus.textContent = `Link copied to clipboard! Share it with ${name} 🎉`;
          playChimeEffect();
        }).catch(() => {
          manualCopy(name);
        });
      } else {
        manualCopy(name);
      }
    });
  }

  function manualCopy(name) {
    if (generatedUrlInput) {
      generatedUrlInput.select();
      document.execCommand("copy");
      if (copyStatus) copyStatus.textContent = `Link copied to clipboard! Share it with ${name || "friend"} 🎉`;
      playChimeEffect();
    }
  }

  if (whatsappShareBtn) {
    whatsappShareBtn.addEventListener("click", () => {
      const url = getCustomizedUrl();
      const friend = (inputFriendName && inputFriendName.value.trim()) || "you";
      const shareText = encodeURIComponent(`🎉 Hey ${friend}! I made a special birthday celebration surprise just for you! 🎂✨ Click to open:\n${url}`);
      window.open(`https://api.whatsapp.com/send?text=${shareText}`, "_blank");
    });
  }

  function launchWithCurrentDetails() {
    const enteredName = inputFriendName && inputFriendName.value.trim();
    const friendName = enteredName || (hasUrlRecipient ? state.recipientName : "Amrutha Basireddy");
    const relInput = inputRelation && inputRelation.value.trim().toLowerCase();
    const rel = relInput || "friend";
    const sender = (inputSenderName && inputSenderName.value.trim()) || state.senderName;

    state.recipientName = friendName;
    state.relation = rel;
    state.senderName = sender;
    applyPersonalization();

    // Update the browser URL without full reload so the creator can see the shareable URL in address bar
    try {
      window.history.pushState(null, "", getCustomizedUrl());
    } catch (e) {}

    celebrationStarted = true;
    closeShareModal();
    startCelebrationTimeline();
    playChimeEffect(523.25, 659.25, 1046.50);
  }

  if (previewBtn) {
    previewBtn.addEventListener("click", launchWithCurrentDetails);
  }

  if (skipDemoBtn) {
    skipDemoBtn.addEventListener("click", () => {
      celebrationStarted = true;
      closeShareModal();
      startCelebrationTimeline();
    });
  }

  // ==========================================================================
  // 7. REPLAY BUTTON & SHORTCUTS
  // ==========================================================================
  const replayBtn = document.getElementById("replay-btn");
  if (replayBtn) {
    replayBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      startCelebrationTimeline();
      playChimeEffect(523.25, 659.25, 1046.50);
    });
  }

  // Press Space or 'R' to replay
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === " " || e.key === "r" || e.key === "R") {
      startCelebrationTimeline();
    }
  });

  // ==========================================================================
  // 8. INITIAL STARTUP ROUTING
  // ==========================================================================
  if (hasUrlRecipient) {
    // Recipient opened a personalized link: launch celebration show immediately!
    celebrationStarted = true;
    startCelebrationTimeline();
  } else {
    // Creator opened the site: show the details card to generate custom link & preview!
    openShareModal();
  }
})();
