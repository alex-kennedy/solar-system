import React from 'react';
import Button from '@material-ui/core/Button'
import MenuIcon from '@material-ui/icons/Menu'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';

const theme = createMuiTheme({
    palette: {
        primary: {
            light: '#8bf5ff',
            main: '#4fc2f7',
            dark: '#0092c4',
            contrastText: '#000'
        },
        secondary: {
            light: '#ffc4ff',
            main: '#ce93d8',
            dark: '#9c64a6',
            contrastText: '#000'
        }
    }
})

function Settings() {
    return (
        <Grid container spacing={24}>
            <Grid item xs={12} sm={6}>
                <Paper>
                    Hi there!
                </Paper>
            </Grid> 
        </Grid>
    )
}

function Interface() {
    return (
        <MuiThemeProvider theme={theme}>
            <Button variant="fab" color="primary" aria-label="settings" size="small">
                <MenuIcon />
            </Button>
            <Settings />
        </MuiThemeProvider>
    );
}

export default Interface;