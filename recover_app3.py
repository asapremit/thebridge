import json

transcript_path = '/Users/tribalmarks/.gemini/antigravity/brain/8329fd4b-c321-4ee7-9886-9b614c6664ea/.system_generated/logs/transcript_full.jsonl'

modifications = []
with open(transcript_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'tool_calls' in data:
                for call in data['tool_calls']:
                    name = call['name']
                    if name in ['multi_replace_file_content', 'replace_file_content', 'write_to_file']:
                        args = call.get('args', {})
                        target_file = args.get('TargetFile', '')
                        if 'app.js' in target_file:
                            modifications.append({
                                'time': data.get('created_at'),
                                'tool': name,
                                'args': args
                            })
        except Exception as e:
            pass

with open('app_modifications.json', 'w') as out:
    json.dump(modifications, out, indent=2)

print("Saved app_modifications.json")
