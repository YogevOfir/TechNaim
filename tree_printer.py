import os

# List of directories to exclude
exclude_dirs = {'node_modules', 'web', 'assets', '.expo', '.git'}

def print_tree(root, prefix='', depth=4):
    if depth < 0:
        return
    items = [item for item in os.listdir(root) if item not in exclude_dirs]
    pointers = ['├── ' for _ in items[:-1]] + ['└── ']
    for pointer, item in zip(pointers, items):
        path = os.path.join(root, item)
        print(prefix + pointer + item)
        if os.path.isdir(path):
            extension = '│   ' if pointer == '├── ' else '    '
            print_tree(path, prefix + extension, depth - 1)

root_directory = "C:\\Users\\Yogev\\Desktop\\TechNaim"
print_tree(root_directory)
