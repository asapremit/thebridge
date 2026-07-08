import json

transcript_path = '/Users/tribalmarks/.gemini/antigravity/brain/8329fd4b-c321-4ee7-9886-9b614c6664ea/.system_generated/logs/transcript_full.jsonl'

with open(transcript_path, 'r') as f:
    lines = f.readlines()

latest_content = None
for line in lines:
    try:
        data = json.loads(line)
        if 'tool_calls' in data:
            for call in data['tool_calls']:
                if call['name'] == 'view_file' and 'app.js' in call['args'].get('AbsolutePath', ''):
                    # Doesn't have content
                    pass
    except Exception as e:
        pass

print("Looked at transcript")
