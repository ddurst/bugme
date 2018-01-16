'use strict'

/*
Called when the item has been created, or when creation failed due to an error.
We'll just log failure here.
*/
function onCreated() {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  }
}

/*
Create the context menu item

NOTE: the context click is on the selection, so the selectionText is via menus.OnClickData
*/
browser.menus.create({
  id: "bugme",
  title: browser.i18n.getMessage("contextMenuItem"),
  contexts: ["selection"]
}, onCreated);

/*
The click event listener
*/
browser.menus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "bugme":
      var bugnums = [],
          temp,
          i=0,
          url='https://bugzilla.mozilla.org/',
          re = RegExp('(\\d{4,7})','g');
      while ((temp = re.exec(info.selectionText)) !== null) {
        bugnums.push(temp[0]);
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
      break;
  }
});