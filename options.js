let debug = false;

const bugzillaEntry = document.querySelector("#bz_instance"),
	  bugzillaSaved = document.querySelector("#current_bz_instance"),
	  githubEntry = document.querySelector("#gh_repo"),
	  githubSaved = document.querySelector("#current_gh_repo"),
	  jiraEntry = document.querySelector("#jira_instance"),
	  jiraSaved = document.querySelector("#current_jira_instance"),
	  submitButton = document.querySelector("button");
let message = document.getElementById("status");


function init(){
	submitButton.disabled = true;
}


function saveOptions(e) {
	let bzString = bugzillaEntry.value.trim() || '',
		ghString = githubEntry.value.trim() || '',
		jiraString = jiraEntry.value.trim() || '';
	// Save the entered values in local storage
	if (bzString != bugzillaSaved.value.trim()) {
		browser.storage.local.set({
			bugzilla: bzString
		});
	}
	if (ghString != githubSaved.value.trim()) {
		browser.storage.local.set({
			github: ghString
		});
	}
	if (jiraString != jiraSaved.value.trim()) {
		browser.storage.local.set({
			jira: jiraString
		});
	}
	submitButton.disabled = true;
	const checkvalues = [bzString.length, ghString.length, jiraString.length];
	const countvalues = checkvalues.filter(num => num > 0);
	rebuildMenus(bzString, ghString, jiraString, countvalues.length);
	e.preventDefault();
}


/*
Remove all menus so you can start over
*/
function rebuildMenus(bzS, ghS, jrS, cval) {
	if (debug) console.log('in rebuildMenus');
	let removing = browser.menus.removeAll();
	return removing.then(() => onRemoved(bzS, ghS, jrS, cval), onFailedRemove);
}


function onRemoved(bz, gh, jr, num) {
	displayMessage("Previous menus have been removed");
	createBugzillaMenu(bz, num);
	createGitHubMenu(gh, num);
	createJiraMenu(jr, num);
	setTimeout(() => {
		displayMessage("Menus have been updated");
	}, 500);
}


function onFailedRemove() {
	displayMessage("Error: previous menus have NOT been removed");
}


function displayMessage(text) {
	message.innerHTML = text;
	setTimeout(() => {
		message.innerHTML = "&nbsp;";
	}, 1000);
}


/*
Create Bugzilla Menu
*/
function createBugzillaMenu(val, count) {
	if (val.length) {
		if (count) {
			if (count == 1) {
				browser.menus.create({
					id: "bugme_bz",
					title: browser.i18n.getMessage("contextMenuItemB"),
					contexts: ["selection"],
					enabled: true,
				});
			} else {
				browser.menus.create({
					id: "bugme_bz",
					title: browser.i18n.getMessage("contextMenuItemB+"),
					contexts: ["selection"],
					enabled: true,
				});
			}
		}
	}
}


/*
Create Jira Menu
*/
function createJiraMenu(val, count) {
	if (val.length) {
		if (count) {
			if (count == 1) {
				browser.menus.create({
					id: "bugme_jira",
					title: browser.i18n.getMessage("contextMenuItemJ"),
					contexts: ["selection"],
					enabled: true,
				});
			} else {
				browser.menus.create({
					id: "bugme_jira",
					title: browser.i18n.getMessage("contextMenuItemJ+"),
					contexts: ["selection"],
					enabled: true,
				});
			}
		}
	}
}


/*
Create GitHub Menu
*/
function createGitHubMenu(val, count) {
	// GitHub is the only one that is stored as a markdown link [name](url), so parse the string
	if (val.length) {
		let ghMenus = [];
		let allGithub = val.split(/; ?/);
		let re = RegExp('\\[([^\\]]+)\\]\\(([^\\)]+)\\)', 'g');    // [name](url)
		for (let i=0; i<allGithub.length; i++) {
			let parsed;
			while ((parsed = re.exec(allGithub[i])) !== null) {
				ghMenus[i] = { name: parsed[1], url: parsed[2] };
			}
		}
		// if there's any error here, abort the menu creation and display a warning message
		for (let i=0; i<ghMenus.length; i++) {
			if (ghMenus[i] == undefined) {
				const err = new Error("GitHub entry syntax is wrong");
				displayMessage(err.message);
				throw err
				return;
			}
		}
		// ok, let's continue, set main menu based on whether there's one or more
		if (ghMenus.length == 1) {
			browser.menus.create({
				id: "bugme_gh",
				title: browser.i18n.getMessage("contextMenuItemG"),
				contexts: ["selection"],
				enabled: true,
			});
		} else {
			browser.menus.create({
				id: "bugme_gh",
				title: browser.i18n.getMessage("contextMenuItemG+"),
				contexts: ["selection"],
				enabled: true,
			});
		}
		// now create submenus if necessary
		if (ghMenus.length > 1) {
			for (let i=0; i<ghMenus.length; i++) {
				browser.menus.create({
						id: "bugme_gh-" + i,
						parentId: "bugme_gh",
						title: ghMenus[i].name,
						contexts: ["selection"],
						enabled: true,
					});
				}
		}
	}
}


function updateUI(restoredOptions) {
	let storageItemBugzilla = restoredOptions.bugzilla || "",
		storageItemGithub = restoredOptions.github || "",
		storageItemJira = restoredOptions.jira || "";
	if (storageItemBugzilla) {
		bugzillaSaved.setAttribute("value", storageItemBugzilla);
		bugzillaEntry.value = storageItemBugzilla;
	}
	if (storageItemGithub) {
		githubSaved.setAttribute("value", storageItemGithub);
		githubEntry.innerText = storageItemGithub;
	}
	if (storageItemJira) {
		jiraSaved.setAttribute("value", storageItemJira);
		jiraEntry.value = storageItemJira;
	}
	if (debug) console.log(`From local storage: storageItemBugzilla: ${storageItemBugzilla}\nstorageItemGithub: ${storageItemGithub}\nstorageItemJira: ${storageItemJira}`);
}


const loadSavedOptions = browser.storage.local.get();
loadSavedOptions.then(updateUI, onError);


function enableSave() {
	submitButton.disabled = false;
}


function onError(e) {
	console.error(e);
}


if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init);
} else {
	init();
}


document.querySelector("form").addEventListener("submit", saveOptions);
document.querySelector("form").addEventListener("change", enableSave);