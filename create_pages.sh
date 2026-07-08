#!/bin/bash
PAGES=("help-center" "contact" "privacy" "terms")
TITLES=("Help Center" "Contact Us" "Privacy Policy" "Terms of Service")

for i in "${!PAGES[@]}"; do
  PAGE="${PAGES[$i]}"
  TITLE="${TITLES[$i]}"
  cat << HTML > "${PAGE}.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>$TITLE — same Path</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    .page-container {
      max-width: 800px;
      margin: 120px auto 80px;
      padding: 0 24px;
      min-height: 50vh;
    }
    .page-container h1 {
      font-size: 3rem;
      margin-bottom: 24px;
      color: var(--text-primary);
    }
    .page-container p {
      font-size: 1.1rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="nav-container">
      <div class="logo">
        <a href="/" style="text-decoration: none; color: inherit; display: flex; align-items: center;">
          <svg viewBox="0 0 24 24" style="width: 22px; height: 22px; margin-right: 6px;" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 16h8a4 4 0 0 0 4-4V4" stroke="#112F20" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 20h9a4 4 0 0 0 4-4V7" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          same Path
        </a>
      </div>
      <ul class="nav-links public-nav-links">
        <li><a href="/" class="nav-link">Home</a></li>
      </ul>
    </div>
  </nav>

  <div class="page-container">
    <h1>$TITLE</h1>
    <p>This page is currently under construction. Please check back later for detailed information regarding our $TITLE.</p>
  </div>

  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="logo" style="color: white;">
            <svg viewBox="0 0 24 24" style="width: 22px; height: 22px; display: inline-block; vertical-align: middle; margin-right: 6px;" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 16h8a4 4 0 0 0 4-4V4" stroke="#FAF9F5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 20h9a4 4 0 0 0 4-4V7" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            same Path
          </div>
          <p style="color: #9ca3af; margin-top: 16px; font-size: 0.9rem;">Connecting global talent with local expertise.</p>
        </div>
        <div class="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><a href="/">Home</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Support</h4>
          <ul>
            <li><a href="/help-center.html">Help Center</a></li>
            <li><a href="/contact.html">Contact Us</a></li>
            <li><a href="/privacy.html">Privacy Policy</a></li>
            <li><a href="/terms.html">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; 2026 same Path. All rights reserved.
      </div>
    </div>
  </footer>
</body>
</html>
HTML
done
