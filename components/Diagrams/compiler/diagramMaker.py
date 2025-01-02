import os
import subprocess
import re
import sys

def extract_circuits_from_latex(latex_file):
    with open(latex_file, "r") as f:
        content = f.read()
    circuits = re.findall(r'\\begin{circuitikz}(.*?)\\end{circuitikz}', content, re.DOTALL)
    return circuits

def extract_labels(content, index):
    labels = re.findall(r'\\label\{(.*?)\}', content)
    label = labels[index] if index < len(labels) else f"circuit_{index}"
    print(f"Extracted label: {label}")  # Debug print
    return label

def generate_latex_circuit(circuit_code, label, output_dir):
    latex_code = f"""
    \\documentclass{{standalone}}
    \\usepackage{{circuitikz}}
    \\begin{{document}}
    \\begin{{circuitikz}}
    {circuit_code}
    \\end{{circuitikz}}
    \\end{{document}}
    """
    with open(os.path.join(output_dir, f"{label}.tex"), "w") as f:
        f.write(latex_code)

def compile_latex_to_pdf(label, output_dir):
    subprocess.run(["pdflatex", f"{label}.tex"], cwd=output_dir, check=True)

def convert_pdf_to_svg(label, output_dir, svg_dir):
    subprocess.run(["pdf2svg", f"{label}.pdf", os.path.join(svg_dir, f"{label}.svg")], cwd=output_dir, check=True)

def optimize_svg(label, svg_dir):
    try:
        subprocess.run(["svgo", os.path.join(svg_dir, f"{label}.svg")], check=True)
    except FileNotFoundError:
        print(f"Warning: 'svgo' not found. Skipping optimization for {label}.svg")

def clean_up(label, output_dir):
    extensions = ["tex", "pdf", "log", "aux", "out", "toc"]
    for ext in extensions:
        file_path = os.path.join(output_dir, f"{label}.{ext}")
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == "__main__":
    latex_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "diagrams.tex"))  # Corrected hardcoded path to the LaTeX file
    
    if not os.path.exists(latex_file):
        print(f"Error: The file {latex_file} does not exist.")
        sys.exit(1)
    
    output_dir = os.getcwd()
    svg_dir = os.path.join(output_dir, "../")
    os.makedirs(svg_dir, exist_ok=True)
    circuits = extract_circuits_from_latex(latex_file)
    content = open(latex_file, "r").read()
    for i, circuit in enumerate(circuits):
        label = extract_labels(content, i)
        print(f"Processing circuit {i} with label: {label}")  # Debug print
        generate_latex_circuit(circuit, label, output_dir)
        compile_latex_to_pdf(label, output_dir)
        convert_pdf_to_svg(label, output_dir, svg_dir)
        optimize_svg(label, svg_dir)
        clean_up(label, output_dir)