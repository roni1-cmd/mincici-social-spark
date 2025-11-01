export const formatTimeAgo = (timestamp: string | number): string => {
  if (!timestamp) return "Just now";
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export const getLastActiveTime = (lastActive: number | undefined): string => {
  if (!lastActive) return "Offline";
  
  const diff = Date.now() - lastActive;
  const minutes = Math.floor(diff / (1000 * 60));
  
  if (minutes < 1) return "Active now";
  if (minutes < 60) return `Active ${minutes}m ago`;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `Active ${hours}h ago`;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return `Active ${days}d ago`;
};
