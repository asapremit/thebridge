import sys
import re

with open('index.html', 'r') as f:
    content = f.read()

pattern = re.compile(r'              </button>\n            </div>\n          </div>')

replacement = """              </button>
              <div class="other-input-container" style="border: 1px dashed var(--border-color); background: transparent; padding: 12px; border-radius: 8px; margin-top: 8px;">
                <input type="text" placeholder="Other (please specify)..." style="width: 100%; border: none; background: transparent; font-family: inherit; font-size: 0.95rem; color: var(--text-primary); outline: none;">
              </div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); text-align: center; margin-top: 12px;">*Please type your custom answer, then select the closest category above to continue.</div>
            </div>
          </div>"""

# Replace only the first 13 occurrences to hit steps 1, 2, and 3
new_content = pattern.sub(replacement, content, count=13)

with open('index.html', 'w') as f:
    f.write(new_content)

print("Done")
