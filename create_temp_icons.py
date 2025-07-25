#!/usr/bin/env python3
"""
Create basic PNG icons without external dependencies
"""
import struct


def create_simple_png(width, height, color, filename):
    """Create a simple solid color PNG file"""
    
    def png_pack(png_tag, data):
        chunk_head = png_tag + data
        return struct.pack("!I", len(data)) + chunk_head + struct.pack("!I", 0xFFFFFFFF & zlib.crc32(chunk_head))

    import zlib

    # PNG file signature
    png_signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr = struct.pack("!2I5B", width, height, 8, 2, 0, 0, 0)
    ihdr_chunk = png_pack(b"IHDR", ihdr)
    
    # Create simple pixel data (RGB)
    r, g, b = color
    row = bytes([r, g, b] * width)
    raw_data = b"".join(b"\x00" + row for y in range(height))
    
    # IDAT chunk
    compressor = zlib.compressobj()
    png_data = compressor.compress(raw_data)
    png_data += compressor.flush()
    idat_chunk = png_pack(b"IDAT", png_data)
    
    # IEND chunk
    iend_chunk = png_pack(b"IEND", b"")
    
    # Write PNG file
    with open(filename, "wb") as f:
        f.write(png_signature)
        f.write(ihdr_chunk)
        f.write(idat_chunk)
        f.write(iend_chunk)
    
    print(f"Created {filename}")

if __name__ == "__main__":
    # Create simple blue icons (matching our theme color)
    blue_color = (102, 126, 234)  # #667eea
    
    create_simple_png(16, 16, blue_color, "icons/icon16.png")
    create_simple_png(48, 48, blue_color, "icons/icon48.png")
    create_simple_png(128, 128, blue_color, "icons/icon128.png")
    
    print("Temporary PNG icons created! You can now test the extension.") 