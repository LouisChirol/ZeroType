#!/usr/bin/env python3
"""
Generate simple icon files for ZeroType extension
"""

import os

from PIL import Image, ImageDraw, ImageFont


def create_icon(size, filename):
    """Create a simple microphone icon"""
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors
    mic_color = (102, 126, 234, 255)  # Blue color from the extension theme
    bg_color = (255, 255, 255, 255)   # White background
    
    # Create circular background
    margin = size // 8
    draw.ellipse([margin, margin, size-margin, size-margin], fill=bg_color)
    
    # Draw microphone shape
    mic_width = size // 6
    mic_height = size // 3
    mic_x = (size - mic_width) // 2
    mic_y = size // 4
    
    # Microphone body (rounded rectangle)
    draw.rounded_rectangle([mic_x, mic_y, mic_x + mic_width, mic_y + mic_height], 
                          radius=mic_width//2, fill=mic_color)
    
    # Microphone stand
    stand_width = mic_width // 3
    stand_height = size // 6
    stand_x = (size - stand_width) // 2
    stand_y = mic_y + mic_height
    
    draw.rectangle([stand_x, stand_y, stand_x + stand_width, stand_y + stand_height], 
                   fill=mic_color)
    
    # Base
    base_width = mic_width * 2
    base_height = size // 20
    base_x = (size - base_width) // 2
    base_y = stand_y + stand_height
    
    draw.rectangle([base_x, base_y, base_x + base_width, base_y + base_height], 
                   fill=mic_color)
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename}")

if __name__ == "__main__":
    # Create icons directory if it doesn't exist
    os.makedirs('icons', exist_ok=True)
    
    # Generate different sizes
    create_icon(16, 'icons/icon16.png')
    create_icon(48, 'icons/icon48.png')  
    create_icon(128, 'icons/icon128.png')
    
    print("All icons created successfully!") 