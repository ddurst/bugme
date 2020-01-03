'use strict'

var repostring = '', submenus = [];

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
  var gettingItem = browser.storage.local.get('repos');
  gettingItem.then((res) => {
    repostring = res.repos || '';
//    console.log("repostring follows:");
//    console.log(repostring);
    if (repostring.length) {
      recreateMenu();
      createSubmenus();
    }
  });
//  repostring = "[Monitor](https://github.com/mozilla/blurts-server/); [Lockwise Android](https://github.com/mozilla-lockwise/lockwise-android/); [Lockwise iOS](https://github.com/mozilla-lockwise/lockwise-ios/)";
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
  for (var i=0; i<submenus.length; i++) {
    browser.menus.remove("bugme_gh-" + i);
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
    browser.menus.create({
      id: "bugme_gh",
      title: browser.i18n.getMessage("contextMenuItem2"),
      contexts: ["selection"]
    });
    var subitems = repostring.split(/; ?/);
    var re = RegExp('\\[([^\\]]+)\\]\\(([^\\)]+)\\)', 'g');    // [name](url)
    for (var i=0; i<subitems.length; i++) {
      var options;
      while ((options = re.exec(subitems[i])) !== null) {
        submenus[i] = { name: options[1], url: options[2] };
        browser.menus.create({
          id: "bugme_gh-" + i,
          parentId: "bugme_gh",
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
  var reBMO = RegExp('((?!\\d{3,4}-\\d{2}-\\d{2})\\d{4,7})', 'g');
  var reGH = RegExp('((?!\\d{3,4}-\\d{2}-\\d{2})\\d{1,7})', 'g');
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
