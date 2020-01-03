function saveOptions(e) {
  var entry = document.querySelector("#repostring").value,
      saved = document.querySelector("#currentstring").value;
  if (entry.trim() != saved.trim()) {
    browser.storage.local.set({
      repos: document.querySelector("#repostring").value
    });
  }
  browser.runtime.sendMessage({
    trigger: "trigger reload"
  });
  e.preventDefault();
}

function restoreOptions() {
  var storageItem = browser.storage.local.get('repos');
  storageItem.then((res) => {
    document.querySelector("#currentstring").innerText = res.repos;
    document.querySelector("#repostring").innerText = res.repos;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
