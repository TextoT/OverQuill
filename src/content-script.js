function sendConfig(){
  chrome.storage.sync.get( { 'overquill_config': {} },
    function(data){
      // Firefox is a freak
      const sendData = typeof cloneInto === "function" ? cloneInto(data, document.defaultView) : data;
      document.dispatchEvent(new CustomEvent('overquill_config_send', { detail: sendData } ));
    }
  );
}
document.addEventListener('overquill_config_listen', sendConfig);

chrome.storage.onChanged.addListener(
  function( changes, area ){
    if( area === 'sync' && changes.overquill_config.newValue !== null ){
      sendConfig();
    }
  }
);


function injectIntoMain() {
  const injectScript = document.createElement("script");
  injectScript.type = "module";
  injectScript.src = chrome.runtime.getURL("injected.js");
  (document.body || document.documentElement).appendChild(injectScript);

  // Load MathQuill Fonts
  const fontPath = chrome.runtime.getURL("deps/mathquill/fonts/");
  const fontPathTemplate = (font) => `url(${fontPath}${font})`;
  const fontIE = new FontFace("Symbola", fontPathTemplate("Symbola.eot"));
  fontIE.load()
    .then(() => {
      document.fonts.add(fontIE);
    });

  const fontNormalSrc = `local("Symbola Regular"), local("Symbola"), ${fontPathTemplate("Symbola.woff2")} format("woff2"), ${fontPathTemplate("Symbola.woff")} format("woff"), ${fontPathTemplate("Symbola.ttf")} format("truetype"), ${fontPathTemplate("Symbola.svg#Symbola")} format("svg")`
  const fontStandard = new FontFace("Symbola", fontNormalSrc);
  fontStandard.load()
    .then(() => {
      document.fonts.add(fontStandard);
    });
}
injectIntoMain();