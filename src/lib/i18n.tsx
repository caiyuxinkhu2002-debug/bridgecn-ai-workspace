import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "ko" | "zh";

type Dict = Record<string, string>;

const en: Dict = {
  "brand.tag": "Korea → China",
  "nav.section.workspace": "Workspace",
  "nav.section.intelligence": "Intelligence",
  "nav.section.account": "Account",
  "nav.dashboard": "Dashboard",
  "nav.projects": "Projects",
  "nav.market": "China Market Insight",
  "nav.consumer": "Consumer Insight",
  "nav.localization": "Localization Studio",
  "nav.launch": "Launch Checklist",
  "nav.reports": "Reports",
  "nav.settings": "Settings",
  "top.search": "Search projects, insights, reports…",
  "top.newProject": "New project",
  "top.workspace": "Seoul HQ",
  "menu.profile": "Profile",
  "menu.workspace": "Workspace",
  "menu.language": "Language",
  "menu.notifications": "Notifications",
  "menu.appearance": "Appearance",
  "menu.billing": "Billing",
  "menu.apiKeys": "API Keys",
  "menu.logout": "Log out",
  "menu.signedInAs": "Signed in as",
  "notif.title": "Notifications",
  "notif.markAll": "Mark all as read",
  "notif.viewAll": "View all",
  "notif.empty": "You're all caught up.",
  "notif.1.title": "Market report finished",
  "notif.1.body": "Beauty of Joseon · China Expansion Report",
  "notif.2.title": "New trend detected",
  "notif.2.body": "Glass skin mentions on Xiaohongshu +42%",
  "notif.3.title": "Localization completed",
  "notif.3.body": "ANUA campaign brief translated to 简体中文",
  "notif.4.title": "Project shared",
  "notif.4.body": "Minji shared Medicube · Tmall Launch",
  "notif.5.title": "AI recommendation available",
  "notif.5.body": "Consider Douyin live commerce for Q3",
  "plan.free": "Free plan",
  "plan.credits": "12 of 50 credits used this month",
  "plan.upgrade": "Upgrade plan",
  "auth.signin.title": "Welcome back",
  "auth.signin.sub": "Sign in to your BridgeCN AI workspace.",
  "auth.signup.title": "Create your workspace",
  "auth.signup.sub": "Start your China expansion in minutes.",
  "auth.forgot.title": "Reset your password",
  "auth.forgot.sub": "We'll email you a secure link to reset your password.",
  "auth.forgot.sent": "Check your inbox — a reset link is on its way.",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.name": "Full name",
  "auth.company": "Company",
  "auth.signin": "Sign in",
  "auth.signup": "Create account",
  "auth.sendReset": "Send reset link",
  "auth.continueWith": "Or continue with",
  "auth.google": "Continue with Google",
  "auth.apple": "Continue with Apple",
  "auth.kakao": "Continue with Kakao",
  "auth.email_btn": "Continue with email",
  "auth.forgotLink": "Forgot password?",
  "auth.noAccount": "Don't have an account?",
  "auth.hasAccount": "Already have an account?",
  "auth.backToSignin": "Back to sign in",
  "auth.side.title": "The AI workspace for cross-border growth.",
  "auth.side.sub": "Research, localize and launch into the Chinese market — from Seoul, with confidence.",
  "auth.side.quote": "BridgeCN AI cut our China research from 8 weeks to 3 days.",
  "auth.side.author": "Sora K. · Brand Lead, Beauty of Joseon",
  "settings.title": "Settings",
  "settings.sub": "Manage your account, workspace and integrations.",
  "settings.tab.profile": "Profile",
  "settings.tab.workspace": "Workspace",
  "settings.tab.members": "Members",
  "settings.tab.billing": "Billing",
  "settings.tab.security": "Security",
  "settings.tab.integrations": "Integrations",
  "settings.tab.apikeys": "API Keys",
  "settings.tab.notifications": "Notifications",
  "settings.tab.appearance": "Appearance",
  "settings.tab.language": "Language",
};

const ko: Dict = {
  "brand.tag": "한국 → 중국",
  "nav.section.workspace": "워크스페이스",
  "nav.section.intelligence": "인텔리전스",
  "nav.section.account": "계정",
  "nav.dashboard": "대시보드",
  "nav.projects": "프로젝트",
  "nav.market": "중국 시장 인사이트",
  "nav.consumer": "소비자 인사이트",
  "nav.localization": "현지화 스튜디오",
  "nav.launch": "런칭 체크리스트",
  "nav.reports": "리포트",
  "nav.settings": "설정",
  "top.search": "프로젝트, 인사이트, 리포트 검색…",
  "top.newProject": "새 프로젝트",
  "top.workspace": "Seoul 본사",
  "menu.profile": "프로필",
  "menu.workspace": "워크스페이스",
  "menu.language": "언어",
  "menu.notifications": "알림",
  "menu.appearance": "테마",
  "menu.billing": "결제",
  "menu.apiKeys": "API 키",
  "menu.logout": "로그아웃",
  "menu.signedInAs": "로그인 계정",
  "notif.title": "알림",
  "notif.markAll": "모두 읽음 표시",
  "notif.viewAll": "전체 보기",
  "notif.empty": "모두 확인했어요.",
  "notif.1.title": "시장 리포트 완료",
  "notif.1.body": "Beauty of Joseon · 중국 진출 리포트",
  "notif.2.title": "새 트렌드 감지",
  "notif.2.body": "샤오훙슈 글래스 스킨 언급 +42%",
  "notif.3.title": "현지화 완료",
  "notif.3.body": "ANUA 캠페인 브리프 简体中文 번역 완료",
  "notif.4.title": "프로젝트 공유됨",
  "notif.4.body": "민지님이 Medicube · 티몰 런칭을 공유했습니다",
  "notif.5.title": "AI 추천",
  "notif.5.body": "3분기 더우인 라이브 커머스를 검토하세요",
  "plan.free": "무료 플랜",
  "plan.credits": "이번 달 50 크레딧 중 12 사용",
  "plan.upgrade": "플랜 업그레이드",
  "auth.signin.title": "다시 오신 것을 환영해요",
  "auth.signin.sub": "BridgeCN AI 워크스페이스에 로그인하세요.",
  "auth.signup.title": "워크스페이스 만들기",
  "auth.signup.sub": "중국 진출을 몇 분 안에 시작하세요.",
  "auth.forgot.title": "비밀번호 재설정",
  "auth.forgot.sub": "재설정 링크를 이메일로 보내드릴게요.",
  "auth.forgot.sent": "받은 편지함을 확인하세요 — 재설정 링크를 보냈습니다.",
  "auth.email": "이메일",
  "auth.password": "비밀번호",
  "auth.name": "이름",
  "auth.company": "회사",
  "auth.signin": "로그인",
  "auth.signup": "계정 만들기",
  "auth.sendReset": "재설정 링크 전송",
  "auth.continueWith": "다음으로 계속하기",
  "auth.google": "Google로 계속하기",
  "auth.apple": "Apple로 계속하기",
  "auth.kakao": "카카오로 계속하기",
  "auth.email_btn": "이메일로 계속하기",
  "auth.forgotLink": "비밀번호를 잊으셨나요?",
  "auth.noAccount": "계정이 없으신가요?",
  "auth.hasAccount": "이미 계정이 있으신가요?",
  "auth.backToSignin": "로그인으로 돌아가기",
  "auth.side.title": "크로스보더 성장을 위한 AI 워크스페이스.",
  "auth.side.sub": "서울에서 자신감 있게 중국 시장을 리서치하고 현지화하고 런칭하세요.",
  "auth.side.quote": "BridgeCN AI 덕분에 중국 리서치를 8주에서 3일로 줄였습니다.",
  "auth.side.author": "Sora K. · Brand Lead, Beauty of Joseon",
  "settings.title": "설정",
  "settings.sub": "계정, 워크스페이스, 연동을 관리하세요.",
  "settings.tab.profile": "프로필",
  "settings.tab.workspace": "워크스페이스",
  "settings.tab.members": "멤버",
  "settings.tab.billing": "결제",
  "settings.tab.security": "보안",
  "settings.tab.integrations": "연동",
  "settings.tab.apikeys": "API 키",
  "settings.tab.notifications": "알림",
  "settings.tab.appearance": "테마",
  "settings.tab.language": "언어",
};

const zh: Dict = {
  "brand.tag": "韩国 → 中国",
  "nav.section.workspace": "工作区",
  "nav.section.intelligence": "智能洞察",
  "nav.section.account": "账户",
  "nav.dashboard": "仪表盘",
  "nav.projects": "项目",
  "nav.market": "中国市场洞察",
  "nav.consumer": "消费者洞察",
  "nav.localization": "本地化工作室",
  "nav.launch": "上市清单",
  "nav.reports": "报告",
  "nav.settings": "设置",
  "top.search": "搜索项目、洞察、报告…",
  "top.newProject": "新建项目",
  "top.workspace": "首尔总部",
  "menu.profile": "个人资料",
  "menu.workspace": "工作区",
  "menu.language": "语言",
  "menu.notifications": "通知",
  "menu.appearance": "外观",
  "menu.billing": "账单",
  "menu.apiKeys": "API 密钥",
  "menu.logout": "退出登录",
  "menu.signedInAs": "登录为",
  "notif.title": "通知",
  "notif.markAll": "全部标为已读",
  "notif.viewAll": "查看全部",
  "notif.empty": "已全部查阅。",
  "notif.1.title": "市场报告已完成",
  "notif.1.body": "Beauty of Joseon · 中国扩张报告",
  "notif.2.title": "发现新趋势",
  "notif.2.body": "小红书「玻璃肌」提及度 +42%",
  "notif.3.title": "本地化已完成",
  "notif.3.body": "ANUA 活动文案已译为简体中文",
  "notif.4.title": "项目已共享",
  "notif.4.body": "Minji 共享了 Medicube · 天猫上市",
  "notif.5.title": "AI 推荐",
  "notif.5.body": "Q3 可考虑抖音直播带货",
  "plan.free": "免费方案",
  "plan.credits": "本月已使用 12 / 50 积分",
  "plan.upgrade": "升级方案",
  "auth.signin.title": "欢迎回来",
  "auth.signin.sub": "登录你的 BridgeCN AI 工作区。",
  "auth.signup.title": "创建工作区",
  "auth.signup.sub": "几分钟内开启你的中国市场拓展。",
  "auth.forgot.title": "重置密码",
  "auth.forgot.sub": "我们会向你的邮箱发送安全重置链接。",
  "auth.forgot.sent": "请查收邮件 — 重置链接已发送。",
  "auth.email": "邮箱",
  "auth.password": "密码",
  "auth.name": "姓名",
  "auth.company": "公司",
  "auth.signin": "登录",
  "auth.signup": "创建账户",
  "auth.sendReset": "发送重置链接",
  "auth.continueWith": "或使用以下方式",
  "auth.google": "使用 Google 继续",
  "auth.apple": "使用 Apple 继续",
  "auth.kakao": "使用 Kakao 继续",
  "auth.email_btn": "使用邮箱继续",
  "auth.forgotLink": "忘记密码？",
  "auth.noAccount": "还没有账户？",
  "auth.hasAccount": "已有账户？",
  "auth.backToSignin": "返回登录",
  "auth.side.title": "跨境增长的 AI 工作区。",
  "auth.side.sub": "从首尔出发，自信地研究、本地化并进入中国市场。",
  "auth.side.quote": "BridgeCN AI 将我们的中国市场调研从 8 周缩短到 3 天。",
  "auth.side.author": "Sora K. · Brand Lead, Beauty of Joseon",
  "settings.title": "设置",
  "settings.sub": "管理你的账户、工作区与集成。",
  "settings.tab.profile": "个人资料",
  "settings.tab.workspace": "工作区",
  "settings.tab.members": "成员",
  "settings.tab.billing": "账单",
  "settings.tab.security": "安全",
  "settings.tab.integrations": "集成",
  "settings.tab.apikeys": "API 密钥",
  "settings.tab.notifications": "通知",
  "settings.tab.appearance": "外观",
  "settings.tab.language": "语言",
};

const dicts: Record<Locale, Dict> = { en, ko, zh };

export const localeLabels: Record<Locale, string> = {
  en: "English",
  ko: "한국어",
  zh: "简体中文",
};

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: (k: string) => string };
const I18nCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "bridgecn.locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && saved in dicts) setLocaleState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(() => {
    const dict = dicts[locale];
    return {
      locale,
      setLocale,
      t: (k: string) => dict[k] ?? en[k] ?? k,
    };
  }, [locale, setLocale]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}