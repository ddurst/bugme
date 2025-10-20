'use strict'

let debug = false;


function onError(e) {
	console.error(`bugme error: ${e}`);
}


/*
The click event listener
*/
browser.menus.onClicked.addListener((info, tab) => {
	if (debug) console.log('in onClicked');

	const loadSavedSettings = browser.storage.local.get();
	loadSavedSettings.then(clickEvent, onError);

//	if (debug) console.log(`onClicked: \n\tbzString: ${bzString}\n\tghString: ${ghString}\n\tjiraString: ${jiraString}\n`);
	// handle the click appropriately
	function clickEvent(restoredSettings) {
		/* Don't capture numbers from yyyy-mm-dd, but 
			 BMO has open bugs matching \d{3}. */
		let reJIRA = RegExp('([A-Z][A-Z0-9\-]+-\\d{1,6})', 'g'); // XYZ-# or X-X-# etc
		let reGH = RegExp('((?!\\d{4}-\\d{2}-\\d{2})\\d{1,7})', 'g'); // #######
		let reBZ = RegExp('((?!\\d{4}-\\d{2}-\\d{2})\\d{3,7})', 'g'); // ####
		switch (info.menuItemId) {
			case "bugme_bz":
				// bugzilla selected
				if (restoredSettings.bugzilla) {
					var bugnums = [],
							temp,
							url=restoredSettings.bugzilla;
					while ((temp = reBZ.exec(info.selectionText)) !== null) {
						if (bugnums.indexOf(temp[0]) < 0) {
							bugnums.push(temp[0]);
						}
					}
					if (bugnums.length > 0) {
						function onError(error) {
							console.log(`BZ error: ${error}`);
						}
						function insertTab(tabs) {
							for (let tab of tabs) {
								var newIndex = tab.index + 1;
								browser.tabs.create({url: `${url}`, index: newIndex});
							}
						}
						switch (bugnums.length) {
							case 1:
								url += `show_bug.cgi?id=${bugnums[0]}`;
								break;
							default:
								url += `buglist.cgi?bug_id=${bugnums.join(',')}`;
								break;
						}
						var queryTabs = browser.tabs.query({currentWindow: true, active: true});
						queryTabs.then(insertTab, onError);
					}
				}
				break;
			case "bugme_jira":
				// jira selected
				if (restoredSettings.jira) {
					var jirakeys = [],
							temp,
							url=restoredSettings.jira;
					while ((temp = reJIRA.exec(info.selectionText)) !== null) {
						if (jirakeys.indexOf(temp[0]) < 0) {
							jirakeys.push(temp[0]);
						}
					}
					if (jirakeys.length > 0) {
						function onError(error) {
							console.log(`Jira error: ${error}`);
						}
						function insertTab(tabs) {
							for (let tab of tabs) {
								var newIndex = tab.index + 1;
								browser.tabs.create({url: `${url}`, index: newIndex});
							}
						}
						switch (jirakeys.length) {
							case 1:
								url += `browse/${jirakeys[0]}`;
								break;
							default:
								url += `issues/?jql=key IN (${jirakeys.join('%2C')})&oldView=true`;
								break;
						}
						var queryTabs = browser.tabs.query({currentWindow: true, active: true});
						queryTabs.then(insertTab, onError);
					}
				}
				break;
			default:
				/* Handle cases where submenu items of GH are clicked, which should be the only case left */
				if (restoredSettings.github) {
					var issues = [],
						temp,
						i = parseInt(info.menuItemId.split('-')[1], 10);
					// GitHub is the only one that is stored as a markdown link [name](url), so parse the string
					let ghSubmenus = [];
					let allGithub = restoredSettings.github.split(/; ?/);
					let re = RegExp('\\[([^\\]]+)\\]\\(([^\\)]+)\\)', 'g');    // [name](url)
					for (let i=0; i<allGithub.length; i++) {
						let parsed;
						while ((parsed = re.exec(allGithub[i])) !== null) {
							ghSubmenus[i] = { name: parsed[1], url: parsed[2] };
						}
					}
					// Now we can locate the menu index clicked
					// But it could've been the parent or it could've been a child
					let url;
					if (ghSubmenus.length == 1 && info.menuItemId == "bugme_gh") {
						url = ghSubmenus[0].url;
					} else if (info.parentMenuItemId == "bugme_gh") {
						let which = parseInt(info.menuItemId.split('-')[1]);
						url = ghSubmenus[which].url;
					}
					if (url.slice(-1) != "/") { // ensure terminating /
						url += "/";
					}
					while ((temp = reGH.exec(info.selectionText)) !== null) {
						if (issues.indexOf(temp[0]) < 0) {
							issues.push(temp[0]);
						}
					}
					if (issues.length > 0) {
						function onError(error) {
							console.log(`GH error: ${error}`);
						}
						function insertTab(tabs) {
							for (let tab of tabs) {
								var newIndex = tab.index + 1;
								browser.tabs.create({url: `${url}`, index: newIndex});
							}
						}
						switch (issues.length) {
							case 1:
								url += `issues/${issues[0]}`;
								break;
							default:
								url += `issues?utf8=✓&q=is%3Aissue+${issues.join('+')}`;
								break;
						}
						var queryTabs = browser.tabs.query({currentWindow: true, active: true});
						queryTabs.then(insertTab, onError);
					}
				}
				break;
			}
		}
});
