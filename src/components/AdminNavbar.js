import { Box, Flex, Avatar, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import './AdminNavbar.css';

export function AdminNavbar() {
    return (
        <Box className="admin-navbar">
            <Flex justify="flex-end" align="center" h="100%">
                <Menu>
                    <MenuButton>
                        <Avatar size="sm" name="Admin User" />
                    </MenuButton>
                    <MenuList>
                        <MenuItem>Profile</MenuItem>
                        <MenuItem>Settings</MenuItem>
                        <MenuItem>Logout</MenuItem>
                    </MenuList>
                </Menu>
            </Flex>
        </Box>
    );
}

