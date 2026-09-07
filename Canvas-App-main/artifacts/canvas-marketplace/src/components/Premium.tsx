import { getTheme } from '@/lib/theme';

export function Premium({ children }: { children: React.ReactNode }) {
  const queryParams = new URLSearchParams(window.location.search);
  const styleVersion = queryParams.get('style') || '2';
  const theme = getTheme(styleVersion);

  return (
    <span className={`${theme.premiumTag} px-1`}>
      {children}
    </span>
  );
}