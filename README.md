# bugme - Open selected bug IDs in Bugzilla, Jira, or GitHub
Web extension (written for Firefox) to open things-that-are-likely-bug/issue-numbers in Bugzilla, Jira, or GitHub.

This is a simple extension that provides the ability, via context menu, to open things that "look like" bug numbers in the selected text in the bug tracking system you choose, either as a single bug or as a group. In this context, "look like" means a regex match of 3-7 digits for Bugzilla, 1-7 for GitHub, and X-digits for Jira.

You can configure this to use any combination of: one Bugzilla source, one Jira source, and one or more GitHub repos.

This is useful for when someone has not linked a bug number in some context (which happens in my world a lot).
