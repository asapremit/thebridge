import sys

with open('index.html', 'r') as f:
    content = f.read()

content = content.replace('match-reveal.js?v=7', 'match-reveal.js?v=8')
content = content.replace('app.js?v=17', 'app.js?v=18')

with open('index.html', 'w') as f:
    f.write(content)

print("Done")
