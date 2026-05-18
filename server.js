require("dotenv").config();

const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();

app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());

const isProd = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT || 3000);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(
  session({
    name: "mk5sid",
    secret: process.env.SESSION_SECRET || "CHANGE_ME_SECRET",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use(express.static(path.join(__dirname, "public")));

// ================= CONFIG =================

const GUILD_ID = process.env.GUILD_ID || "1489022506139517170";
const ACTIVATED_ROLE = process.env.ACTIVATED_ROLE || "1489044217446666331";

const WEBHOOK_URL = process.env.WEBHOOK_URL || "";
const DISCORD_INVITE_URL = process.env.DISCORD_INVITE_URL || "https://discord.gg/mk5";

const SUCCESS_ADD_ROLE = process.env.SUCCESS_ADD_ROLE || "";
const SUCCESS_REMOVE_ROLE = process.env.SUCCESS_REMOVE_ROLE || "";

const COOLDOWN_FILE = path.join(__dirname, "cooldowns.json");
const FAIL_COOLDOWN_MS = 5 * 60 * 1000;

const SECTORS = [
  {
    key: "patrol",
    name: "قـطـاع الادارة الـعـامـة لـدوريـات الامـن",
    roleId: "1363249807522529370",
    image: "/img/sector-patrol.png"
  },
  {
    key: "traffic",
    name: "قـطـاع الادارة الـعـامـة لـلـمـرور",
    roleId: "1363249828599169186",
    image: "/img/sector-traffic.png"
  },
  {
    key: "roads",
    name: "قـطـاع الادارة الـعـامـة لأمـن الـطـرق",
    roleId: "1363249837830832198",
    image: "/img/sector-roads.png"
  },
  {
    key: "governorates",
    name: "الـمـديـريـة الـعـامـة لـشـرطة الـمـحـافـظـات",
    roleId: "1363249856335839552",
    image: "/img/sector-governorates.png"
  }
];

const QUIZ = [
  {
    q: "هـل يـحـق لـقـطـاع الادارة الـعـامـة لـلـمـرور والـدوريات الـخـروج خـارج الـريـاض :",
    options: [
      "يـمـكـنـنـي فـي كـلا الاحـوال الـتـوجـه فـي اي وقـت واي مـطـاردة هـنـاك",
      "فـي حـال كـانـت مـنـطـقـة الـلـعـب هـنـاك",
      "لايـمـكـنـنـي الـتـوجـه هـناك قـطـعا فـي كـلا الاحـوال"
    ],
    correct: 1
  },
  {
    q: "الاصـطـفـاف الـعـسـكـري يـتـم فـي احـد الـمـراكـز الـعـسـكـريـة ويـكـون مـن رتـبـة :",
    options: [
      "رئـيـس رقـبـاء واعـلـى",
      "مـسـؤول افـراد واعـلـى",
      "رتـبـة مـلازم وأعـلـى مـن ذالـك",
      "اي عـسـكـري يـسـتـطـيـع القـيـام بـ اصـطـفـاف عـسـكري"
    ],
    correct: 2
  },
  {
    q: "هـل يـحـق لـقـطـاع امـن الـطـرق وشـرطـة الـمـحـافـظـات الـخـروج مـن الـدمـام وجـدة :",
    options: [
      "يـمـكـنـنـي فـي كـلا الاحـوال الـتـوجـه فـي اي وقـت واي مـطـاردة هـنـاك",
      "فـي حـال كـانـت مـنـطـقـة الـلـعـب هـنـاك",
      "لايـمـكـنـنـي الـتـوجـه هـناك قـطـعا فـي كـلا الاحـوال"
    ],
    correct: 1
  },
  {
    q: "هـل يـحـق قـطـع بـلاغ عـسـكـري اخـر لـغـرض الاهـمـيـة :",
    options: [
      "لايـمـكـنـنـي نـهـائـيـا يـجـب عـلـي انـظـار انـتـهـاء بـلاغ زمـيـلـي كـامـلا ثـم تـمـريـر بـلاغـي",
      "نـعـم ولـكـن بـ انـتـظـام وبـدء الـبـلاغ بـ الاعـتـذار عـن الـمـقـاطـعـة وتـمـريـر بـلاغـك فـي حـال كـن بـلاغـك اهـم"
    ],
    correct: 1
  },
  {
    q: "ماهو تعريف الـ RDM :",
    options: ["الـصـدم الـعـشـوائـي", "الـقـتـل الـعـشـوائـي"],
    correct: 1
  },
  {
    q: "ماهو تعريف الـ VDM :",
    options: ["الـصـدم الـعـشـوائـي", "الـقـتـل الـعـشـوائـي"],
    correct: 0
  },
  {
    q: "هـل يـسـمـح لـك مـعـارضـة امـر ضـابـط :",
    options: [
      "يـسـمـح بـسـبـب وجـود وجـه نـظـر مـنـطـقـيـة وصـارمـة",
      "يـجـب عـلـي عـدم مـعـارضـة امـر الـضـبـاط نـهـائيـا وانـفـذ امـره ولـو كأن لـدي وجـه نـظـر اسـتـطـيـع طـرحـهـا عـلـيـه لاحـقـا"
    ],
    correct: 1
  },
  {
    q: "ماهي المدة المطلوبة للصدم الاحترافي :",
    options: [
      "اسـتـطـيـع صـدمـة فـورا فـي حـال كـان الـشـخـص مـطـلـوبـا او مـهـربـا",
      "بـعـد ثـلاث دقـائـق مـن ابـتـداء الـمـطـاردة",
      "بـعـد خـمـس دقـائـق مـن ابـتـداء الـمـطـاردة",
      "بـعـد عـشـر دقـائـق مـن ابـتـداء الـمـطـاردة"
    ],
    correct: 2
  },
  {
    q: "كـيـف تـتـم عـمـلـيـة الاسـتـيـقـاف الـجـنـائـي :",
    options: [
      "يـكـون اسـتـيـقـاف الـمـخـالـف مـن خـلـف مـركـبـة الـمـخـالـف",
      "يـكـون اسـتـيـقـاف الـمـخـالـف مـن امـام مـركـبـة الـمـخـالـف"
    ],
    correct: 1
  },
  {
    q: "كـيـف تـتـم عـمـلـيـة الاسـتـيـقـاف الـمـروري :",
    options: [
      "يـكـون اسـتـيـقـاف الـمـخـالـف مـن خـلـف مـركـبـة الـمـخـالـف",
      "يـكـون اسـتـيـقـاف الـمـخـالـف مـن امـام مـركـبـة الـمـخـالـف"
    ],
    correct: 0
  }
];

// ================= HELPERS =================

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      error: "NOT_LOGGED_IN",
      redirect: "/"
    });
  }
  next();
}

async function requireGuild(req, res, next) {
  try {
    const member = await discordGetMember(req.session.user.id);

    if (!member || !Array.isArray(member.roles)) {
      return res.status(403).json({
        error: "NOT_IN_GUILD",
        inviteUrl: DISCORD_INVITE_URL,
        redirect: "/"
      });
    }

    next();
  } catch {
    return res.status(403).json({
      error: "NOT_IN_GUILD",
      inviteUrl: DISCORD_INVITE_URL,
      redirect: "/"
    });
  }
}

function ensureCooldownFile() {
  if (!fs.existsSync(COOLDOWN_FILE)) {
    fs.writeFileSync(COOLDOWN_FILE, JSON.stringify({}), "utf8");
  }
}

function readCooldowns() {
  ensureCooldownFile();
  try {
    return JSON.parse(fs.readFileSync(COOLDOWN_FILE, "utf8") || "{}");
  } catch {
    return {};
  }
}

function writeCooldowns(obj) {
  fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(obj, null, 2), "utf8");
}

function getCooldownRemainingMs(userId) {
  const c = readCooldowns();
  const until = Number(c[userId] || 0);
  const now = Date.now();
  return until > now ? until - now : 0;
}

function setCooldown(userId, ms) {
  const c = readCooldowns();
  c[userId] = Date.now() + ms;
  writeCooldowns(c);
}

function containsBlockedWord(text) {
  if (!text) return false;
  const t = String(text).toLowerCase().replace(/\s+/g, "");

  const blocked = [
    "ابو","أبو","كس","مجلخ","العراب","نايكم","الزق","زق","تبن","التبن",
    "حيوان","الحيوان","الفيمبوي","الديوث","المكسكس","المزبزب",
    "عاهرة","عاهره","عرابكم","ـ"
  ];

  return blocked.some(w => t.includes(w));
}

function msToReadable(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0) return `${m} دقـائـق و ${s} ثـانـيـة`;
  return `${s} ثـانـيـة`;
}

function buildAvatarUrl(id, avatar) {
  if (!avatar) return "";
  return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=256`;
}

function getRedirectUri() {
  return process.env.DISCORD_REDIRECT_URI || `${BASE_URL}/auth/callback`;
}

// ================= DISCORD API =================

async function discordTokenExchange(code) {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri()
  });

  const r = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    console.error("[MK5] TOKEN_EXCHANGE_FAILED", txt);
    throw new Error("TOKEN_EXCHANGE_FAILED");
  }

  return r.json();
}

async function discordFetchUser(accessToken) {
  const r = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    console.error("[MK5] FETCH_USER_FAILED", txt);
    throw new Error("FETCH_USER_FAILED");
  }

  return r.json();
}

async function discordGetMember(userId) {
  const r = await fetch(
    `https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`,
    {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    }
  );

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    console.error("[MK5] GET_MEMBER_FAILED", {
      status: r.status,
      userId,
      guildId: GUILD_ID,
      response: txt
    });
    return null;
  }

  return r.json();
}

async function discordAddRole(userId, roleId) {
  if (!roleId) return;

  const r = await fetch(
    `https://discord.com/api/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    }
  );

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    console.error("[MK5] ADD_ROLE_FAILED", txt);
    throw new Error("ADD_ROLE_FAILED");
  }
}

async function discordRemoveRole(userId, roleId) {
  if (!roleId) return;

  const r = await fetch(
    `https://discord.com/api/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    }
  );

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    console.error("[MK5] REMOVE_ROLE_FAILED", txt);
    throw new Error("REMOVE_ROLE_FAILED");
  }
}

async function sendWebhookLog({
  userId,
  avatarUrl,
  fullName,
  sectorName,
  scorePct,
  correct,
  timeTakenText
}) {
  if (!WEBHOOK_URL) return;

  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "MK5 Activation Log",
      content: "**@everyone | @here**",
      embeds: [
        {
          title: "هـنـاك مـتـفـعـل نـاجـح وجـديـد ┆ ✅",
          color: 0x27b7ff,
          thumbnail: avatarUrl ? { url: avatarUrl } : undefined,
          fields: [
            { name: "\u200B", value: `**الـمـتـفـعّـل :** <@${userId}>`, inline: false },
            { name: "\u200B", value: `**الاسـم الـثـنـائـي :** ${fullName || "—"}`, inline: false },
            { name: "\u200B", value: `**قـطـاع الـمـتـفـعـل :** ${sectorName || "—"}`, inline: false },
            { name: "\u200B", value: `**الـنـسـبـة الـمـئـويـة :** ${scorePct}% | ${correct}/10`, inline: false },
            { name: "\u200B", value: `**الـوقـت الـمـسـتـغـرق :** ${timeTakenText || "—"}`, inline: false }
          ],
          footer: {
            text: "سـلـم الـكـود الـعـسـكـري لـ اسـم الـمـتـفـعـل اعـلاه واتـبـع الـتـعـلـيـمـات"
          }
        }
      ]
    })
  }).catch(() => {});
}

// ================= AUTH =================

app.get("/auth/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "identify"
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

async function handleDiscordCallback(req, res) {
  try {
    const code = req.query.code;

    if (!code) {
      return res.redirect("/");
    }

    const token = await discordTokenExchange(code);
    const user = await discordFetchUser(token.access_token);

    req.session.user = {
      id: user.id,
      username: user.username,
      global_name: user.global_name || "",
      avatar: user.avatar || "",
      avatarUrl: buildAvatarUrl(user.id, user.avatar || "")
    };

    req.session.flow = {
      startedAt: Date.now(),
      quizDone: false,
      passed: false,
      correct: 0,
      score: 0,
      sectorKey: null,
      sectorName: null,
      fullName: null,
      finishedAt: null
    };

    req.session.save(() => {
      res.redirect("/");
    });
  } catch (e) {
    console.error("[MK5] AUTH_CALLBACK_FAILED", e.message);
    res.redirect("/");
  }
}

app.get("/auth/callback", handleDiscordCallback);
app.get("/auth/discord/callback", handleDiscordCallback);

app.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// ================= API =================

app.get("/api/me", requireLogin, async (req, res) => {
  try {
    const cooldownMs = getCooldownRemainingMs(req.session.user.id);
    const member = await discordGetMember(req.session.user.id);

    const inGuild = !!member && Array.isArray(member.roles);
    const hasActivatedRole = inGuild && member.roles.includes(ACTIVATED_ROLE);

    return res.json({
      user: req.session.user,
      inGuild: inGuild,
      inviteUrl: DISCORD_INVITE_URL,
      cooldownMs,
      cooldownText: msToReadable(cooldownMs),
      hasActivatedRole: hasActivatedRole,
      flow: req.session.flow || null,
      checkedAt: Date.now()
    });
  } catch (e) {
    return res.json({
      user: req.session.user,
      inGuild: false,
      inviteUrl: DISCORD_INVITE_URL,
      cooldownMs: 0,
      cooldownText: "0 ثـانـيـة",
      hasActivatedRole: false,
      flow: req.session.flow || null,
      checkedAt: Date.now()
    });
  }
});

app.get("/api/quiz", requireLogin, requireGuild, (req, res) => {
  const cooldownMs = getCooldownRemainingMs(req.session.user.id);

  if (cooldownMs > 0) {
    return res.status(429).json({
      error: "COOLDOWN",
      cooldownMs,
      cooldownText: msToReadable(cooldownMs),
      redirect: `/?cooldown=1&wait=${encodeURIComponent(msToReadable(cooldownMs))}`
    });
  }

  res.json({
    total: QUIZ.length,
    questions: QUIZ.map(q => ({
      q: q.q,
      options: q.options
    }))
  });
});

app.post("/api/quiz/submit", requireLogin, requireGuild, async (req, res) => {
  const cooldownMs = getCooldownRemainingMs(req.session.user.id);

  if (cooldownMs > 0) {
    return res.status(429).json({
      error: "COOLDOWN",
      cooldownMs,
      cooldownText: msToReadable(cooldownMs),
      redirect: `/?cooldown=1&wait=${encodeURIComponent(msToReadable(cooldownMs))}`
    });
  }

  const { answers } = req.body;

  if (!Array.isArray(answers) || answers.length !== QUIZ.length) {
    return res.status(400).json({ error: "BAD_ANSWERS" });
  }

  let correct = 0;

  answers.forEach((answer, i) => {
    if (Number(answer) === Number(QUIZ[i].correct)) {
      correct++;
    }
  });

  const score = Math.round((correct / QUIZ.length) * 100);
  const passed = correct >= 5;

  req.session.flow = req.session.flow || {};
  req.session.flow.quizDone = true;
  req.session.flow.correct = correct;
  req.session.flow.score = score;
  req.session.flow.passed = passed;

  if (!passed) {
    setCooldown(req.session.user.id, FAIL_COOLDOWN_MS);
    const cd = getCooldownRemainingMs(req.session.user.id);

    req.session.save(() => {
      res.json({
        passed: false,
        correct,
        score,
        redirect: `/?failed=1&cooldown=1&wait=${encodeURIComponent(msToReadable(cd))}`
      });
    });

    return;
  }

  req.session.save(() => {
    res.json({
      passed: true,
      correct,
      score,
      redirect: "/sector.html"
    });
  });
});

app.get("/api/sectors", requireLogin, requireGuild, (req, res) => {
  const flow = req.session.flow || {};

  if (!flow.quizDone || !flow.passed) {
    return res.status(403).json({
      error: "QUIZ_REQUIRED",
      redirect: "/quiz.html"
    });
  }

  res.json({
    sectors: SECTORS.map(s => ({
      key: s.key,
      name: s.name,
      image: s.image
    }))
  });
});

app.post("/api/sector/select", requireLogin, requireGuild, async (req, res) => {
  try {
    const flow = req.session.flow || {};

    if (!flow.quizDone || !flow.passed) {
      return res.status(403).json({
        error: "QUIZ_REQUIRED",
        redirect: "/quiz.html"
      });
    }

    if (flow.sectorKey) {
      return res.status(409).json({
        error: "SECTOR_ALREADY_SELECTED",
        redirect: "/name.html"
      });
    }

    const sector = SECTORS.find(s => s.key === req.body.sectorKey);

    if (!sector) {
      return res.status(400).json({ error: "BAD_SECTOR" });
    }

    await discordAddRole(req.session.user.id, sector.roleId);

    flow.sectorKey = sector.key;
    flow.sectorName = sector.name;
    req.session.flow = flow;

    req.session.save(() => {
      res.json({
        ok: true,
        redirect: "/name.html"
      });
    });
  } catch (e) {
    console.error("[MK5] SECTOR_ROLE_FAILED", e.message);
    res.status(500).json({ error: "SECTOR_ROLE_FAILED" });
  }
});

app.post("/api/name/submit", requireLogin, requireGuild, async (req, res) => {
  try {
    const flow = req.session.flow || {};

    if (!flow.quizDone || !flow.passed) {
      return res.status(403).json({
        error: "QUIZ_REQUIRED",
        redirect: "/quiz.html"
      });
    }

    if (!flow.sectorKey) {
      return res.status(403).json({
        error: "SECTOR_REQUIRED",
        redirect: "/sector.html"
      });
    }

    const fn = String(req.body.firstName || "").trim();
    const ln = String(req.body.lastName || "").trim();

    if (!fn || !ln) {
      return res.status(400).json({ error: "NAME_REQUIRED" });
    }

    if (containsBlockedWord(fn) || containsBlockedWord(ln)) {
      return res.status(400).json({ error: "NAME_BLOCKED" });
    }

    const fullName = `${fn} ${ln}`.trim();

    flow.fullName = fullName;
    flow.finishedAt = Date.now();
    req.session.flow = flow;

    const elapsedMs = flow.finishedAt - (flow.startedAt || flow.finishedAt);
    const timeTakenText = msToReadable(elapsedMs);

    await discordAddRole(req.session.user.id, ACTIVATED_ROLE);

    if (SUCCESS_ADD_ROLE) {
      await discordAddRole(req.session.user.id, SUCCESS_ADD_ROLE);
    }

    if (SUCCESS_REMOVE_ROLE) {
      await discordRemoveRole(req.session.user.id, SUCCESS_REMOVE_ROLE);
    }

    await sendWebhookLog({
      userId: req.session.user.id,
      avatarUrl: req.session.user.avatarUrl,
      fullName,
      sectorName: flow.sectorName,
      scorePct: flow.score || 0,
      correct: flow.correct || 0,
      timeTakenText
    });

    req.session.save(() => {
      res.json({
        ok: true,
        redirect: "/result.html"
      });
    });
  } catch (e) {
    console.error("[MK5] FINISH_FAILED", e.message);
    res.status(500).json({ error: "FINISH_FAILED" });
  }
});

app.get("/api/report", requireLogin, (req, res) => {
  const f = req.session.flow || {};
  const startedAt = f.startedAt || Date.now();
  const finishedAt = f.finishedAt || Date.now();
  const elapsedMs = Math.max(0, finishedAt - startedAt);

  res.json({
    user: req.session.user,
    fullName: f.fullName || "",
    sectorName: f.sectorName || "",
    score: Number(f.score || 0),
    correct: Number(f.correct || 0),
    timeTakenMs: elapsedMs,
    timeTakenText: msToReadable(elapsedMs),
    passed: !!f.passed,
    finished: !!f.fullName
  });
});

// ================= FALLBACK =================

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================= START =================

app.listen(PORT, () => {
  console.log(`[MK5] running on port ${PORT}`);
  console.log(`[MK5] BASE_URL: ${BASE_URL}`);
  console.log(`[MK5] REDIRECT_URI: ${getRedirectUri()}`);
  console.log(`[MK5] GUILD_ID: ${GUILD_ID}`);
  console.log(`[MK5] ACTIVATED_ROLE: ${ACTIVATED_ROLE}`);
});
