export const changeFavicon = (iconPath: string) => {
  const link: HTMLLinkElement =
    document.querySelector("link[rel*='icon']") ||
    document.createElement("link");
  link.type = "image/x-icon";
  link.rel = "shortcut icon";
  link.href = iconPath;
  document.getElementsByTagName("head")[0].appendChild(link);
};
