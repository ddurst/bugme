function saveOptions(e) {
  let repoEntry = document.querySelector("#repostring").value,
      repoSaved = document.querySelector("#currentrepostring").value;
  if (repoEntry.trim() != repoSaved.trim()) {
    browser.storage.local.set({
      repos: document.querySelector("#repostring").value
    });
  }
  let projectEntry = document.querySelector("#repostring").value,
      projectSaved = document.querySelector("#currentrepostring").value;
  if (projectEntry.trim() != projectSaved.trim()) {
    browser.storage.local.set({
      projects: document.querySelector("#repostring").value
    });
  }
  browser.runtime.sendMessage({
    trigger: "trigger reload"
  });
  e.preventDefault();
}

function restoreOptions() {
  let storageItemRepo = browser.storage.local.get('repos'),
      storageItemProject = browser.storage.local.get('projects');
  storageItemRepo.then((res) => {
    if (res.repos != undefined) {
       document.querySelector("#currentrepostring").setAttribute("value", res.repos);
       document.querySelector("#repostring").innerText = res.repos;
    }
  });
  storageItemProject.then((res) => {
    if (res.projects != undefined) {
       document.querySelector("#currentprojectstring").setAttribute("value", res.projects);
       document.querySelector("#projectstring").innerText = res.projects;
    }
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
