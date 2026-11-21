import { useEffect, useState, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/**
 * Honest 4-state offline readiness + update notification:
 * - 'preparing': Đang chuẩn bị offline (Service Worker installing/verifying)
 * - 'ready': Sẵn sàng offline (verified real Cache Storage entries for shell, worker, fonts, bundles)
 * - 'needs-assets': Cần tải bổ sung tài nguyên (SW active but required offline resources missing)
 * - 'unverified': Chưa thể xác nhận offline (dev/preview host or SW unsupported)
 * - 'update-available': Cập nhật bản mới
 */
export type OfflineReadiness =
  | 'preparing'
  | 'ready'
  | 'needs-assets'
  | 'unverified'
  | 'update-available';

/**
 * 5 explicit PWA installation states:
 * - 'can-install': Valid beforeinstallprompt event captured (ready to invoke prompt())
 * - 'guide-required': Manual browser installation available (Safari macOS Add to Dock, iOS Share, Chrome/Edge menu)
 * - 'prompting': Browser install prompt is currently open awaiting userChoice
 * - 'installed-standalone': Confirmed running in standalone mode or browser fired appinstalled
 * - 'unsupported': Current browser does not support automatic or built-in PWA installation
 */
export type PwaInstallStatus =
  | 'can-install'
  | 'guide-required'
  | 'prompting'
  | 'installed-standalone'
  | 'unsupported';

export type BrowserInstallFamily =
  | 'safari-macos'
  | 'safari-ios'
  | 'edge'
  | 'chrome'
  | 'firefox'
  | 'other';

export interface InstallEnvironmentInfo {
  isStandalone: boolean;
  supportsBeforeInstallPrompt: boolean;
  isMacOS: boolean;
  isIOS: boolean;
  isSafariMacOS: boolean;
  safariVersion: number | null;
  safariSupportsAddToDock: boolean;
  hasMenuInstallMechanism: boolean;
  browserFamily: BrowserInstallFamily;
}

const CORE_OFFLINE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/pwa-192x192.png',
  '/icons/pwa-512x512.png',
  '/icons/pwa-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/fonts/DejaVuSans.ttf',
  '/fonts/DejaVuSans-Bold.ttf',
  '/fonts/DejaVuSerif.ttf',
  '/fonts/DejaVuSerif-Bold.ttf',
  '/workers/pdf.worker.min.mjs',
  '/mathlive/fonts/KaTeX_Main-Regular.woff2',
  '/mathlive/fonts/KaTeX_Main-Bold.woff2',
  '/mathlive/fonts/KaTeX_Math-Italic.woff2',
  '/mathlive/fonts/KaTeX_AMS-Regular.woff2',
  '/mathlive/fonts/KaTeX_Size1-Regular.woff2',
  '/mathlive/fonts/KaTeX_Size2-Regular.woff2',
];

function checkStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false;
  const standaloneMq =
    typeof window.matchMedia === 'function' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches);
  const iosStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(standaloneMq || iosStandalone);
}

/**
 * Detects install capabilities combining feature detection ('onbeforeinstallprompt' in window,
 * matchMedia display-mode, navigator.userAgentData, vendor, touch points) rather than UA alone.
 */
function detectInstallEnvironment(): InstallEnvironmentInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isStandalone: false,
      supportsBeforeInstallPrompt: false,
      isMacOS: false,
      isIOS: false,
      isSafariMacOS: false,
      safariVersion: null,
      safariSupportsAddToDock: false,
      hasMenuInstallMechanism: false,
      browserFamily: 'other',
    };
  }

  const isStandalone = checkStandaloneDisplayMode();
  const supportsBeforeInstallPrompt = 'onbeforeinstallprompt' in window;

  const ua = navigator.userAgent || '';
  const uaLower = ua.toLowerCase();
  const vendor = (navigator.vendor || '').toLowerCase();
  const navWithUad = navigator as Navigator & {
    userAgentData?: { platform?: string; brands?: Array<{ brand: string; version: string }> };
  };
  const platformHint = (
    navWithUad.userAgentData?.platform ||
    navigator.platform ||
    ''
  ).toLowerCase();

  const isIOS =
    /iphone|ipad|ipod/.test(uaLower) ||
    (platformHint.includes('mac') && navigator.maxTouchPoints > 1);

  const isMacOS = !isIOS && (platformHint.includes('mac') || /macintosh|mac os x/.test(uaLower));

  const brands = navWithUad.userAgentData?.brands?.map((b) => b.brand.toLowerCase()) || [];
  const isEdge =
    brands.some((b) => b.includes('edge')) || /edg\/|edga\/|edgios\//.test(uaLower);
  const isFirefox = /firefox|fxios/.test(uaLower) && !supportsBeforeInstallPrompt;
  const isChromiumBased =
    supportsBeforeInstallPrompt ||
    brands.some((b) => b.includes('chromium') || b.includes('chrome')) ||
    /chrome|crios|chromium|opr\/|coc_coc/.test(uaLower);

  const isSafariEngine =
    !supportsBeforeInstallPrompt &&
    !isChromiumBased &&
    !isEdge &&
    !isFirefox &&
    (vendor.includes('apple') ||
      typeof (window as unknown as { safari?: unknown }).safari !== 'undefined' ||
      /safari/.test(uaLower));

  const isSafariMacOS = isMacOS && isSafariEngine;
  const isSafariIOS = isIOS && isSafariEngine;

  let safariVersion: number | null = null;
  if (isSafariMacOS) {
    const match = ua.match(/Version\/(\d+)(?:\.\d+)?/i);
    if (match) {
      safariVersion = Number.parseInt(match[1], 10);
    }
  }

  // Safari 17+ on macOS Sonoma (14+) supports File -> Add to Dock
  const safariSupportsAddToDock =
    isSafariMacOS && (safariVersion === null || safariVersion >= 17);

  let browserFamily: BrowserInstallFamily = 'other';
  if (isSafariMacOS) browserFamily = 'safari-macos';
  else if (isSafariIOS) browserFamily = 'safari-ios';
  else if (isEdge) browserFamily = 'edge';
  else if (isChromiumBased) browserFamily = 'chrome';
  else if (isFirefox) browserFamily = 'firefox';

  const hasMenuInstallMechanism =
    safariSupportsAddToDock ||
    isSafariIOS ||
    browserFamily === 'chrome' ||
    browserFamily === 'edge';

  return {
    isStandalone,
    supportsBeforeInstallPrompt,
    isMacOS,
    isIOS,
    isSafariMacOS,
    safariVersion,
    safariSupportsAddToDock,
    hasMenuInstallMechanism,
    browserFamily,
  };
}

async function verifyOfflineCacheCoverage(): Promise<{
  ready: boolean;
  missing: string[];
}> {
  if (typeof caches === 'undefined') {
    return { ready: false, missing: CORE_OFFLINE_URLS };
  }
  try {
    const keys = await caches.keys();
    const studioKeys = keys.filter((k) => k.startsWith('pdf-edu-studio-'));
    if (studioKeys.length === 0) {
      return { ready: false, missing: ['app-shell', 'pdf-worker', 'fonts'] };
    }

    const requiredChecks = [
      '/manifest.webmanifest',
      '/workers/pdf.worker.min.mjs',
      '/fonts/DejaVuSans.ttf',
      '/fonts/DejaVuSans-Bold.ttf',
      '/fonts/DejaVuSerif.ttf',
      '/mathlive/fonts/KaTeX_Main-Regular.woff2',
    ];

    const missing: string[] = [];
    for (const url of requiredChecks) {
      let found = false;
      for (const k of studioKeys) {
        const cache = await caches.open(k);
        if (await cache.match(url)) {
          found = true;
          break;
        }
      }
      if (!found) missing.push(url);
    }

    let hasShell = false;
    let hasBundle = false;
    for (const k of studioKeys) {
      const cache = await caches.open(k);
      if ((await cache.match('/')) || (await cache.match('/index.html'))) {
        hasShell = true;
      }
      const reqs = await cache.keys();
      if (reqs.some((r) => /\/assets\/.*\.(js|css)/.test(r.url))) {
        hasBundle = true;
      }
    }
    if (!hasShell) missing.push('/index.html');
    if (!hasBundle) missing.push('/assets/app-bundle');

    return { ready: missing.length === 0, missing };
  } catch {
    return { ready: false, missing: ['cache-unavailable'] };
  }
}

export interface PwaInstallController {
  env: InstallEnvironmentInfo;
  installStatus: PwaInstallStatus;
  hasNativePrompt: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isSafariMacOS: boolean;
  promptAcceptedPending: boolean;
  isOnline: boolean;
  offlineStatus: OfflineReadiness;
  offlineDetail: string;
  installGuideOpen: boolean;
  setInstallGuideOpen: (open: boolean) => void;
  toggleInstallGuide: () => void;
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  applyUpdate: () => void;
  prefetchOfflineAssets: () => Promise<boolean>;
}

export function usePWAInstall(): PwaInstallController {
  const [env, setEnv] = useState<InstallEnvironmentInfo>(() => detectInstallEnvironment());
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [appInstalledEventFired, setAppInstalledEventFired] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [promptAcceptedPending, setPromptAcceptedPending] = useState(false);
  const [installGuideOpen, setInstallGuideOpen] = useState(false);

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineStatus, setOfflineStatus] = useState<OfflineReadiness>('preparing');
  const [offlineDetail, setOfflineDetail] = useState<string>(
    'Đang kiểm tra trạng thái bộ nhớ ngoại tuyến...'
  );
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  const recheckCache = useCallback(async () => {
    const check = await verifyOfflineCacheCoverage();
    if (check.ready) {
      setOfflineStatus((prev) => (prev === 'update-available' ? prev : 'ready'));
      setOfflineDetail(
        'Đã xác nhận lưu đủ lõi ứng dụng, bộ máy PDF Worker, font tiếng Việt và font MathLive trong bộ nhớ trình duyệt.'
      );
    } else {
      setOfflineStatus((prev) => (prev === 'update-available' ? prev : 'needs-assets'));
      setOfflineDetail(
        `Còn thiếu ${check.missing.length} nhóm tài nguyên chưa lưu vào bộ nhớ đệm ngoại tuyến.`
      );
    }
    return check.ready;
  }, []);

  const prefetchOfflineAssets = useCallback(async () => {
    const reg = swRegRef.current;
    if (!reg?.active) {
      setOfflineStatus('unverified');
      setOfflineDetail(
        'Chế độ xem trước/phát triển không kích hoạt Service Worker. Khi chạy trên bản phát hành chính thức (HTTPS), ứng dụng sẽ tự động lưu đầy đủ tài nguyên ngoại tuyến.'
      );
      return false;
    }
    setOfflineStatus('preparing');
    setOfflineDetail('Đang tải và lưu tài nguyên ứng dụng, PDF Worker, MathLive và font tiếng Việt...');

    const assetUrls = Array.from(
      document.querySelectorAll<HTMLLinkElement | HTMLScriptElement>(
        'script[src^="/assets/"], link[href^="/assets/"]'
      )
    )
      .map((el) =>
        el instanceof HTMLScriptElement ? el.getAttribute('src') : el.getAttribute('href')
      )
      .filter((u): u is string => !!u);

    reg.active.postMessage({
      type: 'CACHE_URLS',
      urls: Array.from(new Set([...CORE_OFFLINE_URLS, ...assetUrls])),
    });
    return true;
  }, []);

  useEffect(() => {
    const currentEnv = detectInstallEnvironment();
    setEnv(currentEnv);

    // Subscribe to real standalone display-mode changes (no localStorage fake flag)
    const mqStandalone =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)')
        : null;
    const onDisplayModeChange = () => {
      setEnv((prev) => ({ ...prev, isStandalone: checkStandaloneDisplayMode() }));
    };
    mqStandalone?.addEventListener?.('change', onDisplayModeChange);

    // Only capture beforeinstallprompt on non-Safari environments where browser emits it
    const onBeforeInstall = (e: Event) => {
      if (currentEnv.isSafariMacOS) return;
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPromptAcceptedPending(false);
    };

    // Only mark installed when browser genuinely emits appinstalled
    const onInstalled = () => {
      setAppInstalledEventFired(true);
      setDeferredPrompt(null);
      setIsPrompting(false);
      setPromptAcceptedPending(false);
      setInstallGuideOpen(false);
    };

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    if (!currentEnv.isSafariMacOS) {
      window.addEventListener('beforeinstallprompt', onBeforeInstall);
    }
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const isDevOrPreviewHost =
      import.meta.env.DEV ||
      window.location.hostname.startsWith('ais-dev-') ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    let removeSwMessageListener: (() => void) | null = null;

    if ('serviceWorker' in navigator && isDevOrPreviewHost) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {});
      if ('caches' in window) {
        caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys.filter((k) => k.startsWith('pdf-edu-studio-')).map((k) => caches.delete(k))
            )
          )
          .catch(() => {});
      }
      setOfflineStatus('unverified');
      setOfflineDetail(
        'Đang chạy ở môi trường phát triển/xem trước (tắt Service Worker để tránh xung đột bộ nhớ đệm). Trạng thái offline được kích hoạt đầy đủ trên bản phát hành HTTPS.'
      );
    } else if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(async (reg) => {
          swRegRef.current = reg;
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setOfflineStatus('update-available');
            setOfflineDetail('Đã có phiên bản mới của PDF EDU STUDIO.');
          }
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(nw);
                setOfflineStatus('update-available');
                setOfflineDetail('Đã có phiên bản mới của PDF EDU STUDIO.');
              }
            });
          });

          await navigator.serviceWorker.ready;
          const ok = await recheckCache();
          if (!ok && reg.active) {
            await prefetchOfflineAssets();
          }
        })
        .catch(() => {
          setOfflineStatus('unverified');
          setOfflineDetail('Trình duyệt hiện không cho phép kích hoạt Service Worker ngoại tuyến.');
        });

      const onSwMessage = (ev: MessageEvent) => {
        if (ev.data?.type === 'CACHE_COMPLETE') {
          recheckCache();
        }
      };
      navigator.serviceWorker.addEventListener('message', onSwMessage);
      removeSwMessageListener = () =>
        navigator.serviceWorker.removeEventListener('message', onSwMessage);
    } else {
      setOfflineStatus('unverified');
      setOfflineDetail('Trình duyệt này chưa hỗ trợ lưu trữ ngoại tuyến (Service Worker).');
    }

    return () => {
      mqStandalone?.removeEventListener?.('change', onDisplayModeChange);
      removeSwMessageListener?.();
      if (!currentEnv.isSafariMacOS) {
        window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      }
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [recheckCache, prefetchOfflineAssets]);

  /**
   * Invokes deferredPrompt.prompt() directly inside user click gesture.
   * Never calls prompt() on null or on Safari. Never falsely claims installed on 'accepted' alone.
   */
  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (env.isSafariMacOS || !deferredPrompt) {
      return 'unavailable';
    }
    try {
      setIsPrompting(true);
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsPrompting(false);
      if (choice.outcome === 'accepted') {
        // Wait for genuine 'appinstalled' event or standalone mode before marking installed
        setPromptAcceptedPending(true);
        return 'accepted';
      }
      setPromptAcceptedPending(false);
      return 'dismissed';
    } catch {
      setDeferredPrompt(null);
      setIsPrompting(false);
      setPromptAcceptedPending(false);
      return 'unavailable';
    }
  }, [deferredPrompt, env.isSafariMacOS]);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [waitingWorker]);

  const toggleInstallGuide = useCallback(() => {
    setInstallGuideOpen((v) => !v);
  }, []);

  const isInstalled = env.isStandalone || appInstalledEventFired;

  let installStatus: PwaInstallStatus;
  if (isInstalled) {
    installStatus = 'installed-standalone';
  } else if (isPrompting) {
    installStatus = 'prompting';
  } else if (deferredPrompt && !env.isSafariMacOS) {
    installStatus = 'can-install';
  } else if (env.hasMenuInstallMechanism) {
    installStatus = 'guide-required';
  } else {
    installStatus = 'unsupported';
  }

  return {
    env,
    installStatus,
    hasNativePrompt: Boolean(deferredPrompt && !env.isSafariMacOS),
    isInstalled,
    isStandalone: env.isStandalone,
    isIOS: env.isIOS,
    isSafariMacOS: env.isSafariMacOS,
    promptAcceptedPending,
    isOnline,
    offlineStatus,
    offlineDetail,
    installGuideOpen,
    setInstallGuideOpen,
    toggleInstallGuide,
    install,
    applyUpdate,
    prefetchOfflineAssets,
  };
}
