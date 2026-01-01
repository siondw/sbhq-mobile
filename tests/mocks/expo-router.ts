type HrefObject = {
  pathname: string;
  params?: Record<string, unknown>;
};

export type Href = string | HrefObject;

type RouterEvent = { type: 'push' | 'replace'; href: Href; resolvedPath: string };

let pathname = '/';
let globalSearchParams: Record<string, string | string[] | undefined> = {};
let localSearchParams: Record<string, string | string[] | undefined> = {};
let routerEvents: RouterEvent[] = [];

type FocusEffect = () => void | (() => void);
type FocusEffectEntry = { id: number; effect: FocusEffect; cleanup: null | (() => void) };
let focusEffectEntries: FocusEffectEntry[] = [];
let focusEffectNextId = 0;

const resolveHrefToPath = (href: Href): string => {
  if (typeof href === 'string') {
    return href;
  }

  const contestId =
    typeof href.params?.contestId === 'string'
      ? href.params.contestId
      : Array.isArray(href.params?.contestId)
        ? (href.params?.contestId as string[])[0]
        : undefined;

  const basePath =
    contestId && href.pathname.includes('/[contestId]')
      ? href.pathname.replace('/[contestId]', `/${contestId}`)
      : contestId && ['/submitted', '/correct', '/eliminated', '/winner'].includes(href.pathname)
        ? `${href.pathname}/${contestId}`
        : href.pathname;

  const queryParts: string[] = [];
  const roundParam = href.params?.round;
  if (typeof roundParam === 'number' && Number.isFinite(roundParam)) {
    queryParts.push(`round=${roundParam}`);
  }

  return queryParts.length > 0 ? `${basePath}?${queryParts.join('&')}` : basePath;
};

export const usePathname = () => pathname.split('?')[0] ?? pathname;
export const useGlobalSearchParams = <T extends Record<string, unknown>>() =>
  globalSearchParams as unknown as T;
export const useLocalSearchParams = <T extends Record<string, unknown>>() =>
  localSearchParams as unknown as T;

export const useFocusEffect = (effect: FocusEffect) => {
  // Implemented as an explicit, test-driven focus trigger (see __router.triggerFocus()).
  // We don’t auto-run on mount because “focus” is controlled by tests.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react') as typeof import('react');
  const entryIdRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const id = ++focusEffectNextId;
    entryIdRef.current = id;
    focusEffectEntries.push({ id, effect, cleanup: null });

    return () => {
      const idx = focusEffectEntries.findIndex((entry) => entry.id === id);
      if (idx < 0) {
        return;
      }
      const entry = focusEffectEntries[idx];
      if (entry.cleanup) {
        entry.cleanup();
      }
      focusEffectEntries.splice(idx, 1);
    };
  }, [effect]);
};

export const useRouter = () => ({
  push: (href: Href) => {
    const resolvedPath = resolveHrefToPath(href);
    routerEvents.push({ type: 'push', href, resolvedPath });
    pathname = resolvedPath;
  },
  replace: (href: Href) => {
    const resolvedPath = resolveHrefToPath(href);
    routerEvents.push({ type: 'replace', href, resolvedPath });
    pathname = resolvedPath;
  },
});

export const __router = {
  reset: () => {
    pathname = '/';
    globalSearchParams = {};
    localSearchParams = {};
    routerEvents = [];
    focusEffectEntries = [];
    focusEffectNextId = 0;
  },
  setPathname: (nextPathname: string) => {
    pathname = nextPathname;
  },
  setGlobalSearchParams: (params: Record<string, string | string[] | undefined>) => {
    globalSearchParams = params;
  },
  setLocalSearchParams: (params: Record<string, string | string[] | undefined>) => {
    localSearchParams = params;
  },
  getPathname: () => pathname,
  getEvents: () => routerEvents.slice(),
  triggerFocus: () => {
    focusEffectEntries = focusEffectEntries.map((entry) => {
      if (entry.cleanup) {
        entry.cleanup();
      }
      const nextCleanup = entry.effect();
      return { ...entry, cleanup: typeof nextCleanup === 'function' ? nextCleanup : null };
    });
  },
};
