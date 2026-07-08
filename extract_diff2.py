import json

transcript_path = '/Users/tribalmarks/.gemini/antigravity/brain/8329fd4b-c321-4ee7-9886-9b614c6664ea/.system_generated/logs/transcript_full.jsonl'

with open(transcript_path, 'r') as f:
    lines = f.readlines()

for line in lines:
    try:
        data = json.loads(line)
        if data.get('type') == 'TOOL_RESPONSE':
            # print keys to see how output is stored
            # typically it's an array of responses in 'content' if it's a list?
            # actually, maybe it's 'tool_responses'?
            if 'tool_responses' in data:
                for tr in data['tool_responses']:
                    # search for 'git diff' or 'app.js'
                    out_text = str(tr)
                    if 'diff --git a/app.js b/app.js' in out_text:
                        with open('recovered_diff.json', 'w') as out:
                            json.dump(tr, out, indent=2)
                        print("Found and saved recovered_diff.json!")
    except Exception as e:
        pass

print("Done2")
