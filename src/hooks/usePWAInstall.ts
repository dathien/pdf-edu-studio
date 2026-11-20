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

const CORE_OFFLINE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/pwa-192x192.png',
  '/icons/pwa-512x512.png',
  '/fonts/DejaVuSans.ttf',
  '/fonts/DejaVuSans-Bold.ttf',
  '/fonts/DejaVuSerif.ttf',
  '/fonts/DejaVuSerif-Bold.ttf',
  '/workers/pdf.worker.min.mjs',
];

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

    // Verify HTML shell + at least one JS/CSS bundle is cached
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

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
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
        'Đã xác nhận lưu đủ lõi ứng dụng, bộ máy PDF Worker và bộ font tiếng Việt trong bộ nhớ trình duyệt.'
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
        'Chế độ xem trước/phát triển không kích hoạt Service Worker. Khi triển khai bản phát hành chính thức (HTTPS), ứng dụng sẽ tự động lưu đầy đủ tài nguyên ngoại tuyến.'
      );
      return false;
    }
    setOfflineStatus('preparing');
    setOfflineDetail('Đang tải và lưu tài nguyên ứng dụng, PDF Worker và font tiếng Việt...');
    // Collect active page's built JS/CSS assets to guarantee offline completeness
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
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Avoid Service Worker conflicts in Vite dev server & Google AI Studio dev preview.
    // HONESTY RULE: Never claim "Sẵn sàng offline" in dev/preview where SW is disabled!
    const isDevOrPreviewHost =
      import.meta.env.DEV ||
      window.location.hostname.startsWith('ais-dev-') ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

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
        'Đang chạy ở môi trường phát triển/xem trước (tắt Service Worker để tránh lỗi cache). Trạng thái offline sẽ được xác nhận đầy đủ trên bản phát hành chính thức.'
      );
    } else if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
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
      return () => {
        navigator.serviceWorker.removeEventListener('message', onSwMessage);
        window.removeEventListener('beforeinstallprompt', onBeforeInstall);
        window.removeEventListener('appinstalled', onInstalled);
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      };
    } else {
      setOfflineStatus('unverified');
      setOfflineDetail('Trình duyệt này chưa hỗ trợ lưu trữ ngoại tuyến (Service Worker).');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [recheckCache, prefetchOfflineAssets]);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [waitingWorker]);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isOnline,
    offlineStatus,
    offlineDetail,
    install,
    applyUpdate,
    prefetchOfflineAssets,
  };
}
