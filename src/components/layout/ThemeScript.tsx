/**
 * Runs before first paint so the correct theme is applied without a flash.
 * Stored preference wins; otherwise follow the OS.
 */
export function ThemeScript() {
  const code = `(function(){try{var s=localStorage.getItem("theme");var m=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=s==="dark"||s==="light"?s:(m?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
