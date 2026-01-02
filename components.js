class AppHeader extends HTMLElement {
  connectedCallback() {
    // Check if this is a Child Page (compact) or Home Page (default)
    const isCompact = this.getAttribute('layout') === 'compact';

    /* ================================================================
       📝 CONFIGURATION (Adjust these numbers to tweak the look)
       ================================================================ 
    */
    
    // --- MAIN PAGE SETTINGS ---
    const MAIN_LOGO_WIDTH = "330px";  
    const MAIN_GAP_UNDER_LOGO = "6px"; 
    
    // --- CHILD PAGE SETTINGS ---
    const CHILD_LOGO_WIDTH = "160px"; 
    const CHILD_SUBTITLE_SIZE = "0.85rem"; 

    /* ================================================================ */


    // 1. CONTAINER STYLES (The white box)
    const containerStyle = isCompact 
      ? "background: #ffffff; padding: 12px 24px; display: flex; align-items: center;" 
      : "background: #ffffff; padding: 24px 20px 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;";

    // 2. WRAPPER STYLES (Holds Logo + Text)
    const wrapperStyle = isCompact
      ? "display: flex; flex-direction: row; align-items: center; gap: 18px;"
      : "display: flex; flex-direction: column; align-items: center; width: 100%;";

    // 3. LOGO STYLE
    const logoStyle = `width: ${isCompact ? CHILD_LOGO_WIDTH : MAIN_LOGO_WIDTH}; height: auto; display: block;`;

    // 4. SUBTITLE STYLE
    const subtitleCommon = "font-family: system-ui, -apple-system, sans-serif; color: #888; letter-spacing: 0.02em; line-height: 1.3;";
    
    const subtitleStyle = isCompact
      ? `${subtitleCommon} font-size: ${CHILD_SUBTITLE_SIZE}; margin: 0; text-align: left; max-width: 600px;` 
      : `${subtitleCommon} font-size: 1rem; margin-top: ${MAIN_GAP_UNDER_LOGO}; text-align: center; max-width: 600px;`; 

    // 5. SUBTITLE TEXT
    const subtitleHTML = `
      <div class="header-text-subtitle" style="${subtitleStyle}">
        Free practical web-apps for creators over their deadline… again.
      </div>
    `;

    this.innerHTML = `
      <header style="${containerStyle}">
        <div style="${wrapperStyle}">
          
          <a href="/" style="text-decoration:none; border:none; display: block;">
            <img src="/assets/svg/blizlab_logo_shade.svg" alt="Blizlab Logo" style="${logoStyle}">
          </a>
          
          ${subtitleHTML}
        
        </div>
      </header>

      <div class="app-menu-bar">
        <div class="app-menu-inner">
          <nav class="main-nav">
            <ul class="nav-list">
              <li class="nav-item">
                <span class="nav-link nav-link--button">Apps</span>
                <ul class="nav-submenu">
                  <li><a href="/octofind/">OctoFind</a></li>
                  <li><a href="/bgone/">BGone</a></li>
                  <li><a href="/retroit/">RetroIt</a></li>
                  <li><a href="/checksy/">Checksy</a></li>
                  <li><a href="/skreen/">Skreen</a></li>
                  <li><a href="/chrono/">Chronometer</a></li>
                  <li><a href="https://webprompter.app/">WebPrompter.app</a></li>
                </ul>
              </li>
              <li>
                <a class="nav-link nav-link--button" href="https://github.com/Blizky/Blizlab" target="_blank">Readme</a>
              </li>
              <li>
                <a class="nav-link nav-disabled" href="#">YouTube (coming soon)</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    `;
  }
}
customElements.define('app-header', AppHeader);

/* APP FOOTER */
class AppFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer>
        <span id="footer-text">
          <img src="/assets/svg/icons/ko-fi.svg" alt="Ko-fi" class="icon-kofi" style="width: 20px; height: 20px; vertical-align: -4px; margin-right: 4px;"> 
          <a href="https://ko-fi.com/" target="_blank" rel="noopener noreferrer">Buy me a Ko-fi</a> · Made by Alex with ❤️
        </span>
      </footer>
    `;
  }
}
customElements.define('app-footer', AppFooter);