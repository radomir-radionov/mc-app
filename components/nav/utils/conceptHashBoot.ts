/** Inline boot script: hide topic index nav when the URL already has a concept hash. */
export function conceptHashBootScript(): string {
  return `(function(){try{var h=location.hash;if(h&&h.length>1)document.documentElement.dataset.conceptHash=h.slice(1);}catch(e){}})();`;
}
