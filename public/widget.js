(function () {
  var script = document.currentScript;
  if (!script) return;
  var slug = script.getAttribute("data-slug");
  if (!slug) return;
  var origin = script.src.replace(/\/widget\.js.*$/, "");
  var iframe = document.createElement("iframe");
  iframe.src = origin + "/embed/" + encodeURIComponent(slug);
  iframe.title = "Kingbid rank badge";
  iframe.style.cssText = "border:0;width:100%;max-width:320px;height:72px;overflow:hidden;";
  iframe.loading = "lazy";
  script.parentNode.insertBefore(iframe, script.nextSibling);
})();
