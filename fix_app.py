import sys

with open('app.js', 'r') as f:
    content = f.read()

target1 = """  const focusAreaToPhase = {
    'Status & Visas': 'Immigration Status',
    'Career & Jobs': 'Tech Career Advancement',
    'Finance & Credit': 'First-Time Homebuyer'
  };

  const phaseToFocusArea = {
    'Immigration Status': 'Status & Visas',
    'Tech Career Advancement': 'Career & Jobs',
    'First-Time Homebuyer': 'Finance & Credit'
  };"""

replacement1 = """  const focusAreaToPhase = {
    'Status & Visas': 'Immigration Status',
    'Career & Jobs': 'Tech Career Advancement',
    'Finance & Credit': 'Financial Setup'
  };

  const phaseToFocusArea = {
    'Immigration Status': 'Status & Visas',
    'Tech Career Advancement': 'Career & Jobs',
    'Financial Setup': 'Finance & Credit'
  };"""

target2 = """      if (stepAttr === '10') {
        justCompletedQuiz = true;
        if (isUserLoggedIn) {
          const navbar = document.querySelector('.navbar');
          const subnav = document.getElementById('portal-sub-nav');
          if (navbar) navbar.style.display = 'none';
          if (subnav) subnav.style.display = 'none';
          sections.forEach(sec => sec.classList.toggle('active', sec.id === 'match-reveal'));
          startMatchRevealFlow();
        } else {
          goToStep('signup');
        }
        return;
      }"""

replacement2 = """      if (stepAttr === '10') {
        justCompletedQuiz = true;
        if (isUserLoggedIn) {
          const navbar = document.querySelector('.navbar');
          const subnav = document.getElementById('portal-sub-nav');
          if (navbar) navbar.style.display = 'none';
          if (subnav) subnav.style.display = 'none';
          sections.forEach(sec => sec.classList.toggle('active', sec.id === 'match-reveal'));
          
          if (auth && auth.currentUser) {
            syncUserData(auth.currentUser).then(() => {
              startMatchRevealFlow();
            });
          } else {
            startMatchRevealFlow();
          }
        } else {
          goToStep('signup');
        }
        return;
      }"""

target3 = """          if (input.checked) {
            if (!selectedStep9.includes(item.val)) {
              selectedStep9.push(item.val);
            }
          } else {
            selectedStep9 = selectedStep9.filter(v => v !== item.val);
          }
          
          // Auto-advance to Step 10 after selection to keep uniform transition behavior
          setTimeout(() => {
            goToStep(10);
          }, 600);
        });
        
        container.appendChild(label);"""

replacement3 = """          if (input.checked) {
            if (!selectedStep9.includes(item.val)) {
              selectedStep9.push(item.val);
            }
          } else {
            selectedStep9 = selectedStep9.filter(v => v !== item.val);
          }
        });
        
        container.appendChild(label);"""

content = content.replace(target1, replacement1)
content = content.replace(target2, replacement2)
content = content.replace(target3, replacement3)

with open('app.js', 'w') as f:
    f.write(content)

print("Done")
