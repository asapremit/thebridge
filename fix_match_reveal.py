import sys

with open('match-reveal.js', 'r') as f:
    content = f.read()

target = "Our system evaluated your onboarding inputs across immigration, career, and credit channels. Below are your dynamic category status dials and the top diagnostic insights."
replacement = "Our system evaluated your onboarding profile and selected goals. Below are your dynamic category status dials and the top diagnostic insights."

content = content.replace(target, replacement)

with open('match-reveal.js', 'w') as f:
    f.write(content)

print("Done")
