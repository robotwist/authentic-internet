#!/usr/bin/env node

// Script to generate placeholder images for Authentic Internet game
// This script creates simple PNG files for required images that might be missing

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

console.log('Generating placeholder images...');

// Configuration for the images to generate
const images = [
  {
    name: 'default-artifact.png',
    path: 'client/public/images/default-artifact.png',
    width: 64,
    height: 64,
    text: 'A',
    color: '#4F46E5'
  },
  {
    name: 'artifact-scroll.png',
    path: 'client/public/images/artifact-scroll.png',
    width: 64,
    height: 64,
    text: 'S',
    color: '#10B981'
  },
  {
    name: 'artifact-gem.png',
    path: 'client/public/images/artifact-gem.png',
    width: 64,
    height: 64,
    text: 'G',
    color: '#EF4444'
  },
  {
    name: 'artifact-book.png',
    path: 'client/public/images/artifact-book.png',
    width: 64,
    height: 64,
    text: 'B',
    color: '#9333EA'
  },
  {
    name: 'artifact-potion.png',
    path: 'client/public/images/artifact-potion.png',
    width: 64,
    height: 64,
    text: 'P',
    color: '#F97316'
  },
  {
    name: 'logo192.png',
    path: 'client/public/logo192.png',
    width: 192,
    height: 192,
    text: 'AI',
    color: '#4F46E5'
  },
  {
    name: 'logo512.png',
    path: 'client/public/logo512.png',
    width: 512,
    height: 512,
    text: 'AI',
    color: '#4F46E5'
  },
  {
    name: 'apple-touch-icon.png',
    path: 'client/public/apple-touch-icon.png',
    width: 180,
    height: 180,
    text: 'AI',
    color: '#4F46E5'
  },
  {
    name: 'favicon.ico',
    path: 'client/public/favicon.ico',
    width: 32,
    height: 32,
    text: 'AI',
    color: '#4F46E5'
  }
];

// Function to generate an image
function generateImage(config) {
  // Create canvas with specified dimensions
  const canvas = createCanvas(config.width, config.height);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, config.width, config.height);
  
  // Add border
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = Math.max(1, Math.min(config.width, config.height) / 32);
  ctx.strokeRect(ctx.lineWidth/2, ctx.lineWidth/2, config.width-ctx.lineWidth, config.height-ctx.lineWidth);
  
  // Add text
  ctx.fillStyle = config.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const fontSize = Math.max(10, Math.min(config.width, config.height) / 4);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillText(config.text, config.width/2, config.height/2);
  
  // Save the image
  const buffer = canvas.toBuffer('image/png');
  
  // Ensure directory exists
  const dir = path.dirname(config.path);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(config.path, buffer);
  console.log(`✅ Generated ${config.name} (${config.width}x${config.height})`);
}

// Generate all images
try {
  images.forEach(generateImage);
  console.log('\nAll placeholder images generated successfully!');
} catch (error) {
  console.error('Error generating images:', error);
  
  console.log('\nAlternative: Use the web-based tool to generate images:');
  console.log('1. Open client/public/convert-svg.html in your browser');
  console.log('2. Use the "Generate Placeholder Images" section');
  console.log('3. Download and save the images to their respective locations');
} 