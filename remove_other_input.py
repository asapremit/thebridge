import sys

with open('index.html', 'r') as f:
    content = f.read()

target = """              </button>
              <div class="other-input-container" style="border: 1px dashed var(--border-color); background: transparent; padding: 12px; border-radius: 8px; margin-top: 8px;">
                <input type="text" placeholder="Other (please specify)..." style="width: 100%; border: none; background: transparent; font-family: inherit; font-size: 0.95rem; color: var(--text-primary); outline: none;">
              </div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); text-align: center; margin-top: 12px;">*Please type your custom answer, then select the closest category above to continue.</div>
            </div>
          </div>"""

replacement = """              </button>
            </div>
          </div>"""

new_content = content.replace(target, replacement)

with open('index.html', 'w') as f:
    f.write(new_content)

print("Done")
