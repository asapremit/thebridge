import sys

with open('index.html', 'r') as f:
    content = f.read()

content = content.replace('match-reveal.js?v=8', 'match-reveal.js?v=9')
content = content.replace('app.js?v=18', 'app.js?v=19')

with open('index.html', 'w') as f:
    f.write(content)

print("Done")
