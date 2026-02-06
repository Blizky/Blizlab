/* ================================================================
   BLIZLAB COMPONENTS
   Contains: AppHeader, AppFooter
   ================================================================ */

class AppHeader extends HTMLElement {
  connectedCallback() {
    /* 🎨 CONFIGURATION */
    const BRAND_YELLOW = "#FFD700"; 
    const LOGO_WIDTH = "220px";

    this.innerHTML = `
      <style>
        /* 1. COMPONENT RESET */
        :host {
          display: block;
          width: 100%;
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 0;
          line-height: 1.5;
          position: relative; 
          z-index: 10000;
          transform: translate3d(0, 0, 100px);
        }

        /* 2. HEADER CONTAINER */
        header {
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          height: 80px;         
          position: relative;
          z-index: 100;
          margin: 0;
          padding: 0;   
          z-index: 99999; 
  position: relative;        
        }

        /* 3. LEFT SIDE (White Background) */
        .brand-section {
          flex: 1; 
          display: flex;
          align-items: center;
          padding-left: 24px; 
          background: white;
          z-index: 2;
        }

        .brand-logo {
          width: ${LOGO_WIDTH};
          height: auto;
          display: block;
          margin-right: 20px;
        }

        .brand-tagline {
          color: #555;          
          font-size: 1.05rem;   
          line-height: 1.25;
          max-width: 400px;     
          display: none; 
          border-left: 1px solid #ddd;
          padding-left: 20px;
          font-weight: 400;
        }
        
        @media (min-width: 900px) {
          .brand-tagline { display: block; }
        }

        /* 4. RIGHT SIDE (Yellow Background) */
        .nav-section {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: flex-end; 
          padding-right: 40px; 
          padding-left: 90px; 
          height: 100%; 
          margin: 0;
        }

/* 5. THE LIGHTNING SHAPE (Clip Path) */
        .nav-section::before {
          content: "";
          position: absolute;
          top: 0;
          right: 0; 
          bottom: 0;
          left: 0;  
          background-color: ${BRAND_YELLOW};
          z-index: -1; 
          
          /* MIXED PIXELS (Left) AND PERCENTAGES (Right) */
          clip-path: polygon(
            /* 1. TOP-LEFT (Green Dot) */
            0px 0%,      

            /* 2. TOP-RIGHT (Orange Dot) */
            100% 0%,    

            /* 3. BOTTOM-RIGHT (Blue Dot) */
            100% 100%,  

            /* 4. BOTTOM-LEFT (Pink Dot) */
            52px 100%,   

            /* 5. INNER CUT (Grey Dot) */
            6px 37%,    

            /* 6. OUTER TIP (Red Dot) */
            26px 37%     
          );
        }

        /* --- MENU STYLING --- */
        .nav-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          gap: 32px; 
          font-weight: 600;
          font-size: 1rem;
          height: 100%;
          align-items: center;
        }

        .nav-link {
          text-decoration: none;
          color: #111;
          display: inline-flex;
          align-items: center;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          background-color: transparent !important; 
          position: relative; /* Needed for z-index stacking */
        }
        
        .nav-link:hover {
          transform: scale(1.15); 
          opacity: 1; 
          background-color: transparent;
        }

        .nav-disabled {
          opacity: 0.4;
          cursor: default;
        }
        
        .nav-disabled:hover {
            transform: none; 
        }

      </style>

      <header>
        <div class="brand-section">
          <a href="/" title="Go to Homepage" style="display:block; line-height:0;">
            <img src="/assets/svg/blizlab_logo_shade.svg" alt="Blizlab" class="brand-logo">
          </a>
          <div class="brand-tagline">
            Free practical web-apps for<br>creators over their deadline.
          </div>
        </div>

        <nav class="nav-section">
          <ul class="nav-list">
            
            <li>
              <a class="nav-link" href="/index.html">Apps</a>
            </li>

            <li>
              <a class="nav-link" href="/links/">About</a>
            </li>
            
          </ul>
        </nav>
      </header>
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
          <a href="https://ko-fi.com/blizky" target="_blank" rel="noopener noreferrer">Buy me a Ko-fi</a> · Made by Alex with ❤️
        </span>
      </footer>
    `;
  }
}
customElements.define('app-footer', AppFooter);
