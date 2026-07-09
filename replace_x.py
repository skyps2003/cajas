import os
import glob

files_to_fix = [
    'src/pages/contribuyentes/ContribuyentesRubrosPage.tsx',
    'src/pages/contribuyentes/ContribuyentesTiposCredencialesPage.tsx',
    'src/pages/contribuyentes/ContribuyentesTiposDocumentoPage.tsx',
    'src/pages/contribuyentes/ContribuyentesTiposTelefonoPage.tsx',
]

for filepath in files_to_fix:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if we need to add X to imports
    if 'import { ' in content and 'lucide-react' in content:
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'lucide-react' in line:
                if ' X,' not in line and '{ X,' not in line and ' X }' not in line:
                    lines[i] = line.replace('lucide-react', 'lucide-react').replace('{', '{ X,', 1)
                break
        content = '\n'.join(lines)
    
    # Replace the close button XCircle
    # I'll specifically replace `<XCircle size={18} />` right under the absolute button.
    # To be safe, I'll just replace `> \n              <XCircle size={18} />\n            </button>`
    # But wait, python's replace is easier.
    
    # Look for the close button section
    btn_class = 'className="absolute right-4 top-4 bg-slate-50 hover:bg-slate-200 dark:bg-[#1E2D3D] dark:hover:bg-[#2A3F54] text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 p-2 rounded-full transition-all duration-300 z-10 hover:rotate-90 shadow-sm border border-slate-200/60 dark:border-slate-700/50"'
    
    parts = content.split(btn_class)
    if len(parts) > 1:
        # the part right after the class should be `>\n              <XCircle size={18} />`
        # let's just replace `<XCircle size={18} />` with `<X size={18} />` ONLY if it comes right after `btn_class`
        after_btn = parts[1]
        parts[1] = after_btn.replace('<XCircle size={18} />', '<X size={18} />', 1)
        content = parts[0] + btn_class + parts[1]
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Fixed X icons in 4 files.')
