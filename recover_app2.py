import json

transcript_path = '/Users/tribalmarks/.gemini/antigravity/brain/8329fd4b-c321-4ee7-9886-9b614c6664ea/.system_generated/logs/transcript_full.jsonl'

with open(transcript_path, 'r') as f:
    lines = f.readlines()

for line in lines:
    try:
        data = json.loads(line)
        if 'tool_calls' in data:
            for call in data['tool_calls']:
                if call['name'] in ['multi_replace_file_content', 'replace_file_content', 'write_to_file', 'run_command']:
                    args = call.get('args', {})
                    # If this modifies app.js, print it
                    if 'app.js' in str(args):
                        print("Modifies app.js at", data.get('created_at'))
    except Exception as e:
        pass

print("Done")
