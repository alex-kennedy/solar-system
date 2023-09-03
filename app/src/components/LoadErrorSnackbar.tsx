import React from "react";
import { Snackbar, SnackbarProps } from "@mui/material";
import { Alert } from '@mui/material';

type LoadErrorSnackbarProps = {
  open: boolean;
  handleClose: SnackbarProps["onClose"];
};

export default class LoadErrorSnackbar extends React.Component<LoadErrorSnackbarProps> {
  render() {
    return (
      <Snackbar
        open={this.props.open}
        onClose={this.props.handleClose}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        autoHideDuration={5000}
      >
        <Alert elevation={6} variant="filled" severity="error">
          Asteroids failed to load! Sorry :(
        </Alert>
      </Snackbar>
    );
  }
}
