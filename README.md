<img src="src/icon128.png" alt="Eagler Mobile Logo" align="left" width="63px"></img>
# VerQuill

#### Interactive LaTeX editing in Overleaf, using a custom build of MathQuill

[![Chrome Web Store](.github/readme-images/chrome-extension-badge.png)](https://chrome.google.com/webstore/detail/fdopniggnnohabdneopllnpfddhahlon)
[![Firefox Add-ons](.github/readme-images/firefox-addon-badge.png)](https://addons.mozilla.org/firefox/addon/overquill/)
[![Edge Add-ons](.github/readme-images/edge-addon-badge.png)](https://microsoftedge.microsoft.com/addons/detail/overquill/hojkmogkcdknaniidgimcpgiincngknh)


[![](https://img.shields.io/chrome-web-store/v/fdopniggnnohabdneopllnpfddhahlon?style=flat-square&logo=google-chrome&logoColor=white&label=Chrome&color=E23A2E)](https://chrome.google.com/webstore/detail/fdopniggnnohabdneopllnpfddhahlon)
[![](https://img.shields.io/amo/v/overquill?style=flat-square&logo=firefox-browser&logoColor=white&label=Firefox&color=FF7139)](https://addons.mozilla.org/firefox/addon/overquill/)
[![](https://img.shields.io/badge/dynamic/json?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTIxLjg2IDE3Ljg2cS4xNCAwIC4yNS4xMi4xLjEzLjEuMjV0LS4xMS4zM2wtLjMyLjQ2LS40My41My0uNDQuNXEtLjIxLjI1LS4zOC40MmwtLjIyLjIzcS0uNTguNTMtMS4zNCAxLjA0LS43Ni41MS0xLjYuOTEtLjg2LjQtMS43NC42NHQtMS42Ny4yNHEtLjkgMC0xLjY5LS4yOC0uOC0uMjgtMS40OC0uNzgtLjY4LS41LTEuMjItMS4xNy0uNTMtLjY2LS45Mi0xLjQ0LS4zOC0uNzctLjU4LTEuNi0uMi0uODMtLjItMS42NyAwLTEgLjMyLTEuOTYuMzMtLjk3Ljg3LTEuOC4xNC45NS41NSAxLjc3LjQxLjgyIDEuMDIgMS41LjYuNjggMS4zOCAxLjIxLjc4LjU0IDEuNjQuOS44Ni4zNiAxLjc3LjU2LjkyLjIgMS44LjIgMS4xMiAwIDIuMTgtLjI0IDEuMDYtLjIzIDIuMDYtLjcybC4yLS4xLjItLjA1em0tMTUuNS0xLjI3cTAgMS4xLjI3IDIuMTUuMjcgMS4wNi43OCAyLjAzLjUxLjk2IDEuMjQgMS43Ny43NC44MiAxLjY2IDEuNC0xLjQ3LS4yLTIuOC0uNzQtMS4zMy0uNTUtMi40OC0xLjM3LTEuMTUtLjgzLTIuMDgtMS45LS45Mi0xLjA3LTEuNTgtMi4zM1QuMzYgMTQuOTRRMCAxMy41NCAwIDEyLjA2cTAtLjgxLjMyLTEuNDkuMzEtLjY4LjgzLTEuMjMuNTMtLjU1IDEuMi0uOTYuNjYtLjQgMS4zNS0uNjYuNzQtLjI3IDEuNS0uMzkuNzgtLjEyIDEuNTUtLjEyLjcgMCAxLjQyLjEuNzIuMTIgMS40LjM1LjY4LjIzIDEuMzIuNTcuNjMuMzUgMS4xNi44My0uMzUgMC0uNy4wNy0uMzMuMDctLjY1LjIzdi0uMDJxLS42My4yOC0xLjIuNzQtLjU3LjQ2LTEuMDUgMS4wNC0uNDguNTgtLjg3IDEuMjYtLjM4LjY3LS42NSAxLjM5LS4yNy43MS0uNDIgMS40NC0uMTUuNzItLjE1IDEuMzh6TTExLjk2LjA2cTEuNyAwIDMuMzMuMzkgMS42My4zOCAzLjA3IDEuMTUgMS40My43NyAyLjYyIDEuOTMgMS4xOCAxLjE2IDEuOTggMi43LjQ5Ljk0Ljc2IDEuOTYuMjggMSAuMjggMi4wOCAwIC44OS0uMjMgMS43LS4yNC44LS42OSAxLjQ4LS40NS42OC0xLjEgMS4yMi0uNjQuNTMtMS40NS44OC0uNTQuMjQtMS4xMS4zNi0uNTguMTMtMS4xNi4xMy0uNDIgMC0uOTctLjAzLS41NC0uMDMtMS4xLS4xMi0uNTUtLjEtMS4wNS0uMjgtLjUtLjE5LS44NC0uNS0uMTItLjA5LS4yMy0uMjQtLjEtLjE2LS4xLS4zMyAwLS4xNS4xNi0uMzUuMTYtLjIuMzUtLjUuMi0uMjguMzYtLjY4LjE2LS40LjE2LS45NSAwLTEuMDYtLjQtMS45Ni0uNC0uOTEtMS4wNi0xLjY0LS42Ni0uNzQtMS41Mi0xLjI4LS44Ni0uNTUtMS43OS0uODktLjg0LS4zLTEuNzItLjQ0LS44Ny0uMTQtMS43Ni0uMTQtMS41NSAwLTMuMDYuNDVULjk0IDcuNTVxLjcxLTEuNzQgMS44MS0zLjEzIDEuMS0xLjM4IDIuNTItMi4zNVE2LjY4IDEuMSA4LjM3LjU4cTEuNy0uNTIgMy41OC0uNTJaIiBzdHlsZT0iZmlsbDojZmZmIi8+PC9zdmc+&label=Edge&prefix=v&color=067FD8&query=%24.version&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Fhojkmogkcdknaniidgimcpgiincngknh)](https://microsoftedge.microsoft.com/addons/detail/overquill/hojkmogkcdknaniidgimcpgiincngknh)


[![](https://img.shields.io/github/v/release/FlamedDogo99/OverQuill?style=flat-square&logo=github&logoColor=white&label=GitHub&color=181717)](https://github.com/FlamedDogo99/OverQuill/releases)
[![](https://img.shields.io/github/license/FlamedDogo99/OverQuill?style=flat-square)](https://github.com/FlamedDogo99/OverQuill/blob/master/LICENSE)

## Keyboard Shortcuts
<b>Open Editor:</b> <kbd>Alt + t</kbd> - Open the in-editor MathQuill editor; highlighted LaTeX is loaded for editing
 - Must be editing inside the Overleaf code editor 
 - Shortcut can be configured in the extension's options menu

<b>LaTeX Command:</b> <kbd>\\</kbd> - Invoke one of MathQuill's LaTeX commands
 - Must be editing inside the MathQuill editor
 - Suggestions will be displayed below the editor for all registered LaTeX commands and Environment commands

<b>Add Matrix Row:</b> <kbd>Command + Up Arrow</kbd> - Add a row to the current Matrix
- Must be editing inside the MathQuill editor and inside a matrix environment

<b>Add Matrix Column:</b> <kbd>Command + Right Arrow</kbd> - Add a column to the current Matrix
- Must be editing inside the MathQuill editor and inside a matrix environment

<b>Remove Matrix Row:</b> <kbd>Command + Down Arrow</kbd> - Remove a row to the current Matrix
- Must be editing inside the MathQuill editor and inside a matrix environment

<b>Add Matrix Column:</b> <kbd>Command + Left Arrow</kbd> - Remove a column to the current Matrix
- Must be editing inside the MathQuill editor and inside a matrix environment

<b>Use Suggested LaTeX Command:</b> <kbd>Tab</kbd> - Call a suggested LaTeX command 
- Must be editing inside the MathQuill editor and writing a command
- By default, the first suggestion will be used to complete the command
- Other suggestions can be navigated through with <kbd>Up Arrow</kbd> and <kbd>Down Arrow</kbd>, or by mouse
- If no suggestions exist, it will default to MathQuill's default behavior

<b>Use Written LaTeX Command:</b> <kbd>Space</kbd> - Call the LaTeX command without suggestions
- Must be editing inside the MathQuill editor and writing a command
- Uses MathQuill's default behavior for LaTeX commands

<b>Insert LaTeX Into Overleaf</b> <kbd>Return</kbd> - Insert LaTeX into the Overleaf document
- Must be editing inside the MathQuill editor

<b>Exit Editor</b> <kbd>Escape</kbd> - Exit the MathQuill Editor
- Must be editing inside the MathQuill editor
- Any LaTeX written inside the editor will be discarded

## Credits

- [MathQuill Interactive Tweaks](https://github.com/FlamedDogo99/mathquill/tree/interactive-tweaks) - A fork of MathQuill used for [MathQuill Interactive](https://flameddogo99.github.io/Mathquill-Ineractive/)
- [uFuzzy](https://github.com/leeoniya/uFuzzy) - A tiny, efficient fuzzy search that doesn't suck
  - Fuzzy searching used for suggesting LaTeX commands
- [Shortleaf](https://github.com/andre-al/shortleaf) - Chrome browser extension that adds customizable keyboard shortcuts to the Overleaf online latex editor
  - Shortleaf is the original project that this was built from
- [markdown-to-html-github-style](https://github.com/KrauseFx/markdown-to-html-github-style)
  - Used for creating the instructions page

## License

OverQuill is licensed under the terms of the MIT license.

