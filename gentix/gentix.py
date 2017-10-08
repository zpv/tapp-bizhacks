import urllib.request
import urllib.parse
with open('blanc.txt') as f:
	for strs in f:
		url = "https://littix.org/get-ticket?name=" + urllib.parse.quote_plus(strs.rstrip()) + "&id=228813630847975425"
		urllib.request.urlopen(url)