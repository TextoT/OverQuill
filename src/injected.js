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
    window.addEventListener( 'UNSTABLE_editor:extensions',
      (event)=>{
        codeMirror = event.detail.CodeMirror;
        keymap = codeMirror.keymap;
        resolve();
      }, {once: true});
  });

function getView(){
  return new Promise( async (resolve)=>{
    await getCodeMirror;
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
      isReturn && view.dispatch(view.state.replaceSelection(editorInstance.latex()));
      editorInstance.latex("");
      editorShown = false;
      editorDiv.style.display = "none";
      view.focus()
      return false;
    }
    if(event.metaKey || event.ctrlKey) {
      if(event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        editorInstance.matrixCmd("addRow", -1);
        return false;
      } else if (event.key === "ArrowDown") {
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
  bindFunction(shortcuts.openEditor, function() {
    editorShown = editorShown === false;
    editorDiv.style.display = editorShown ? "" : "none";
    editorInstance.focus();
    return true;
  })
}


getCodeMirror.then( ()=>{
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
