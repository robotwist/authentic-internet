import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple PNG icon using a minimal valid PNG structure
function createPNGIcon(size) {
  // This is a minimal valid PNG for the given size
  // It creates a simple colored square
  const width = size;
  const height = size;
  
  // PNG header
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A // PNG signature
  ]);
  
  // IHDR chunk (image header)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);      // width
  ihdrData.writeUInt32BE(height, 4);     // height
  ihdrData.writeUInt8(8, 8);             // bit depth
  ihdrData.writeUInt8(2, 9);             // color type (RGB)
  ihdrData.writeUInt8(0, 10);            // compression
  ihdrData.writeUInt8(0, 11);            // filter
  ihdrData.writeUInt8(0, 12);            // interlace
  
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  // Create a simple RGB image data (purple square)
  const pixelData = Buffer.alloc(width * height * 3);
  for (let i = 0; i < pixelData.length; i += 3) {
    pixelData[i] = 99;     // R (purple)
    pixelData[i + 1] = 102; // G (purple)
    pixelData[i + 2] = 241; // B (purple)
  }
  
  // Add filter bytes (0 for each scanline)
  const filteredData = Buffer.alloc(pixelData.length + height);
  for (let y = 0; y < height; y++) {
    filteredData[y * (width * 3 + 1)] = 0; // filter type
    pixelData.copy(filteredData, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  }
  
  const idatChunk = createChunk('IDAT', filteredData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  
  const chunkData = Buffer.concat([typeBuffer, data]);
  const crcValue = calculateCRC(chunkData);
  crc.writeUInt32BE(crcValue, 0);
  
  return Buffer.concat([length, chunkData, crc]);
}

function calculateCRC(buffer) {
  // Simple CRC32 implementation
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Create icons for all sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'client', 'public', 'assets', 'icons');

sizes.forEach(size => {
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  const pngData = createPNGIcon(size);
  fs.writeFileSync(iconPath, pngData);
  console.log(`Created ${size}x${size} icon`);
});

console.log('All PNG icons created successfully!'); 