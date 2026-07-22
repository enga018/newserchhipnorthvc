#!/usr/bin/env node
// Assembles www/ — the local web bundle Capacitor packages into the Android app.
// The hosted site serves app/index.html one level below the repo root (so it uses
// "../vendor", "../icons", "../manifest.json"); here the app becomes the bundle root,
// so those references are rewritten to "./vendor" etc.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const wwwDir = path.join(root, 'www');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

fs.rmSync(wwwDir, { recursive: true, force: true });
fs.mkdirSync(wwwDir, { recursive: true });

copyDir(path.join(root, 'vendor'), path.join(wwwDir, 'vendor'));
copyDir(path.join(root, 'icons'), path.join(wwwDir, 'icons'));
fs.copyFileSync(path.join(root, 'manifest.json'), path.join(wwwDir, 'manifest.json'));

let appHtml = fs.readFileSync(path.join(root, 'app', 'index.html'), 'utf8');
appHtml = appHtml
  .replace(/\.\.\/vendor\//g, './vendor/')
  .replace(/\.\.\/icons\//g, './icons/')
  .replace(/\.\.\/manifest\.json/g, './manifest.json')
  .replace(/\.\.\/sw\.js/g, './sw.js');
fs.writeFileSync(path.join(wwwDir, 'index.html'), appHtml);

console.log('www/ built for Capacitor from app/index.html + vendor/ + icons/ + manifest.json');
