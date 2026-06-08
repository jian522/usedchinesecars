/**
 * Deploy to GitHub Pages
 *
 * Runs the static generator, then publishes the dist/ content
 * to the main branch (which powers GitHub Pages at jinbacars.com).
 *
 * Usage: node tools/deploy-ghpages.js
 *        npm run deploy
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const REPO_ROOT = path.resolve(ROOT, '..'); // D:\谷歌下载

console.log('=== Deploy to GitHub Pages ===\n');

// Step 1: Run static generator
console.log('Step 1: Generating static site...');
require('./static-generator');
console.log('');

// Step 2: Verify dist exists
if (!fs.existsSync(DIST)) {
  console.error('ERROR: dist/ directory not found!');
  process.exit(1);
}

// Step 3: Switch to main branch and update files
console.log('Step 2: Switching to main branch...');
execSync('git stash', { cwd: REPO_ROOT, stdio: 'pipe' });
try {
  execSync('git checkout main', { cwd: REPO_ROOT, stdio: 'inherit' });
} catch (e) {
  console.error('ERROR: Could not switch to main branch. Pull latest main first.');
  process.exit(1);
}

// Step 4: Sync with remote main (clean reset)
console.log('Step 3: Syncing with remote main branch...');
execSync('git fetch origin main', { cwd: REPO_ROOT, stdio: 'inherit' });
execSync('git reset --hard origin/main', { cwd: REPO_ROOT, stdio: 'inherit' });
console.log('✓ Synced with origin/main');

// Step 5: Replace repo root files with dist/ content
console.log('Step 4: Copying generated files to repo root...');

// Remove old files (except .git and jinba-export/ which has our dist/ files)
const keepDirs = new Set(['.git', 'jinba-export']);
const oldFiles = fs.readdirSync(REPO_ROOT).filter(f => !keepDirs.has(f));
for (const f of oldFiles) {
  const fp = path.join(REPO_ROOT, f);
  try {
    const stat = fs.lstatSync(fp);
    if (stat.isDirectory()) {
      fs.rmSync(fp, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fp);
    }
  } catch (e) { /* skip */ }
}

// Copy dist/ content to repo root
function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
copyRecursive(DIST, REPO_ROOT);

console.log('✓ Files copied to repo root');

// Step 6: Add GitHub Pages no-Jekyll file (prevents Jekyll processing)
fs.writeFileSync(path.join(REPO_ROOT, '.nojekyll'), '');
console.log('✓ .nojekyll added');

// Step 7: Commit and push
console.log('\nStep 5: Committing and pushing to main branch...');
execSync('git add -A', { cwd: REPO_ROOT, stdio: 'inherit' });

const dateStr = new Date().toISOString().split('T')[0];
try {
  execSync(`git commit -m "deploy: static site update ${dateStr}"`, { cwd: REPO_ROOT, stdio: 'inherit' });
  console.log('✓ Committed');
} catch (e) {
  // No changes to commit
  console.log('(no changes to commit)');
}

console.log('Pushing to GitHub...');
execSync('git push origin main', { cwd: REPO_ROOT, stdio: 'inherit' });
console.log('\n✓ Deployed!');

// Step 8: Switch back to master
execSync('git checkout master', { cwd: REPO_ROOT, stdio: 'inherit' });
console.log('✓ Switched back to master branch');

console.log('\n✅ Deployment complete!');
console.log('   Site: https://jinbacars.com (GitHub Pages may take 1-2 min to update)');
