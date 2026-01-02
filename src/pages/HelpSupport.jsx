// src/pages/HelpSupport.jsx
import React, { useState } from 'react';
import styles from './HelpSupport.module.scss';

export default function HelpSupport() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = {
    overview: {
      title: 'Overview',
      icon: '📚',
      content: (
        <>
          <h2>Welcome to Habesha Community Help & Support</h2>
          <p>
            We've recently upgraded our theme system to provide you with the best possible experience.
            All pages now have perfect readability in both light and dark modes.
          </p>
          
          <div className={styles.highlights}>
            <div className={styles.highlight}>
              <span className={styles.highlightIcon}>✅</span>
              <div>
                <h3>Perfect Readability</h3>
                <p>All text is now clearly visible in both light and dark themes</p>
              </div>
            </div>
            
            <div className={styles.highlight}>
              <span className={styles.highlightIcon}>🎨</span>
              <div>
                <h3>Consistent Design</h3>
                <p>Unified visual language across all pages</p>
              </div>
            </div>
            
            <div className={styles.highlight}>
              <span className={styles.highlightIcon}>♿</span>
              <div>
                <h3>Accessible</h3>
                <p>WCAG AAA compliant with high contrast ratios</p>
              </div>
            </div>
          </div>
        </>
      ),
    },
    
    theme: {
      title: 'Theme System',
      icon: '🌓',
      content: (
        <>
          <h2>Light & Dark Modes</h2>
          
          <div className={styles.themeSection}>
            <h3>How to Switch Themes</h3>
            <ol>
              <li>Look for the <strong>theme toggle icon</strong> in the header (moon/sun icon)</li>
              <li>Click it to switch between light and dark modes</li>
              <li>Your preference is saved automatically</li>
            </ol>
          </div>
          
          <div className={styles.themeSection}>
            <h3>Light Mode</h3>
            <ul>
              <li>Pure white backgrounds</li>
              <li>Black/dark text for maximum readability</li>
              <li>Light blue highlights</li>
              <li>Perfect for daytime use</li>
            </ul>
          </div>
          
          <div className={styles.themeSection}>
            <h3>Dark Mode</h3>
            <ul>
              <li>Black to blue gradient backgrounds</li>
              <li>White text for comfortable reading</li>
              <li>Glassy effects with blur</li>
              <li>Perfect for nighttime use</li>
            </ul>
          </div>
        </>
      ),
    },
    
    features: {
      title: 'Recent Improvements',
      icon: '✨',
      content: (
        <>
          <h2>What's New</h2>
          
          <div className={styles.feature}>
            <h3>1. Section Titles Fixed</h3>
            <p>
              All section titles across the app (Feed, Profile, etc.) now have proper contrast
              in both light and dark modes. No more invisible white text on white backgrounds!
            </p>
          </div>
          
          <div className={styles.feature}>
            <h3>2. Header Icons Improved</h3>
            <p>
              Search, notification bell, and all other header icons now have consistent sizing
              and colors that adapt to the theme. They're always clearly visible.
            </p>
          </div>
          
          <div className={styles.feature}>
            <h3>3. Hero Tabs Enhanced</h3>
            <p>
              Category tabs on the Feed page now intelligently adapt their color based on the
              background, ensuring perfect readability whether on the video or white page.
            </p>
          </div>
          
          <div className={styles.feature}>
            <h3>4. Profile Pages Updated</h3>
            <p>
              Profile section titles (About, Ads, Rentals, Services, Events, Photos) now use
              theme-aware colors for excellent readability.
            </p>
          </div>
        </>
      ),
    },
    
    troubleshooting: {
      title: 'Troubleshooting',
      icon: '🔧',
      content: (
        <>
          <h2>Common Issues & Solutions</h2>
          
          <div className={styles.issue}>
            <h3>Issue: Text is hard to read</h3>
            <div className={styles.solution}>
              <strong>Solution:</strong>
              <ol>
                <li>Try switching themes using the theme toggle in the header</li>
                <li>Hard refresh the page (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)</li>
                <li>Clear your browser cache</li>
              </ol>
            </div>
          </div>
          
          <div className={styles.issue}>
            <h3>Issue: Icons are not visible</h3>
            <div className={styles.solution}>
              <strong>Solution:</strong>
              <ol>
                <li>Refresh the page</li>
                <li>Check if your browser is up to date</li>
                <li>Try a different browser to see if the issue persists</li>
              </ol>
            </div>
          </div>
          
          <div className={styles.issue}>
            <h3>Issue: Theme toggle not working</h3>
            <div className={styles.solution}>
              <strong>Solution:</strong>
              <ol>
                <li>Check browser console for errors (press F12)</li>
                <li>Make sure cookies/localStorage is enabled</li>
                <li>Try clearing localStorage and refreshing</li>
              </ol>
            </div>
          </div>
          
          <div className={styles.issue}>
            <h3>Issue: Colors look wrong after update</h3>
            <div className={styles.solution}>
              <strong>Solution:</strong>
              <ol>
                <li><strong>Hard refresh:</strong> Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)</li>
                <li><strong>Clear cache:</strong> Browser settings → Clear browsing data</li>
                <li><strong>Restart browser:</strong> Close all tabs and reopen</li>
              </ol>
            </div>
          </div>
        </>
      ),
    },
    
    accessibility: {
      title: 'Accessibility',
      icon: '♿',
      content: (
        <>
          <h2>Accessibility Features</h2>
          
          <div className={styles.accessibilitySection}>
            <h3>High Contrast</h3>
            <p>
              All text elements meet or exceed WCAG AAA standards with contrast ratios of 21:1
              in light mode and 15:1+ in dark mode.
            </p>
          </div>
          
          <div className={styles.accessibilitySection}>
            <h3>Keyboard Navigation</h3>
            <p>
              All interactive elements can be accessed using the keyboard. Use Tab to navigate
              and Enter to activate buttons and links.
            </p>
          </div>
          
          <div className={styles.accessibilitySection}>
            <h3>Screen Reader Support</h3>
            <p>
              The application is optimized for screen readers with proper ARIA labels and
              semantic HTML structure.
            </p>
          </div>
          
          <div className={styles.accessibilitySection}>
            <h3>Color Blind Friendly</h3>
            <p>
              Our design relies on contrast rather than color alone, making it accessible
              to users with color vision deficiencies.
            </p>
          </div>
        </>
      ),
    },
    
    contact: {
      title: 'Contact Support',
      icon: '📞',
      content: (
        <>
          <h2>Get Help</h2>
          
          <div className={styles.contactSection}>
            <h3>Before Contacting Support</h3>
            <p>Please try these steps first:</p>
            <ul>
              <li>Check the Troubleshooting section above</li>
              <li>Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)</li>
              <li>Clear your browser cache</li>
              <li>Try a different browser</li>
            </ul>
          </div>
          
          <div className={styles.contactSection}>
            <h3>When Reporting an Issue</h3>
            <p>Please include:</p>
            <ul>
              <li><strong>Browser:</strong> Name and version (e.g., Chrome 120)</li>
              <li><strong>Operating System:</strong> Windows, Mac, Linux, iOS, Android</li>
              <li><strong>Theme:</strong> Light or dark mode</li>
              <li><strong>Page:</strong> Which page has the issue</li>
              <li><strong>Steps:</strong> How to reproduce the problem</li>
              <li><strong>Screenshot:</strong> If possible</li>
            </ul>
          </div>
          
          <div className={styles.contactSection}>
            <h3>Browser Information</h3>
            <p>Your current browser information:</p>
            <div className={styles.browserInfo}>
              <p><strong>User Agent:</strong> {navigator.userAgent}</p>
              <p><strong>Platform:</strong> {navigator.platform}</p>
              <p><strong>Language:</strong> {navigator.language}</p>
            </div>
          </div>
        </>
      ),
    },
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Help & Support</h1>
          <p>Everything you need to know about using Habesha Community</p>
        </header>

        <div className={styles.layout}>
          {/* Sidebar Navigation */}
          <nav className={styles.sidebar}>
            {Object.entries(sections).map(([key, section]) => (
              <button
                key={key}
                className={`${styles.navItem} ${activeSection === key ? styles.active : ''}`}
                onClick={() => setActiveSection(key)}
              >
                <span className={styles.navIcon}>{section.icon}</span>
                <span className={styles.navText}>{section.title}</span>
              </button>
            ))}
          </nav>

          {/* Content Area */}
          <main className={styles.content}>
            {sections[activeSection].content}
          </main>
        </div>
      </div>
    </div>
  );
}
