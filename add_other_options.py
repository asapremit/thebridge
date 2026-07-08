import sys

with open('index.html', 'r') as f:
    content = f.read()

import re

# Find all <div class="quiz-choices-stack">...</div> and inject the Other option
# But we have to be careful not to inject into Step 9, which has dynamic checkboxes
# Step 9 doesn't have quiz-choices-stack, it has dynamic-checklists-container!
# Wait, let's verify if quiz-choices-stack is only in Steps 1, 2, 3.

# We can replace:
#               </button>
#             </div>
#           </div>
# with:
#               </button>
#               <div class="quiz-choice-row other-input-row" style="cursor: text;">
#                 <div class="quiz-radio-indicator" style="visibility: hidden;"></div>
#                 <div class="choice-row-text" style="width: 100%;">
#                   <input type="text" placeholder="Other (please specify)..." style="width: 100%; border: none; background: transparent; font-family: inherit; font-size: 1rem; color: var(--text-primary); outline: none;">
#                 </div>
#               </div>
#               <div style="font-size: 0.8rem; color: var(--text-secondary); text-align: center; margin-top: 10px;">Select the closest category above to continue.</div>
#             </div>
#           </div>

pattern = re.compile(r'              </button>\n            </div>\n          </div>')

replacement = """              </button>
              <div class="quiz-choice-row other-input-row" style="cursor: text; border: 1px dashed var(--border-color); background: transparent;">
                <div class="choice-row-text" style="width: 100%; padding-left: 8px;">
                  <input type="text" placeholder="Other (please specify)..." style="width: 100%; border: none; background: transparent; font-family: inherit; font-size: 0.95rem; color: var(--text-primary); outline: none;">
                </div>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); text-align: center; margin-top: 12px;">*Please type your custom answer, then select the closest category above to continue.</div>
            </div>
          </div>"""

# Only replace the first 13 occurrences (Steps 1, 2s, 3s)
new_content = pattern.sub(replacement, content)

with open('index.html', 'w') as f:
    f.write(new_content)

print("Done")
