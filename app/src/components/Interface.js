import { AppBar, Grid, Slide, Switch, Typography } from "@material-ui/core";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";

import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import Toolbar from "@material-ui/core/Toolbar";
import svgLogo from "./../images/logo.svg";

import React from "react";

// import MenuIcon from '@material-ui/icons/Menu'

const theme = createMuiTheme({
  palette: {
    primary: {
      light: "#8bf5ff",
      main: "#4fc2f7",
      dark: "#0092c4",
      contrastText: "#000",
    },
    secondary: {
      light: "#ffc4ff",
      main: "#ce93d8",
      dark: "#9c64a6",
      contrastText: "#000",
    },
  },
});

class Settings extends React.Component {
  state = {
    checked: false,
  };

  handleChange = () => {
    this.setState({ checked: !this.state.checked });
  };

  render() {
    const { checked } = this.state;

    return (
      <span>
        <Switch
          checked={checked}
          onChange={this.handleChange}
          aria-label="MenuCollapse"
        />
        <Slide direction="right" in={checked}>
          <Grid item xs={12} sm={8}>
            <Paper style={{ paddingBottom: "20px" }}>
              <AppBar
                position="static"
                color="primary"
                style={{ marginBottom: "20px" }}
              >
                <Toolbar>
                  <img
                    src={svgLogo}
                    alt="Site Logo"
                    height="50"
                    style={{ paddingRight: "20px" }}
                  />
                  <Typography variant="display1" color="inherit">
                    Solar System
                  </Typography>
                </Toolbar>
              </AppBar>

              <Typography align="center" variant="subheading">
                Hi! This project is in progress
                <Button
                  align="center"
                  color="action"
                  href="https://github.com/alex-kennedy/solar-system"
                >
                  GitHub
                </Button>
              </Typography>
            </Paper>
          </Grid>
        </Slide>
      </span>
    );
  }
}

function Interface() {
  return (
    <MuiThemeProvider theme={theme}>
      {/* <Button variant="fab" color="primary" aria-label="settings">
                <MenuIcon />
            </Button> */}
      <Settings />
    </MuiThemeProvider>
  );
}

export default Interface;
