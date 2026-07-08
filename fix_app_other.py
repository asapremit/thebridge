import sys

with open('app.js', 'r') as f:
    content = f.read()

target = """        container.appendChild(label);
      });
    }

    function resetBtns(slide) {"""

replacement = """        container.appendChild(label);
      });
      
      // Add 'Other' option
      const otherLabel = document.createElement('label');
      otherLabel.className = 'goal-checkbox-row';
      otherLabel.innerHTML = `
        <input type="checkbox" name="goal-checklist" value="other" class="goal-checkbox-input">
        <span class="goal-checkbox-box"></span>
        <input type="text" placeholder="Other (please specify)" class="other-input-field" style="border:none; background:transparent; outline:none; font-family:inherit; font-size:1rem; flex:1; min-width:0; margin-left:8px; color:var(--text-primary);" onclick="event.stopPropagation()">
      `;
      const otherInputBox = otherLabel.querySelector('.goal-checkbox-input');
      const otherTextField = otherLabel.querySelector('.other-input-field');
      
      otherLabel.addEventListener('click', (e) => {
        if (e.target === otherInputBox || e.target === otherTextField) return;
        e.preventDefault();
        otherInputBox.checked = !otherInputBox.checked;
        otherLabel.classList.toggle('checked', otherInputBox.checked);
        if (otherInputBox.checked) {
          if (!selectedStep9.includes('other')) selectedStep9.push('other');
        } else {
          selectedStep9 = selectedStep9.filter(v => v !== 'other');
        }
      });
      
      otherTextField.addEventListener('input', () => {
        if (otherTextField.value.trim() !== '') {
          otherInputBox.checked = true;
          otherLabel.classList.add('checked');
          if (!selectedStep9.includes('other')) selectedStep9.push('other');
        } else {
          otherInputBox.checked = false;
          otherLabel.classList.remove('checked');
          selectedStep9 = selectedStep9.filter(v => v !== 'other');
        }
      });
      
      container.appendChild(otherLabel);
    }

    function resetBtns(slide) {"""

content = content.replace(target, replacement)

with open('app.js', 'w') as f:
    f.write(content)

print("Done")
