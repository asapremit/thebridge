import sys

with open('index.html', 'r') as f:
    content = f.read()

replacement = """              </button>
              <div class="quiz-choice-row other-input-row" style="cursor: text; border: 1px dashed var(--border-color); background: transparent;">
                <div class="choice-row-text" style="width: 100%; padding-left: 8px;">
                  <input type="text" placeholder="Other (please specify)..." style="width: 100%; border: none; background: transparent; font-family: inherit; font-size: 0.95rem; color: var(--text-primary); outline: none;">
                </div>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); text-align: center; margin-top: 12px;">*Please type your custom answer, then select the closest category above to continue.</div>
            </div>
          </div>"""

target = """              </button>
            </div>
          </div>"""

# Revert the replacement
new_content = content.replace(replacement, target)

with open('index.html', 'w') as f:
    f.write(new_content)

print("Done")
