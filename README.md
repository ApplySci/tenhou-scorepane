# tenhou-scorepane

## Scoring pane for tenhou

Plugin for Firefox, and Chrome - load in debugging mode.

Shows details of last hand, on right-hand side of screen.

It really doesn't like the screen being resized while tenhou is loaded.

Tested in 4p & 3p, firefox & chrome

Download [here](https://github.com/ApplySci/tenhou-scorepane/archive/master.zip)


## How to test the addon:

Unzip into a dedicated folder on your local machine.

In **Firefox**: paste this into your address bar: about:debugging#/runtime/this-firefox, and Load Temporary Add-on. Find the manifest.json file in the dedicated folder. Then in a new window, load https://tenhou.net/3

In **Chrome**: go to chrome://extensions/ . Switch Developer mode on (top-right corner). Then "Load unpacked". Then find the dedicated folder where you unzipped the github zip file

The scoring pane works on game logs as well as live games. Stepping through the results in a game log is the easiest way to test this extension. Go to the start of the second hand, or later, and then go back one turn - that takes you to the end of the last hand.

# Please do contribute pull requests.

## TODO

- test yakuman
- hook into screen resizing event; and resize score pane accordingly