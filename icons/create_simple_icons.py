#!/usr/bin/env python3
"""
Create simple SVG icons for ZeroType extension that can be converted to PNG
This doesn't require PIL/Pillow
"""

import os


def create_svg_icon(size, filename):
    """Create a simple microphone SVG icon"""
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Circular background -->
  <circle cx="{size//2}" cy="{size//2}" r="{size//2 - size//8}" fill="white" stroke="#667eea" stroke-width="2"/>
  
  <!-- Microphone body -->
  <rect x="{size//2 - size//12}" y="{size//4}" width="{size//6}" height="{size//3}" 
        rx="{size//12}" ry="{size//12}" fill="#667eea"/>
  
  <!-- Microphone stand -->
  <rect x="{size//2 - size//18}" y="{size//4 + size//3}" width="{size//9}" height="{size//6}" fill="#667eea"/>
  
  <!-- Base -->
  <rect x="{size//2 - size//6}" y="{size//4 + size//3 + size//6}" width="{size//3}" height="{size//20}" 
        rx="{size//40}" ry="{size//40}" fill="#667eea"/>
</svg>'''
    
    with open(filename, 'w') as f:
        f.write(svg_content)
    print(f"Created {filename}")

if __name__ == "__main__":
    # Generate SVG icons
    create_svg_icon(16, 'icons/icon16.svg')
    create_svg_icon(48, 'icons/icon48.svg')  
    create_svg_icon(128, 'icons/icon128.svg')
    
    print("SVG icons created! For the extension to work properly, you'll need to:")
    print("1. Convert these SVG files to PNG format using an online converter")
    print("2. Or install Pillow with: pip3 install Pillow")
    print("3. Then run: python3 icons/create_icons.py") 