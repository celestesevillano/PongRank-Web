export async function shareText(text: string): Promise<'shared' | 'copied'> {
  const url = window.location.href;
  if (navigator.share) {
    await navigator.share({ title: 'PongRank', text, url });
    return 'shared';
  }
  await navigator.clipboard.writeText(`${text} ${url}`);
  return 'copied';
}
