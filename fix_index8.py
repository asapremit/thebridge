import sys

with open('index.html', 'r') as f:
    content = f.read()

content = content.replace('app.js?v=24', 'app.js?v=25')

with open('index.html', 'w') as f:
    f.write(content)

print("Done")
