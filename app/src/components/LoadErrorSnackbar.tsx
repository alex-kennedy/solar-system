import React from "react";
import Snackbar, { SnackbarProps } from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";

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
        <MuiAlert elevation={6} variant="filled" severity="error">
          Asteroids failed to load! Sorry :(
        </MuiAlert>
      </Snackbar>
    );
  }
}
