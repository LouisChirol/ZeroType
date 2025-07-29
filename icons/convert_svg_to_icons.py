#!/usr/bin/env python3
"""
Convert zerotype_icon.svg to PNG icons for browser extension
"""

import os
import subprocess
import sys
from pathlib import Path

def check_dependencies():
    """Check if required tools are available"""
    tools = ['rsvg-convert', 'inkscape', 'convert']  # ImageMagick convert
    available_tool = None
    
    for tool in tools:
        try:
            subprocess.run([tool, '--version'], capture_output=True, check=True)
            available_tool = tool
            print(f"Using {tool} for SVG conversion")
            break
        except (subprocess.CalledProcessError, FileNotFoundError):
            continue
    
    if not available_tool:
        print("Error: No SVG conversion tool found!")
        print("Please install one of the following:")
        print("- librsvg2-bin (for rsvg-convert): sudo apt install librsvg2-bin")
        print("- inkscape: sudo apt install inkscape")
        print("- imagemagick: sudo apt install imagemagick")
        sys.exit(1)
    
    return available_tool

def convert_svg_to_png(svg_file, output_file, size, tool):
    """Convert SVG to PNG with specified size"""
    if tool == 'rsvg-convert':
        cmd = ['rsvg-convert', '-w', str(size), '-h', str(size), svg_file, '-o', output_file]
    elif tool == 'inkscape':
        cmd = ['inkscape', svg_file, '--export-png', output_file, '-w', str(size), '-h', str(size)]
    elif tool == 'convert':  # ImageMagick
        cmd = ['convert', '-background', 'transparent', '-size', f'{size}x{size}', svg_file, output_file]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        print(f"Created {output_file} ({size}x{size})")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error creating {output_file}: {e}")
        return False

def main():
    # Check if SVG file exists
    svg_file = 'zerotype_icon.svg'
    if not os.path.exists(svg_file):
        print(f"Error: {svg_file} not found!")
        sys.exit(1)
    
    # Check dependencies
    tool = check_dependencies()
    
    # Define the sizes needed for browser extension
    sizes = [
        (16, 'icon16.png'),
        (48, 'icon48.png'),
        (128, 'icon128.png')
    ]
    
    success_count = 0
    for size, filename in sizes:
        if convert_svg_to_png(svg_file, filename, size, tool):
            success_count += 1
    
    if success_count == len(sizes):
        print(f"\nSuccessfully converted {svg_file} to all required PNG formats!")
        print("Your extension icons are ready to use.")
    else:
        print(f"\nWarning: Only {success_count}/{len(sizes)} icons were created successfully.")

if __name__ == "__main__":
    main() 