import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080';

export function handleFolderRightClick(
  path: string,
  isDirectory: boolean,
  xAxis: number,
  yAxis: number,
  onMenuClose?: () => void
) {
  // Remove any existing context menu
  const existingMenu = document.getElementById('context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  // Create context menu
  const menu = document.createElement('div');
  menu.id = 'context-menu';
  menu.className = 'fixed bg-[#252526] border border-[#3e3e42] rounded shadow-lg py-1 min-w-[160px]';
  menu.style.left = `${xAxis}px`;
  menu.style.top = `${yAxis}px`;
  menu.style.zIndex = '9999';

  // Menu items
  const menuItems = [
    { label: 'Rename', action: () => handleRename(path) },
    { label: 'Delete', action: () => handleDelete(path) },
  ];

  // Add "Create New File" only for directories
  if (isDirectory) {
    menuItems.push({ label: 'Create New File', action: () => handleCreateFile(path) });
  }

  // Create menu item elements
  menuItems.forEach((item) => {
    const menuItem = document.createElement('div');
    menuItem.className = 'px-4 py-2 text-sm text-[#cccccc] hover:bg-[#37373d] cursor-pointer';
    menuItem.textContent = item.label;
    menuItem.onclick = () => {
      item.action();
      menu.remove();
      if (onMenuClose) onMenuClose();
    };
    menu.appendChild(menuItem);
  });

  document.body.appendChild(menu);

  // Close menu on click outside
  const closeMenu = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
      if (onMenuClose) onMenuClose();
    }
  };

  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
}

async function handleRename(path: string) {
  const newName = prompt('Enter new name:', path.split('/').pop());
  if (!newName) return;

  try {
    console.log(`Renaming ${path} to ${newName}`);
    // Dummy API call
    await axios.post(`${API_URL}/rename`, {
      oldPath: path,
      newName: newName,
    });
    console.log('Rename successful');
    alert('Rename successful!');
  } catch (error) {
    console.error('Error renaming:', error);
    alert('Rename failed');
  }
}

async function handleDelete(path: string) {
  const confirmed = confirm(`Are you sure you want to delete ${path}?`);
  if (!confirmed) return;

  try {
    console.log(`Deleting ${path}`);
    // Dummy API call
    await axios.post(`${API_URL}/delete`, {
      path: path,
    });
    console.log('Delete successful');
    alert('Delete successful!');
  } catch (error) {
    console.error('Error deleting:', error);
    alert('Delete failed');
  }
}

async function handleCreateFile(folderPath: string) {
  const fileName = prompt('Enter file name:');
  if (!fileName) return;

  try {
    console.log(`Creating file ${fileName} in ${folderPath}`);
    // Dummy API call
    await axios.post(`${API_URL}/createFile`, {
      folderPath: folderPath,
      fileName: fileName,
    });
    console.log('File creation successful');
    alert('File created successfully!');
  } catch (error) {
    console.error('Error creating file:', error);
    alert('File creation failed');
  }
}
