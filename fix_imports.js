const fs = require('fs');
const path = require('path');

function replaceInDir(dir, replacements) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath, replacements);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [from, to] of replacements) {
        if (content.includes(from)) {
          content = content.replaceAll(from, to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

// Fix pages
replaceInDir(path.join(__dirname, 'src', 'pages'), [
  ['import Logo from "./Logo"', 'import Logo from "../../components/ui/Logo"'],
  ['import Logo from "../components/ui/Logo"', 'import Logo from "../../components/ui/Logo"'],
  ['import DatePicker from "./DatePicker"', 'import DatePicker from "../../components/ui/DatePicker"'],
  ['from "../assets/', 'from "../../assets/'],
  ['from "../utils/constants"', 'from "../../utils/constants"'],
]);

// Fix layouts
replaceInDir(path.join(__dirname, 'src', 'layouts'), [
  ['import Logo from "./Logo"', 'import Logo from "../components/ui/Logo"'],
  ['from "../assets/', 'from "../assets/'],
  ['import Logo from "../components/ui/Logo"', 'import Logo from "../components/ui/Logo"']
]);

// Fix App.jsx constants import
let appPath = path.join(__dirname, 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');
if (appContent.includes('from "./components/')) {
    // Should be fixed already but just in case
}
