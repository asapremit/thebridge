import json

with open('app_modifications.json', 'r') as f:
    mods = json.load(f)

# Find the modification that added renderClientDashboard
for mod in reversed(mods):
    args = mod.get('args', {})
    if 'ReplacementChunks' in args:
        # Check if it was a multi_replace_file_content
        # Sometimes the string is passed as string instead of list, wait no, my script just grabbed the JSON
        if isinstance(args['ReplacementChunks'], str):
            try:
                chunks = json.loads(args['ReplacementChunks'])
            except:
                chunks = args['ReplacementChunks']
        else:
            chunks = args['ReplacementChunks']
        
        # Look for renderClientDashboard in chunks
        if isinstance(chunks, list):
            for chunk in chunks:
                if 'renderClientDashboard' in chunk.get('ReplacementContent', ''):
                    print(f"Found renderClientDashboard in mod at {mod['time']}")
                    with open('dashboard_chunk.json', 'w') as out:
                        json.dump(chunk, out)
                    break
