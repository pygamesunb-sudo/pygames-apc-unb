const DAY = 24 * 60 * 60 * 1000;

export function conversationStamp(item) {
  const raw = String(item?.last_message_at || item?.updated_at || item?.created_at || '');
  const parsed = Date.parse(raw.replace(/-\d{6}$/, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function groupConversations(items, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const groups = [
    { id: 'today', label: 'Hoje', items: [] },
    { id: 'yesterday', label: 'Ontem', items: [] },
    { id: 'week', label: 'Últimos 7 dias', items: [] },
    { id: 'older', label: 'Mais antigas', items: [] },
  ];
  for (const item of items || []) {
    const time = conversationStamp(item);
    if (time >= start) groups[0].items.push(item);
    else if (time >= start - DAY) groups[1].items.push(item);
    else if (time >= start - 7 * DAY) groups[2].items.push(item);
    else groups[3].items.push(item);
  }
  return groups.filter((group) => group.items.length > 0);
}

export function readConversationFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('tutorConversation') || '';
}

export function writeConversationInUrl(conversationId) {
  const url = new URL(window.location.href);
  if (conversationId) url.searchParams.set('tutorConversation', conversationId);
  else url.searchParams.delete('tutorConversation');
  window.history.replaceState({}, '', url);
}
