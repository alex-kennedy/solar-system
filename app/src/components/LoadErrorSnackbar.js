import React from "react";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default class LoadErrorSnackbar extends React.Component {
  render() {
    return (
      <Snackbar
        open={this.props.open}
        onClose={this.props.handleClose}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        autoHideDuration={5000}
      >
        <Alert onClose={this.props.handleClose} severity="error">
          Asteroids failed to load! Sorry :(
        </Alert>
      </Snackbar>
    );
  }
}
