import {MathQuill} from "./deps/mathquill/mathquill.min.js"
import {UfuzzyMin} from "./deps/ufuzzy/ufuzzy.min.js"

let codeMirror, view, keymap, kbCompartment;
let Prec = null;

function modulo(a, b) {
  return ((a % b) + b) % b
}

HTMLElement.prototype.htmlContent = function(html) {
  const dom = new DOMParser().parseFromString('<template>'+html+'</template>', 'text/html').head;
  this.appendChild(dom.firstElementChild.content);
}

// Get the bindings for the codemirror API
let getCodeMirror = new Promise(
  (resolve) => {
    const fallback = setTimeout(() => resolve(false), 1000);
    window.addEventListener( 'UNSTABLE_editor:extensions',
      (event)=>{
        clearTimeout(fallback);
        codeMirror = event.detail.CodeMirror;
        keymap = codeMirror.keymap;
        resolve(true);
      }, {once: true});
  });

function getView(){
  return new Promise( async (resolve)=>{
    if(!await getCodeMirror) {
      resolve(false);
      return;
    }
    view = codeMirror.EditorView.findFromDOM(document);
    let configInterval = setInterval(function(){
      if( view.state.config.base.length > 0 ) {
        resolve(true);
      }
      clearInterval(configInterval);
    }, 100);
  });
}

let shortcuts = [];

function bindFunction(shortcut, func){
  shortcuts.push( {key: shortcut.replace( /(ctrl|cmd)/i, 'mod' ), run: func} )
}

function getCommandWrapper(editorInstance) {
  const cursor = editorInstance?.__controller?.cursor;
  if(!cursor) return false;
  const wrapper = cursor?.parent?.parent;
  if(!wrapper) return false;
  return wrapper._el.classList.contains("mq-latex-command-input-wrapper") ? wrapper : false;
}

let closestCommands = []
let suggestionIndex = false;

function setResultHighlighted(index) {
  if(suggestionIndex !== false) closestCommands[suggestionIndex].element.classList.remove("active");
  if(index !== false) closestCommands[index].element.classList.add("active");
  suggestionIndex = index;
}
let editorShown = false;
let editorDiv;
let editorInstance;
let editorSelection = null;
let editorSelectionPrefix = "";
let editorSelectionSuffix = "";
let standaloneSelection = null;
let standaloneShortcutListenerAdded = false;

function getStandaloneSelection() {
  const activeElement = document.activeElement;
  if(activeElement && typeof activeElement.selectionStart === "number") {
    return {
      element: activeElement,
      from: activeElement.selectionStart,
      to: activeElement.selectionEnd,
      text: activeElement.value.slice(activeElement.selectionStart, activeElement.selectionEnd)
    };
  }

  const selection = window.getSelection();
  if(selection && selection.rangeCount > 0) {
    return {range: selection.getRangeAt(0).cloneRange(), text: selection.toString()};
  }
  return {text: ""};
}

function replaceStandaloneSelection(latex) {
  if(standaloneSelection?.element) {
    const element = standaloneSelection.element;
    element.focus();
    element.setRangeText(latex, standaloneSelection.from, standaloneSelection.to, "end");
    element.dispatchEvent(new Event("input", {bubbles: true}));
    return;
  }

  if(standaloneSelection?.range) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(standaloneSelection.range);
    if(document.execCommand) document.execCommand("insertText", false, latex);
  }
}

function splitMathDelimiters(latex) {
  const delimiters = [
    ["$", "$"],
    ["\\(", "\\)"],
    ["\\[", "\\]"]
  ];
  for(const [prefix, suffix] of delimiters) {
    if(latex.startsWith(prefix) && latex.endsWith(suffix) && latex.length >= prefix.length + suffix.length) {
      return {
        content: latex.slice(prefix.length, latex.length - suffix.length),
        prefix,
        suffix
      };
    }
  }
  return {content: latex, prefix: "", suffix: ""};
}

function removeEmptyIntegralBounds(latex) {
  const integralPattern = /\\int(?![a-zA-Z])/g;
  let result = "";
  let cursor = 0;
  let integral;

  while((integral = integralPattern.exec(latex)) !== null) {
    result += latex.slice(cursor, integral.index) + integral[0];
    let boundCursor = integralPattern.lastIndex;

    while(latex[boundCursor] === "_" || latex[boundCursor] === "^") {
      const openBrace = boundCursor + 1;
      if(latex[openBrace] !== "{") break;

      let depth = 1;
      let end = openBrace + 1;
      while(end < latex.length && depth > 0) {
        if(latex[end] === "{") depth++;
        if(latex[end] === "}") depth--;
        end++;
      }
      if(depth > 0) break;

      const content = latex.slice(openBrace + 1, end - 1);
      if(!/^(?:\s|\\ )*$/.test(content)) {
        result += latex.slice(boundCursor, end);
      }
      boundCursor = end;
    }

    cursor = boundCursor;
    integralPattern.lastIndex = boundCursor;
  }

  return result + latex.slice(cursor);
}

function findContainingMath(viewState, selection) {
  const documentText = viewState.doc.toString();
  const delimiterPairs = [
    ["\\[", "\\]"],
    ["\\(", "\\)"],
    ["$", "$"]
  ];

  for(const [prefix, suffix] of delimiterPairs) {
    const prefixStart = documentText.lastIndexOf(prefix, selection.from);
    const suffixStart = documentText.indexOf(suffix, selection.to);
    if(prefixStart === -1 || suffixStart === -1 || prefixStart >= suffixStart) continue;
    if(prefix === "$" && documentText[prefixStart - 1] === "\\") continue;
    return {
      from: prefixStart,
      to: suffixStart + suffix.length,
      latex: documentText.slice(prefixStart, suffixStart + suffix.length)
    };
  }
  return null;
}

function isVisible(element) {
  return element && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
}

function focusPopupEditor() {
  const activeElement = document.activeElement;
  const activePopup = activeElement?.closest("[role='dialog'], .modal, .popup, .popover");
  if(activeElement && (activeElement.closest(".mq-editable-field") || (activePopup && activeElement.matches("textarea, input, [contenteditable='true']")))) {
    activeElement.focus();
    return true;
  }

  const popup = document.querySelector("[role='dialog'], .modal, .popup, .popover");
  if(!isVisible(popup)) return false;
  const mathField = popup.querySelector(".mq-editable-field");
  if(mathField) {
    const mathFieldApi = MathQuill.getInterface(3).MathField(mathField);
    mathFieldApi.focus();
    return true;
  }
  const editor = popup.querySelector("textarea, input, [contenteditable='true']");
  if(editor) {
    editor.focus();
    return true;
  }
  return false;
}

function setupMathQuill() {

  editorDiv = document.createElement('div');
  editorDiv.id = "editorDiv";
  const mathSpan = document.createElement('span');
  mathSpan.id = "mq-editor-field";

  editorDiv.appendChild(mathSpan);
  document.body.appendChild(editorDiv);
  editorDiv.style.display = "none"

  const editorSpan = document.getElementById('mq-editor-field');
  const MQ = MathQuill.getInterface(3);
  /**
   * The list of all LatexCmds and EvironmentCmds
   * @type string[]
   */
  let registeredCommands = [];
  let maxResultCount = 8
  editorInstance = MQ.MathField(editorSpan, {
    spaceBehavesLikeTab: false,
    restrictMismatchedBrackets: false,
    autoCommands:
      "alpha beta sqrt theta phi rho pi tau nthroot cbrt sum prod integral percent infinity infty cross ans frac int gamma Gamma delta Delta epsilon zeta eta Theta iota kappa lambda Lambda mu Xi xi Pi sigma Sigma upsilon Upsilon Phi chi psi Psi omega Omega",
    charsThatBreakOutOfSupSub: "",
    handlers: {
      "edit": function() {
        closestCommands = [];
        suggestionIndex = false;
        const commandWrapper = getCommandWrapper(editorInstance);
        if(commandWrapper) {
          if(!commandWrapper.overquillFix) {

            const resultsDiv = document.createElement('div');
            resultsDiv.id = "resultsDiv";
            commandWrapper._el.firstChild.appendChild(resultsDiv);
            commandWrapper.resultsDiv = resultsDiv;

            commandWrapper.overquillFix = true;
            const endsL = commandWrapper.getEnd(-1);
            let originalLatex = endsL.latex;
            endsL.latex = function() {
              return suggestionIndex === false ? originalLatex.call(endsL) : closestCommands[suggestionIndex].text;
            }
            let originalKeystroke = endsL.keystroke;
            endsL.keystroke = function (key, e, ctrlr) {
              if(key === 'Tab' && closestCommands.length > 0 && suggestionIndex === false) suggestionIndex = 0;
              originalKeystroke.call(endsL, key, e, ctrlr);
            }
          }
          const resultsDiv = commandWrapper.resultsDiv;
          resultsDiv.replaceChildren()
          const text = commandWrapper.text()
          if(text.length > 1) {
            const partialCommand = text.slice(1);
            let ufuzzy = new UfuzzyMin();

            let idxs = ufuzzy.filter(registeredCommands, partialCommand);
            let info = ufuzzy.info(idxs, registeredCommands, partialCommand);
            let order = ufuzzy.sort(info, registeredCommands, partialCommand);

            const mark = (part, matched) => matched ? '<b>' + part + '</b>' : part;
            const shownResultsCount = Math.min(maxResultCount, order.length);
            for (let i = 0; i < shownResultsCount; i++) {
              let infoIdx = order[i];
              const command = registeredCommands[info.idx[infoIdx]]
              const resultSpan = document.createElement("span");
              resultSpan.id = "result-" + i;
              resultSpan.classList.add("resultSpan")
              resultSpan.htmlContent( UfuzzyMin.highlight(registeredCommands[info.idx[infoIdx]], info.ranges[infoIdx], mark));
              resultSpan.addEventListener("click", ()=> {
                suggestionIndex = i;
                commandWrapper.renderCommand(editorInstance.__controller.cursor);
              },{once: true});
              resultSpan.addEventListener("pointerdown", function(e) {
                // Prevent MathQuill from moving cursor for button clicks
                e.preventDefault();
              }, false)
              resultsDiv.appendChild(resultSpan);
              closestCommands.push({text:command, element: resultSpan});
            }
          }
        }
      }
    }
  })

  registeredCommands = editorInstance.getCommandKeys();

  editorSpan.addEventListener("keydown", function(event) {
    if(!editorShown) return;
    const isReturn = event.key === "Enter";
    const isEscape = event.key === "Escape";
    if(isReturn || isEscape) {
      event.preventDefault();
      event.stopPropagation();
      if(isReturn) {
        const latex = editorSelectionPrefix
          + removeEmptyIntegralBounds(editorInstance.latex())
          + editorSelectionSuffix;
        if(view) {
          view.dispatch({
            changes: {from: editorSelection.from, to: editorSelection.to, insert: latex},
            selection: {anchor: editorSelection.from + latex.length}
          });
        } else {
          replaceStandaloneSelection(latex);
        }
      }
      editorInstance.latex("");
      editorSelection = null;
      editorSelectionPrefix = "";
      editorSelectionSuffix = "";
      editorShown = false;
      editorDiv.style.display = "none";
      if(view) view.focus();
      return false;
    }
    if(event.metaKey || event.ctrlKey) {
      if(event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();
        editorInstance.matrixCmd("addRow", -1);
        return false;
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation()
        editorInstance.matrixCmd('deleteRow');
        return false;
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation()
        editorInstance.matrixCmd('addColumn', -1);
        return false;
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation()
        editorInstance.matrixCmd('deleteColumn');
        return false;
      }
    } else {
      if(closestCommands.length > 0) {
        if(event.key === "ArrowUp") {
          event.preventDefault();
          event.stopPropagation();
          if(suggestionIndex !== false) {
            setResultHighlighted(modulo(suggestionIndex - 1, closestCommands.length));
          } else {
            setResultHighlighted(0);
          }

          return false;
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          event.stopPropagation()
          if(suggestionIndex !== false) {
            setResultHighlighted(modulo(suggestionIndex + 1, closestCommands.length));
          } else {
            setResultHighlighted(0);
          }

          return false;
        }
      }
    }
  }, false);
}

function loadShortcuts(shortcuts){
  const openEditor = function() {
    if(focusPopupEditor()) return true;
    if(!editorShown) {
      let selectedLatex;
      if(view) {
        const currentSelection = view.state.selection.main;
        const containingMath = currentSelection.from !== currentSelection.to
          ? findContainingMath(view.state, currentSelection)
          : null;
        editorSelection = containingMath || currentSelection;
        selectedLatex = splitMathDelimiters(view.state.sliceDoc(editorSelection.from, editorSelection.to));
      } else {
        standaloneSelection = getStandaloneSelection();
        selectedLatex = splitMathDelimiters(standaloneSelection.text);
      }
      editorSelectionPrefix = selectedLatex.prefix;
      editorSelectionSuffix = selectedLatex.suffix;
      editorInstance.latex(selectedLatex.content);
    }
    editorShown = editorShown === false;
    editorDiv.style.display = editorShown ? "" : "none";
    editorInstance.focus();
    return true;
  };
  if(view) {
    bindFunction(shortcuts.openEditor, openEditor);
  } else if(!standaloneShortcutListenerAdded) {
    standaloneShortcutListenerAdded = true;
    document.addEventListener("keydown", function(event) {
      const shortcut = shortcuts[0]?.key.toLowerCase().split("-") || [];
      const key = shortcut.pop();
      const modifier = (name, pressed) => shortcut.includes(name) === pressed;
      const usesMod = shortcut.includes("mod");
      if(event.key.toLowerCase() === key &&
        modifier("alt", event.altKey) &&
        modifier("shift", event.shiftKey) &&
        modifier("ctrl", usesMod ? false : event.ctrlKey) &&
        modifier("cmd", usesMod ? false : event.metaKey) &&
        (!usesMod || event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        shortcuts[0].run();
      }
    });
  }
}

getCodeMirror.then( (hasCodeMirror)=>{
  if(!hasCodeMirror) {
    setupMathQuill();
    document.addEventListener('overquill_config_send', (e)=> {
      shortcuts = [];
      loadShortcuts(e.detail.overquill_config.shortcuts);
    });
    document.dispatchEvent(new CustomEvent('overquill_config_listen'));
    return;
  }
  let kbCompartmentLoad = getView().then(()=> {
      let oldCompartment = view.state.config.compartments.keys().next();
      kbCompartment = oldCompartment.value.of(keymap.of([]));
      kbCompartment.compartment =  new oldCompartment.value.constructor;

      function getPrec(configBase){
        if(Array.isArray(configBase)) {
          for(const child of configBase.values() ){
            getPrec(child)
            if(Prec !== null) return;
          }
        } else {
          if("prec" in configBase) {
            Prec = configBase.constructor;
          }
        }
      }
      getPrec(view.state.config.base);
    });

  document.addEventListener('overquill_config_send', (e)=> {
    const settings = e.detail.overquill_config;
    shortcuts = [];
    loadShortcuts(settings.shortcuts);
    view.dispatch({
      effects: kbCompartment.compartment.reconfigure(
        codeMirror.Prec.highest(keymap.of(shortcuts))
      )
    });
  });

  function prepareForShortcuts(){
    getView()
      .then(()=> {return kbCompartmentLoad})
      .then(() => {
        view.dispatch({effects: codeMirror.StateEffect.appendConfig.of([kbCompartment])});
        setupMathQuill();
        document.dispatchEvent(new CustomEvent('overquill_config_listen'));
      });
  }

  prepareForShortcuts();
  window.addEventListener( 'doc:after-opened', prepareForShortcuts );
});

// Fix shortcuts with dead keys, by intercepting when pressed and relaying if space is pressed.
window.addEventListener('load', function() {
  document.addEventListener('keydown', (deadEvent) => {
    if (deadEvent.key === 'Dead') {
      document.addEventListener('keydown', spaceEvent => {
          if (spaceEvent.code === 'Space') {
            const init = {code: deadEvent.code, key: spaceEvent.key, altKey: deadEvent.altKey, cancelable: true}
            let reformattedEvent = new KeyboardEvent('keydown', init);
            if (!spaceEvent.target.dispatchEvent(reformattedEvent)) spaceEvent.preventDefault()
          }
        }, {once: true}
      );
    }
  });
});
