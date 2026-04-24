import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_CONTAINER_API_URL || 'http://localhost:8080';

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

  // Add "Create New File" and "Create New Folder" only for directories
  if (isDirectory) {
    menuItems.push({ label: 'Create New File', action: () => handleCreateFile(path) });
    menuItems.push({ label: 'Create New Folder', action: () => handleCreateFolder(path) });
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
    await axios.post(`${API_URL}/deleteFileOrFolder`, {
      path: path,
    });
    console.log('Delete successful');
    alert('Delete successful! Please refresh the folder pane.');
    // Trigger a custom event to refresh folder structure
    window.dispatchEvent(new CustomEvent('refreshFolderStructure'));
  } catch (error: any) {
    console.error('Error deleting:', error);
    alert(error.response?.data?.error || 'Delete failed');
  }
}

async function handleCreateFile(folderPath: string) {
  const fileName = prompt('Enter file name:');
  if (!fileName) return;

  try {
    console.log(`Creating file ${fileName} in ${folderPath}`);
    await axios.post(`${API_URL}/createFile`, {
      parentPath: folderPath,
      fileName: fileName,
    });
    console.log('File creation successful');
    alert('File created successfully! Please refresh the folder pane.');
    // Trigger a custom event to refresh folder structure
    window.dispatchEvent(new CustomEvent('refreshFolderStructure'));
  } catch (error: any) {
    console.error('Error creating file:', error);
    alert(error.response?.data?.error || 'File creation failed');
  }
}

async function handleCreateFolder(folderPath: string) {
  const folderName = prompt('Enter folder name:');
  if (!folderName) return;

  try {
    console.log(`Creating folder ${folderName} in ${folderPath}`);
    await axios.post(`${API_URL}/createFolder`, {
      parentPath: folderPath,
      folderName: folderName,
    });
    console.log('Folder creation successful');
    alert('Folder created successfully! Please refresh the folder pane.');
    // Trigger a custom event to refresh folder structure
    window.dispatchEvent(new CustomEvent('refreshFolderStructure'));
  } catch (error: any) {
    console.error('Error creating folder:', error);
    alert(error.response?.data?.error || 'Folder creation failed');
  }
}
