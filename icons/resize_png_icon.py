#!/usr/bin/env python3
"""
Resize png_icon_v2.png to create extension icons
"""

import os

from PIL import Image


def resize_image(input_file, output_file, size):
    """Resize image to specified size"""
    try:
        # Open the source image
        with Image.open(input_file) as img:
            # Resize with high quality resampling
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            # Save as PNG
            resized.save(output_file, 'PNG')
            print(f"Created {output_file} ({size}x{size})")
            return True
    except Exception as e:
        print(f"Error creating {output_file}: {e}")
        return False

def main():
    input_file = 'icon.png'
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found!")
        return
    
    # Define the sizes needed for browser extension
    sizes = [
        (16, 'icon16.png'),
        (48, 'icon48.png'),
        (128, 'icon128.png')
    ]
    
    success_count = 0
    for size, filename in sizes:
        if resize_image(input_file, filename, size):
            success_count += 1
    
    if success_count == len(sizes):
        print(f"\nSuccessfully created all {len(sizes)} extension icons from {input_file}!")
    else:
        print(f"\nWarning: Only {success_count}/{len(sizes)} icons were created successfully.")

if __name__ == "__main__":
    main()
