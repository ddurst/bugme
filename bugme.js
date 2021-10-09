'use strict'

let repostring = '', 
    projectstring = '',
    ghSubmenus = [],
    jiraSubmenus = [];

//browser.runtime.onStartup.addListener(loadOptions);

function handleMessage(request, sender, sendResponse) {
  if (sender.url != browser.runtime.getURL("/options.html")) {
    console.log("whoops");
    return;
  }
//  console.log("removing");
  removeSubmenus();
//  console.log("reloading");
  reloadOptions();
}

browser.runtime.onMessage.addListener(handleMessage);

/*
Load options data and populate repostring
*/
function loadOptions() {
  let gettingItemRepo = browser.storage.local.get('repos'),
      gettingItemProject = browser.storage.local.get('projects');
  gettingItemRepo.then((res) => {
    repostring = res.repos || '';
//    console.log(`repostring follows: ${repostring}`);
    if (repostring.length) {
      recreateMenu();
      createSubmenus();
    }
  });
  gettingItemProject.then((res) => {
    projectstring = res.projects || '';
//    console.log(`projectstring follows: ${projectstring}`);
    if (projectstring.length) {
      recreateMenu();
      createSubmenus();
    }
  });
}


function reloadOptions() {
  loadOptions();
}


/*
Called when the item has been created, or when creation failed due to an error.
We'll just log failure here.
*/
/*
function onCreated() {
  if (browser.runtime.lastError) {
    console.log(`Bugme error: ${browser.runtime.lastError}`);
  }
}
*/

/*
Remove all submenus because the options may redefine them
*/
function removeSubmenus() {
  browser.menus.remove("bugme");
  browser.menus.remove("bugme_gh");
  for (var i=0; i<ghSubmenus.length; i++) {
    browser.menus.remove("bugme_gh-" + i);
  };
  browser.menus.remove("bugme_jira");
  for (var i=0; i<jiraSubmenus.length; i++) {
    browser.menus.remove("bugme_jira-" + i);
  };
}


/*
Create the context menu item

NOTE: the context click is on the selection, so the selectionText is via menus.OnClickData
*/
function createMenu() {
  browser.menus.create({
    id: "bugme",
    title: browser.i18n.getMessage("contextMenuItem"),
    contexts: ["selection"]
  });
}


/*
Re-create the context menu item when there's github options too
*/
function recreateMenu() {
  browser.menus.create({
    id: "bugme",
    title: browser.i18n.getMessage("contextMenuItem1"),
    contexts: ["selection"]
  });
}


/*
Create submenu if options are set
*/
function createSubmenus() {
  // github repos
  browser.menus.create({
    id: "bugme_gh",
    title: browser.i18n.getMessage("contextMenuItem2"),
    contexts: ["selection"]
  });
  let subitems = repostring.split(/; ?/);
  let re = RegExp('\\[([^\\]]+)\\]\\(([^\\)]+)\\)', 'g');    // [name](url)
  for (let i=0; i<subitems.length; i++) {
    let options;
    while ((options = re.exec(subitems[i])) !== null) {
      ghSubmenus[i] = { name: options[1], url: options[2] };
      browser.menus.create({
        id: "bugme_gh-" + i,
        parentId: "bugme_gh",
        title: options[1],
        contexts: ["selection"]
      });
    };
  };
  // jira projects
  browser.menus.create({
    id: "bugme_jira",
    title: browser.i18n.getMessage("contextMenuItem3"),
    contexts: ["selection"]
  });
  subitems = projectstring.split(/; ?/);
  re = RegExp('\\[([^\\]]+)\\]\\(([^\\)]+)\\)', 'g');    // [name](url)
  for (let i=0; i<subitems.length; i++) {
    let options;
    while ((options = re.exec(subitems[i])) !== null) {
      jiraSubmenus[i] = { name: options[1], url: options[2] };
      browser.menus.create({
        id: "bugme_jira-" + i,
        parentId: "bugme_jira",
        title: options[1],
        contexts: ["selection"]
      });
    };
  };
}


loadOptions();
createMenu();

/*
The click event listener
*/
browser.menus.onClicked.addListener((info, tab) => {
  let reJIRA = RegExp('((?!\\d{4}-\\d{2}-\\d{2})[A-Z]{3,}-\\d{1,5})', 'g'); // XYZ-#
  let reGH = RegExp('((?!\\d{4}-\\d{2}-\\d{2})\\d{1,7})', 'g'); // #######
  let reBMO = RegExp('((?!\\d{4}-\\d{2}-\\d{2})\\d{3,7})', 'g'); // ####
  if (info.menuItemId == "bugme") {
    /* Don't capture numbers from yyyy-mm-dd, but 
       there are open bugs matching \d{3}. */
    var bugnums = [],
        temp,
        url='https://bugzilla.mozilla.org/';
    while ((temp = reBMO.exec(info.selectionText)) !== null) {
      if (bugnums.indexOf(temp[0]) < 0) {
        bugnums.push(temp[0]);
      }
    }
    if (bugnums.length > 0) {
      function onError(error) {
        console.log(`Error: ${error}`);
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
  } else {
    if (info.parentMenuItemId == "bugme_jira") {
    /* Handle cases where submenu items of Jira are clicked */
    /* Don't capture numbers from yyyy-mm-dd, but
       Jira keys can be as small as \d{1}, though they 
       should all be preceded by [A-Z]{3,}-. */
       // you are here
      var issues = [],
          temp,
          i = parseInt(info.menuItemId.split('-')[1], 10);
      var url = submenus[i].url;
      if (url.slice(-1) != "/") { // terminating /
        url += "/";
      }
      while ((temp = reJIRA.exec(info.selectionText)) !== null) {
        if (issues.indexOf(temp[0]) < 0) {
          issues.push(temp[0]);
        }
      }
      if (issues.length > 0) {
        function onError(error) {
          console.log(`Error: ${error}`);
        }
        function insertTab(tabs) {
          for (let tab of tabs) {
            var newIndex = tab.index + 1;
            browser.tabs.create({url: `${url}`, index: newIndex});
          }
        }
        switch (issues.length) {
          case 1:
            console.log("case 1");
            url += // you are here
        }
      }
    }
    if (info.parentMenuItemId == "bugme_gh") {
    /* Handle cases where submenu items of GH are clicked */
    /* Don't capture numbers from yyyy-mm-dd, but
       GH bugs can be as small as \d{3} (for repos 
       that have been around a while. */
      var issues = [],
          temp,
          i = parseInt(info.menuItemId.split('-')[1], 10);
      var url = submenus[i].url;
      if (url.slice(-1) != "/") { // terminating /
        url += "/";
      }
      while ((temp = reGH.exec(info.selectionText)) !== null) {
        if (issues.indexOf(temp[0]) < 0) {
          issues.push(temp[0]);
        }
      }
      if (issues.length > 0) {
        function onError(error) {
          console.log(`Error: ${error}`);
        }
        function insertTab(tabs) {
          for (let tab of tabs) {
            var newIndex = tab.index + 1;
            browser.tabs.create({url: `${url}`, index: newIndex});
          }
        }
        switch (issues.length) {
          case 1:
            console.log("case 1");
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
  }
});
