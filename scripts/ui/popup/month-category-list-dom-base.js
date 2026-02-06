// scripts/ui/popup/month-category-list-dom-base.js

export function clearContainer(container) {
  if (container) container.innerHTML = "";
}

export function addSeparator(container) {
  if (!container) return;
  const sep = document.createElement("div");
  sep.className = "ff-month-cat-sep";
  container.appendChild(sep);
}
