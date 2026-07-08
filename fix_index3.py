import sys

with open('index.html', 'r') as f:
    content = f.read()

content = content.replace('match-reveal.js?v=9', 'match-reveal.js?v=10')
content = content.replace('app.js?v=19', 'app.js?v=20')

with open('index.html', 'w') as f:
    f.write(content)

print("Done")
