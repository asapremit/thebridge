import json

transcript_path = '/Users/tribalmarks/.gemini/antigravity/brain/8329fd4b-c321-4ee7-9886-9b614c6664ea/.system_generated/logs/transcript_full.jsonl'

with open(transcript_path, 'r') as f:
    lines = f.readlines()

for line in lines:
    try:
        data = json.loads(line)
        if data.get('type') == 'PLANNER_RESPONSE' or data.get('type') == 'TOOL_RESPONSE':
            if 'tool_calls' in data:
                # wait, responses are in TOOL_RESPONSE or what?
                pass
        
        # if this is a tool response for run_command
        if data.get('source') == 'SYSTEM' and data.get('type') == 'TOOL_RESPONSE':
            # It's an array of tool responses
            content = data.get('content', '')
            if 'diff --git a/app.js b/app.js' in content:
                with open('recovered_diff.txt', 'w') as out:
                    out.write(content)
                print("Found and saved recovered_diff.txt!")
    except Exception as e:
        pass

print("Done")
