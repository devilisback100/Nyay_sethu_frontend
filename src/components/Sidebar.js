import { VStack, Icon, Tooltip } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

export function Sidebar() {
    return (
        <VStack className="sidebar">
            <SidebarItem
                to="/admin/dashboard"
                icon={DashboardIcon}
                label="Dashboard"
            />
            <SidebarItem
                to="/admin/users"
                icon={UsersIcon}
                label="Users"
            />
            <SidebarItem
                to="/admin/cases"
                icon={CasesIcon}
                label="Cases"
            />
            {/* Add more menu items */}
        </VStack>
    );
}

const SidebarItem = ({ to, icon, label }) => (
    <Tooltip label={label} placement="right">
        <Link to={to} className="sidebar-item">
            <Icon as={icon} boxSize={6} />
        </Link>
    </Tooltip>
);

// SVG Icons components
const DashboardIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
    </svg>
);

const UsersIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const CasesIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
);

