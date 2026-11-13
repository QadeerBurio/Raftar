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
  let changed = false;

  // Replace common hardcoded light background colors with transparent
  // We cannot blindly replace all '#FFFFFF' because it might be used for text or icons.
  // But we CAN replace `backgroundColor: '#FFFFFF'`
  
  const regexes = [
    /backgroundColor:\s*'#FFFFFF'/g,
    /backgroundColor:\s*"#FFFFFF"/g,
    /backgroundColor:\s*'#FFF'/g,
    /backgroundColor:\s*"#FFF"/g,
    /backgroundColor:\s*'#F8F9FA'/g,
    /backgroundColor:\s*"#F8F9FA"/g,
    /backgroundColor:\s*'#F5F5F5'/g,
    /backgroundColor:\s*"#F5F5F5"/g
  ];

  regexes.forEach(regex => {
    if (regex.test(content)) {
      content = content.replace(regex, "backgroundColor: 'transparent'");
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated backgrounds in ${file}`);
  }
});
