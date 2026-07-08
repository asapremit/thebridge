import sys

with open('index.html', 'r') as f:
    content = f.read()

content = content.replace('match-reveal.js?v=10', 'match-reveal.js?v=11')
content = content.replace('app.js?v=20', 'app.js?v=21')

with open('index.html', 'w') as f:
    f.write(content)

print("Done")
