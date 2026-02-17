import { shell } from 'electron';
import { notifyLaravel, goToUrl, appendWindowIdToUrl, resolveUrl } from '../../utils.js';
import state from '../../state.js';

const MENUBAR_WINDOW_ID = 'menubar';

function triggerMenuItemEvent(menuItem, combo) {
    notifyLaravel('events', {
        event: menuItem.event || '\\Native\\Desktop\\Events\\Menu\\MenuItemClicked',
        payload: {
            item: {
                id: menuItem.id,
                label: menuItem.label,
                checked: menuItem.checked,
            },
            combo,
        },
    });
}

export function compileMenu (item) {
    if (item.submenu) {
        if (Array.isArray(item.submenu)) {
            item.submenu = item.submenu?.map(compileMenu);
        } else {
            item.submenu = item.submenu.submenu?.map(compileMenu);
        }
    }

    if (item.type === 'link') {
        item.type = 'normal';

        item.click = (menuItem, focusedWindow, combo) => {
            triggerMenuItemEvent(item, combo);

            if (item.openInBrowser) {
                shell.openExternal(item.url);
                return;
            }

            // Find target window: focused BrowserWindow, or menubar popup when context menu is shown from tray
            let windowId = focusedWindow
                ? Object.keys(state.windows).find(key => state.windows[key] === focusedWindow)
                : null;

            if (!windowId && state.activeMenuBar?.window) {
                const menubarWindow = state.activeMenuBar.window;
                const absoluteUrl = resolveUrl(item.url);
                menubarWindow.loadURL(appendWindowIdToUrl(absoluteUrl, MENUBAR_WINDOW_ID));
                menubarWindow.show();
                menubarWindow.focus();
                return;
            }

            if (windowId) {
                goToUrl(item.url, windowId);
            }
        }

        return item;
    }

    if (item.type === 'checkbox' || item.type === 'radio') {
        item.click = (menuItem, focusedWindow, combo) => {
            item.checked = !item.checked;
            triggerMenuItemEvent(item, combo);
        };

        return item;
    }

    if (item.type === 'role') {
        let menuItem = {
            role: item.role
        };

        if (item.label) {
            menuItem['label'] = item.label;
        }

        return menuItem;
    }

    // Default click event
    if (! item.click) {
        item.click = (menuItem, focusedWindow, combo) => {
            triggerMenuItemEvent(item, combo);
        }
    }

    return item;
}
