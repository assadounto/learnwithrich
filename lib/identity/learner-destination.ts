export function learnerDestination(value?: string | null): string {
  const destination = value || '/account';
  try {
    const target = new URL(destination, 'https://learnwithrich.invalid');
    const decodedPath = decodeURIComponent(target.pathname).toLowerCase();
    if (target.origin !== 'https://learnwithrich.invalid' || !decodedPath.startsWith('/') || decodedPath.startsWith('//') || decodedPath.includes('\\') || decodedPath.startsWith('/admin')) return '/account';
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return '/account';
  }
}
