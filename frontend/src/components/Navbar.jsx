import * as React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import FillingForm from '../pages/FillingForm';
import Table from './Table';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/dotsito.png'
import TableV3 from './TableV3';
import PersonAddIcon from '@mui/icons-material/PersonAdd'; // New Candidate
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'; // Pending
import CancelIcon from '@mui/icons-material/Cancel'; // Rejected
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Submitted
import ScheduleIcon from '@mui/icons-material/Schedule'; // Schedule Job Log
import AssessmentIcon from '@mui/icons-material/Assessment';
import WorkIcon from '@mui/icons-material/Work';
import Report from '../pages/Report';
import AtsChecker from '../pages/AtsChecker';
import Atsicon from '@mui/icons-material/FactCheck';
// const menuItems = [
//     { text: 'New Candidate', icon: <PersonAddIcon sx={{ color: '#2760AD' }} /> },
//     { text: 'New/In Process', icon: <HourglassEmptyIcon sx={{ color: '#2760AD' }} /> },
//     { text: 'Rejected', icon: <CancelIcon sx={{ color: '#2760AD' }} /> },
//     { text: 'Submitted', icon: <CheckCircleIcon sx={{ color: '#2760AD' }} /> },
//     { text: 'Onboarded', icon: <WorkIcon sx={{ color: '#2760AD' }} /> },
//     { text: 'Report', icon: <AssessmentIcon sx={{ color: '#2760AD' }} /> },
//     // { text: 'Schedule Job Log', icon: <ScheduleIcon sx={{ color: '#2760AD' }} /> },
// ];

const menuItems = [
    { text: 'ATS Checker', icon: <Atsicon />, link: 'ats-checker',filter: 'null'},
    { text: 'Add a New Talent', icon: <PersonAddIcon />, link: 'add-a-new-talent', filter: null },
    { text: 'New Entries', icon: <HourglassEmptyIcon />, link: 'new-entries', filter: 'New' },
    { text: 'Confirmed Entries', icon: <CheckCircleIcon />, link: 'confirmed-entries', filter: 'Submitted' },
    { text: 'Failed Entries', icon: <CancelIcon />, link: 'failed-entries', filter: 'Error' },
    { text: 'Pending Interviews', icon: <WorkIcon />, link: 'pending-interviews', filter: 'Processing' },
    { text: 'Onboarded Talent', icon: <AssessmentIcon />, link: 'onboarded-talent', filter: 'Onboarded' },
    { text: 'Rejected Applicants', icon: <CancelIcon />, link: 'rejected-applicants', filter: 'Rejected' },
    { text: 'Report and Analysis', link: 'report', icon: <AssessmentIcon /> },
    // { text: 'Schedule Job Log', icon: <ScheduleIcon sx={{ color: '#2760AD' }} />, link: 'schedule-job-log' },
];


const drawerWidth = 250;

export default function Navbar() {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const { logout, user } = React.useContext(AuthContext)
    const handleClose = () => {
        setAnchorEl(null);
    };
    return (
        <Router>
            <Box sx={{ display: 'flex' }}>
                <CssBaseline />
                <AppBar color="" position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <Toolbar style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                        <img src={logo} alt="logo" style={{ width: '150px' }} />
                        {/* <Typography variant="h6" noWrap component="div">
                             &nbsp;
                           
                        </Typography> */}
                        <Tooltip title={user ? user.displayName : ''}>
                            <IconButton
                                onClick={handleClick}
                                size="small"
                                sx={{ ml: 2 }}
                                aria-controls={open ? 'account-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={open ? 'true' : undefined}
                            >
                                <Avatar
                                    style={{ backgroundColor: '#2760AD', color: '#fff', padding: '20px' }}
                                    sx={{ width: 32, height: 32 }}>{user ? user.displayName.charAt('0').toUpperCase() : 'U'}</Avatar>
                            </IconButton>
                        </Tooltip>
                        <Menu
                            anchorEl={anchorEl}
                            id="account-menu"
                            open={open}
                            onClose={handleClose}
                            onClick={handleClose}
                            PaperProps={{
                                elevation: 0,
                                sx: {
                                    overflow: 'visible',
                                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                    mt: 1.5,
                                    '& .MuiAvatar-root': {
                                        width: 32,
                                        height: 32,
                                        ml: -0.5,
                                        mr: 1,
                                    },
                                    '&::before': {
                                        content: '""',
                                        display: 'block',
                                        position: 'absolute',
                                        top: 0,
                                        right: 14,
                                        width: 10,
                                        height: 10,
                                        bgcolor: 'background.paper',
                                        transform: 'translateY(-50%) rotate(45deg)',
                                        zIndex: 0,
                                    },
                                },
                            }}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        >
                            <MenuItem onClick={handleClose} disabled>
                                <Avatar /> Profile
                            </MenuItem>
                            <MenuItem onClick={handleClose} disabled>
                                <Avatar /> My account
                            </MenuItem>
                            <Divider />
                            {/* <MenuItem onClick={handleClose}>
                                <ListItemIcon>
                                    <PersonAdd fontSize="small" />
                                </ListItemIcon>
                                Add another account
                            </MenuItem> */}
                            <MenuItem onClick={handleClose} disabled>
                                <ListItemIcon>
                                    <Settings fontSize="small" />
                                </ListItemIcon>
                                Settings
                            </MenuItem>
                            <MenuItem onClick={logout}>
                                <ListItemIcon>
                                    <Logout fontSize="small" />
                                </ListItemIcon>
                                Logout
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>

                <Drawer
                    variant="permanent"
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                    }}
                >
                    <Toolbar />
                    <Box sx={{ overflow: 'auto' }}>
                        <List>
                            {menuItems.map((item) => (
                                <ListItem key={item.text} disablePadding>
                                    <ListItemButton
                                        component={Link}
                                        to={`/${item.link}`}
                                    >
                                        <ListItemIcon sx={{ color: '#2760AD' }}>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText primary={item.text} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Drawer>
                <Box component="main" sx={{ flexGrow: 1, p: 2 }}>
                    <Toolbar />
                    <Routes>
                        <Route path="/*" element={<FillingForm />} />
                        <Route path="/newcandidate" element={<FillingForm />} />
                        <Route path="/editcandidate/:id" element={<FillingForm isUpdate={true} />} />
                        <Route path="/ats-checker" element={<AtsChecker />} />
                        {menuItems
                            .filter(item => item.filter)
                            .map(item => (
                                <Route
                                    key={item.link}
                                    path={`/${item.link}`}
                                    element={<TableV3 filter={item.filter} />}
                                />
                            ))}
                        <Route path="/report" element={<Report />} />
                        
                        {/* <Route path="/schedulejoblog" element={<TableV3 filter={'Schedule Job Log'} />} /> */}
                    </Routes>
                </Box>
            </Box>
        </Router >
    );
}