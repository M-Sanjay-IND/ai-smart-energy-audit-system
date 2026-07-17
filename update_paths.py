import os, glob

for f in glob.glob('scripts/*.py'):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Update raw_data path
    content = content.replace("'raw_data.csv'", "os.path.join('..', 'backend', 'raw_data.csv')")
    content = content.replace('"raw_data.csv"', "os.path.join('..', 'backend', 'raw_data.csv')")
    
    # Update base_dir saving paths to docs directory instead of local scripts directory
    content = content.replace("out_dir = base_dir", "out_dir = os.path.join(base_dir, '..', 'docs')")
    content = content.replace('os.path.join(base_dir, "dataset_', 'os.path.join(base_dir, "..", "docs", "dataset_')
    content = content.replace('os.path.join(base_dir, "Case_', 'os.path.join(base_dir, "..", "docs", "Case_')
    content = content.replace('os.path.join(base_dir, "combined_', 'os.path.join(base_dir, "..", "docs", "combined_')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print("Updated all scripts successfully!")
