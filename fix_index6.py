import sys

with open('index.html', 'r') as f:
    content = f.read()

content = content.replace('app.js?v=22', 'app.js?v=23')

with open('index.html', 'w') as f:
    f.write(content)

print("Done")
