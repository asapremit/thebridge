import urllib.request
from bs4 import BeautifulSoup
import re

url = "https://strawberry.me/"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read()
soup = BeautifulSoup(html, 'html.parser')

text = soup.get_text(separator='\n')
text = re.sub(r'\n+', '\n', text)
with open('strawberry_text.txt', 'w') as f:
    f.write(text)
