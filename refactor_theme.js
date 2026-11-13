const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.js')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const screensDir = path.join(__dirname, 'app', 'src', 'screens');
const files = walkSync(screensDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Skip files that already use ThemeContext correctly with useMemo
  if (content.includes('useMemo(() => createStyles(colors') || content.includes('useMemo(() => createStyles(colors, isDark)')) {
    return;
  }

  let changed = false;

  // 1. Import useTheme
  if (!content.includes('useTheme')) {
    // Find last import
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf('\n', lastImportIndex);
    
    // Add useTheme import. Note: adjusting path based on directory depth
    let depth = file.split('app/src/screens/')[1].split('/').length - 1;
    let importPath = '../'.repeat(depth + 1) + 'context/ThemeContext';
    
    content = content.slice(0, endOfLastImport) + `\nimport { useTheme } from '${importPath}';` + content.slice(endOfLastImport);
    changed = true;
  }

  // 2. Inject useTheme hook inside component
  // Find component definition: const ComponentName = (...) => {
  const compMatch = content.match(/const\s+([A-Za-z0-9_]+)\s*=\s*\([^)]*\)\s*=>\s*\{/);
  if (compMatch) {
    const compStart = compMatch.index + compMatch[0].length;
    
    // Check if it already has styles definition
    if (!content.includes('const { colors, isDark } = useTheme();')) {
      const injection = `\n  const { colors, isDark } = useTheme();\n  const styles = React.useMemo(() => createStyles(colors, isDark), [colors, isDark]);\n`;
      content = content.slice(0, compStart) + injection + content.slice(compStart);
      changed = true;
    }
  }

  // 3. Rename StyleSheet.create to createStyles
  if (content.includes('const styles = StyleSheet.create({')) {
    content = content.replace(/const styles = StyleSheet.create\(\{/, 'const createStyles = (colors, isDark) => StyleSheet.create({');
    
    // Try to replace some obvious colors
    content = content.replace(/backgroundColor:\s*'#FFFFFF'/g, "backgroundColor: colors.background");
    content = content.replace(/backgroundColor:\s*"#FFFFFF"/g, "backgroundColor: colors.background");
    content = content.replace(/backgroundColor:\s*'#FFF'/g, "backgroundColor: colors.background");
    content = content.replace(/backgroundColor:\s*"#FFF"/g, "backgroundColor: colors.background");
    content = content.replace(/backgroundColor:\s*'#F8F9FA'/g, "backgroundColor: isDark ? '#121212' : '#F8F9FA'");
    content = content.replace(/backgroundColor:\s*"#F8F9FA"/g, "backgroundColor: isDark ? '#121212' : '#F8F9FA'");
    content = content.replace(/color:\s*'#000'/g, "color: colors.text");
    content = content.replace(/color:\s*"#000"/g, "color: colors.text");
    content = content.replace(/color:\s*'#000000'/g, "color: colors.text");
    
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Refactored ${file}`);
  }
});
