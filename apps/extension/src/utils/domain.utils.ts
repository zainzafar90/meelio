const getDomain = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return domain;
  } catch (error) {
    console.warn("Invalid URL:", url);
    return url;
  }
};

export const getFaviconUrl = (url: string) => {
  const domain = getDomain(url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
};
