export const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};
