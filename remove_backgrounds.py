import os
from rembg import remove
from PIL import Image

folder = 'public/kids'
print(f"Buscando imagens em {folder}...")

for filename in os.listdir(folder):
    if filename.endswith('.png') and not filename.startswith('temp_'):
        input_path = os.path.join(folder, filename)
        temp_path = os.path.join(folder, "temp_" + filename)
        print(f"Removendo fundo de {filename}...")
        try:
            # open image
            img = Image.open(input_path)
            # remove bg
            out = remove(img)
            # ensure RGBA
            out = out.convert("RGBA")
            # save
            out.save(temp_path, "PNG")
            
            # replace original
            os.replace(temp_path, input_path)
            print(f"Sucesso: {filename}")
        except Exception as e:
            print(f"Erro em {filename}: {e}")

print("Conclusão do processamento transparente!")
