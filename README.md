# tenhou-scorepane

## Scoring pane for tenhou

Plugin for Firefox, and Chrome - load in debugging mode.

Shows details of last hand, on right-hand side of screen.

Tested in 4p & 3p, firefox & chrome

Download [here](https://github.com/ApplySci/tenhou-scorepane/archive/master.zip)


## How to test the addon:

Unzip into a dedicated folder on your local machine.

In **Firefox**: paste this into your address bar: about:debugging#/runtime/this-firefox, and Load Temporary Add-on. Find the manifest.json file in the dedicated folder.

In **Chrome**: go to chrome://extensions/ . Switch Developer mode on (top-right corner). Then "Load unpacked". Then find the dedicated folder where you unzipped the github zip file

Then in a new window, load https://tenhou.net/3
 
The scoring pane works on game logs as well as live games. Stepping through the results in a game log is the easiest way to test this extension. Go to the start of the second hand, or later, and then go back one turn - that takes you to the end of the last hand.

# Please do contribute pull requests.

## TODO

- do a reward animation for first place, with an option screen to disable this

![screen](https://media.discordapp.net/attachments/712257404548415539/746298551226859531/unknown.png)

### THANKS

- Thank you to MariaL for the original idea.
- Thank you to GlassyMJ for being my first tester, and for the very helpful detective work

