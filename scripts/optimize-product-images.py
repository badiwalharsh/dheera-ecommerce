import os
import shutil
from PySide6.QtCore import Qt, QRect, QPoint
from PySide6.QtGui import QImage, QPainter, QColor

def setup_directories():
    os.makedirs('public/images/products/originals', exist_ok=True)
    os.makedirs('public/images/banners/originals', exist_ok=True)

def backup_originals():
    # Products
    for i in range(1, 7):
        src = f'public/images/products/product-{i}.jpg'
        dest = f'public/images/products/originals/product-{i}.jpg'
        if os.path.exists(src) and not os.path.exists(dest):
            shutil.copy2(src, dest)
            print(f'Preserved original: {dest}')

    # Banners
    banners = ['category-kurta.jpg', 'category-saree.jpg', 'category-suit.jpg', 'category-dupatta.jpg', 'hero-editorial.jpg']
    for b in banners:
        src = f'public/images/banners/{b}'
        dest = f'public/images/banners/originals/{b}'
        if os.path.exists(src) and not os.path.exists(dest):
            shutil.copy2(src, dest)
            print(f'Preserved original banner: {dest}')

def enhance_portrait_product(src_path, out_path, detail_path, fabric_path, target_w=1200, target_h=1600):
    orig = QImage(src_path)
    ow, oh = orig.width(), orig.height()
    print(f'Processing {src_path} ({ow}x{oh})...')

    # 1. Main Portrait Master (1200 x 1600, 3:4 aspect ratio)
    # Scale to match height 1600 with smooth Lanczos
    scaled_w = int(1600 * (ow / oh))
    scaled_h = 1600
    scaled = orig.scaled(scaled_w, scaled_h, Qt.AspectRatioMode.IgnoreAspectRatio, Qt.TransformationMode.SmoothTransformation)

    # Center crop to 1200x1600
    crop_x = max(0, (scaled_w - target_w) // 2)
    master = scaled.copy(crop_x, 0, target_w, target_h)
    master.save(out_path, 'JPEG', 94)
    print(f'  Created portrait master: {out_path} ({target_w}x{target_h}, {os.path.getsize(out_path)} bytes)')

    # 2. Detail View (Neckline / Yoke & Embroidery focus, upper-middle 1200x1600)
    # Crop upper 60% of original, centered
    detail_crop_w = int(ow * 0.70)
    detail_crop_h = int(oh * 0.65)
    detail_x = (ow - detail_crop_w) // 2
    detail_y = int(oh * 0.10)
    detail_orig = orig.copy(detail_x, detail_y, detail_crop_w, detail_crop_h)
    detail_master = detail_orig.scaled(target_w, target_h, Qt.AspectRatioMode.KeepAspectRatioByExpanding, Qt.TransformationMode.SmoothTransformation)
    detail_crop_x = (detail_master.width() - target_w) // 2
    detail_crop_y = (detail_master.height() - target_h) // 2
    detail_final = detail_master.copy(detail_crop_x, detail_crop_y, target_w, target_h)
    detail_final.save(detail_path, 'JPEG', 94)
    print(f'  Created detail view: {detail_path} ({target_w}x{target_h}, {os.path.getsize(detail_path)} bytes)')

    # 3. Fabric & Weave View (Middle / Hemline / Texture focus)
    fabric_crop_w = int(ow * 0.65)
    fabric_crop_h = int(oh * 0.65)
    fabric_x = (ow - fabric_crop_w) // 2
    fabric_y = int(oh * 0.35)
    fabric_orig = orig.copy(fabric_x, fabric_y, fabric_crop_w, fabric_crop_h)
    fabric_master = fabric_orig.scaled(target_w, target_h, Qt.AspectRatioMode.KeepAspectRatioByExpanding, Qt.TransformationMode.SmoothTransformation)
    fabric_crop_x = (fabric_master.width() - target_w) // 2
    fabric_crop_y = (fabric_master.height() - target_h) // 2
    fabric_final = fabric_master.copy(fabric_crop_x, fabric_crop_y, target_w, target_h)
    fabric_final.save(fabric_path, 'JPEG', 94)
    print(f'  Created fabric view: {fabric_path} ({target_w}x{target_h}, {os.path.getsize(fabric_path)} bytes)')

def enhance_banners():
    category_banners = ['category-kurta.jpg', 'category-saree.jpg', 'category-suit.jpg', 'category-dupatta.jpg']
    for b in category_banners:
        src = f'public/images/banners/originals/{b}'
        dest = f'public/images/banners/{b}'
        orig = QImage(src)
        # Category banners 1200x600 (2:1 landscape)
        scaled = orig.scaled(1200, 600, Qt.AspectRatioMode.KeepAspectRatioByExpanding, Qt.TransformationMode.SmoothTransformation)
        crop_x = (scaled.width() - 1200) // 2
        crop_y = (scaled.height() - 600) // 2
        final = scaled.copy(crop_x, crop_y, 1200, 600)
        final.save(dest, 'JPEG', 94)
        print(f'Enhanced banner: {dest} (1200x600, {os.path.getsize(dest)} bytes)')

    # Hero editorial: 1920x1080
    hero_src = 'public/images/banners/originals/hero-editorial.jpg'
    hero_dest = 'public/images/banners/hero-editorial.jpg'
    hero_orig = QImage(hero_src)
    scaled_hero = hero_orig.scaled(1920, 1080, Qt.AspectRatioMode.KeepAspectRatioByExpanding, Qt.TransformationMode.SmoothTransformation)
    crop_x = (scaled_hero.width() - 1920) // 2
    crop_y = (scaled_hero.height() - 1080) // 2
    final_hero = scaled_hero.copy(crop_x, crop_y, 1920, 1080)
    final_hero.save(hero_dest, 'JPEG', 94)
    print(f'Enhanced hero: {hero_dest} (1920x1080, {os.path.getsize(hero_dest)} bytes)')

def main():
    setup_directories()
    backup_originals()

    for i in range(1, 7):
        src = f'public/images/products/originals/product-{i}.jpg'
        out = f'public/images/products/product-{i}.jpg'
        detail = f'public/images/products/product-{i}-detail.jpg'
        fabric = f'public/images/products/product-{i}-fabric.jpg'
        enhance_portrait_product(src, out, detail, fabric)

    enhance_banners()
    print('All product and banner assets enhanced successfully!')

if __name__ == '__main__':
    main()
