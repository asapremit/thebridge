import sys

with open('app.js', 'r') as f:
    content = f.read()

target = """  if (btnToggleToClient) {
    btnToggleToClient.addEventListener('click', () => {
      userRole = 'client';
      updateHeaderNavActions(true);
      sections.forEach(sec => sec.classList.toggle('active', sec.id === 'dashboard'));
      renderClientDashboard();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Expose local functions to window scope for match-reveal.js
  window.renderClientDashboard = renderClientDashboard;
  window.getQuizState = () => {
    const configKey = (selectedFocus && selectedStep2) ? `${selectedFocus}-${selectedStep2}` : selectedFocus;
    let categoriesConfig = null;
    if (typeof quizContentConfig !== 'undefined') {
        categoriesConfig = quizContentConfig[configKey] || quizContentConfig[selectedFocus];
    }
    const categories = categoriesConfig ? categoriesConfig.categories : ["Status", "Career", "Finance"];
    return {
      ratings,
      selectedFocus,
      selectedStep2,
      selectedStep3,
      selectedStep9,
      categories
    };
  };
});"""

replacement = """  if (btnToggleToClient) {
    btnToggleToClient.addEventListener('click', () => {
      userRole = 'client';
      updateHeaderNavActions(true);
      sections.forEach(sec => sec.classList.toggle('active', sec.id === 'dashboard'));
      renderClientDashboard();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});"""

new_content = content.replace(target, replacement)

with open('app.js', 'w') as f:
    f.write(new_content)

print("Done")
