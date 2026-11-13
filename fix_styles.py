import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    # We only want to replace within the createStyles function
    start_idx = content.find('const createStyles = (colors, isDark) =>')
    if start_idx == -1:
        return
        
    before = content[:start_idx]
    styles = content[start_idx:]
    
    # Basic replacements
    styles = re.sub(r"'#FFFFFF'", 'colors.background', styles)
    styles = re.sub(r"'#FFF'", 'colors.background', styles)
    styles = re.sub(r"'#000000'", 'colors.text', styles)
    styles = re.sub(r"'#000'", 'colors.text', styles)
    styles = re.sub(r"'#F5F5F5'", 'colors.card', styles)
    styles = re.sub(r"'#F8F8F8'", 'colors.cardElevated', styles)
    styles = re.sub(r"'#F0F0F0'", 'colors.border', styles)
    styles = re.sub(r"'#E0E0E0'", 'colors.border', styles)
    styles = re.sub(r"'#999'", 'colors.textSecondary', styles)
    
    with open(filename, 'w') as f:
        f.write(before + styles)

fix_file('/home/ibrar/Documents/Raftar/Raftar/app/src/screens/passenger/BookRideScreen.js')
fix_file('/home/ibrar/Documents/Raftar/Raftar/app/src/screens/passenger/HomeScreen.js')
